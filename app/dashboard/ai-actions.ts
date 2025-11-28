'use server'

import { createClient } from '@/utils/supabase/server'
import { buildSanitizedPrompt } from '@/utils/ai/redactor'
import { revalidatePath } from 'next/cache'
import { GoogleGenAI } from '@google/genai'

type QuickActionIntent = 'prescription' | 'previsit' | 'next_steps'

async function callGeminiModel(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return null

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    return response.text?.trim() || null
  } catch (error) {
    console.error('Gemini API error:', error)
    throw error
  }
}

function craftSummary(intent: QuickActionIntent, sanitizedContext: string) {
  const headers: Record<QuickActionIntent, string> = {
    prescription: 'Medication questions and safety checks',
    previsit: 'Symptom snapshot for your upcoming visit',
    next_steps: 'Actionable follow-up plan',
  }

  const closingNotes =
    'This guidance is AI-generated and should be reviewed with your care team before making medical decisions.'

  return `${headers[intent]}\n\n${sanitizedContext}\n\n${closingNotes}`
}

function buildPromptForIntent(intent: QuickActionIntent, sanitizedContext: string) {
  const systemPrompts: Record<QuickActionIntent, string> = {
    prescription: `You are a helpful medical assistant. Based on the patient's context below, provide clear guidance about their prescription medications. Include:
- Purpose of each medication
- Proper timing and dosage reminders
- Common side effects to watch for
- Drug interaction warnings if applicable
Keep the response concise and patient-friendly.`,
    previsit: `You are a helpful medical assistant preparing a patient for their upcoming consultation. Based on the context below, create a structured symptom summary that includes:
- Main concerns and symptoms
- Duration and severity
- Relevant medical history mentioned
- Questions the patient should ask their doctor
Keep it organized and easy for both patient and doctor to review.`,
    next_steps: `You are a helpful medical assistant. Based on the consultation context below, create a clear follow-up action plan that includes:
- Key takeaways from the visit
- Medications or treatments to follow
- Lifestyle recommendations if any
- When to schedule follow-up appointments
- Warning signs that require immediate attention
Keep the response actionable and easy to follow.`,
  }

  return `${systemPrompts[intent]}

Patient Context (sanitized for privacy):
${sanitizedContext}

Please provide your guidance:`
}

export async function generateGeminiSummary(params: {
  intent: QuickActionIntent
  context: string
  appointmentId?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to use AI assistance.' }
  }

  const { sanitizedContext } = buildSanitizedPrompt({
    intent: params.intent,
    context: params.context,
    identifiers: {
      fullName: user.user_metadata?.full_name,
      email: user.email,
      patientId: user.id,
    },
  })

  const prompt = buildPromptForIntent(params.intent, sanitizedContext)
  let summary = craftSummary(params.intent, sanitizedContext)

  try {
    const aiDraft = await callGeminiModel(prompt)
    summary = aiDraft || summary
  } catch (error) {
    console.error('Gemini generation failed, using fallback template', error)
  }

  revalidatePath('/dashboard')

  return { summary, sanitizedContext }
}
