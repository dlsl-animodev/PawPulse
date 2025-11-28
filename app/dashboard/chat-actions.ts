'use server'

import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'

export async function sendChatMessage(message: string, conversationHistory: { role: string; content: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to use AI chat.' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { error: 'AI service is not configured.' }
  }

  // get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // get all prescriptions with doctor info
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select(`
      medication_name,
      dosage,
      instructions,
      status,
      created_at,
      doctors(name, specialty)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })

  // get all appointments with doctor info
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      status,
      notes,
      doctors(name, specialty)
    `)
    .eq('patient_id', user.id)
    .order('date', { ascending: false })

  // get medication orders
  const { data: medicationOrders } = await supabase
    .from('medication_orders')
    .select('medication_name, status, ordered_at')
    .eq('patient_id', user.id)
    .order('ordered_at', { ascending: false })
    .limit(5)

  // build comprehensive patient context
  const patientName = profile?.full_name || user.user_metadata?.full_name || 'Patient'

  const activeMeds = prescriptions?.filter(p => p.status === 'active') || []
  const prescriptionContext = activeMeds.length > 0
    ? activeMeds.map(p => {
        const doc = p.doctors as unknown as { name: string; specialty: string } | null
        return `- ${p.medication_name} (${p.dosage}): ${p.instructions || 'No specific instructions'}. Prescribed by Dr. ${doc?.name || 'Unknown'} (${doc?.specialty || 'Specialist'})`
      }).join('\n')
    : 'No active prescriptions'

  const upcomingAppts = appointments?.filter(a => new Date(a.date) >= new Date()) || []
  const pastAppts = appointments?.filter(a => new Date(a.date) < new Date()).slice(0, 3) || []

  const upcomingContext = upcomingAppts.length > 0
    ? upcomingAppts.map(a => {
        const doc = a.doctors as unknown as { name: string; specialty: string } | null
        return `- ${new Date(a.date).toLocaleDateString()} at ${new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with Dr. ${doc?.name || 'Unknown'} (${doc?.specialty || 'Specialist'}) - Status: ${a.status}`
      }).join('\n')
    : 'No upcoming appointments'

  const pastContext = pastAppts.length > 0
    ? pastAppts.map(a => {
        const doc = a.doctors as unknown as { name: string; specialty: string } | null
        return `- ${new Date(a.date).toLocaleDateString()} with Dr. ${doc?.name || 'Unknown'} (${doc?.specialty || 'Specialist'})${a.notes ? ` - Notes: ${a.notes}` : ''}`
      }).join('\n')
    : 'No past appointments'

  const ordersContext = medicationOrders?.length
    ? medicationOrders.map(o => `- ${o.medication_name}: ${o.status} (ordered ${new Date(o.ordered_at).toLocaleDateString()})`).join('\n')
    : 'No recent medication orders'

  const systemInstruction = `You are CareLink AI, ${patientName}'s personal healthcare assistant. You have complete access to their medical information and should provide personalized, helpful guidance.

  YOUR PATIENT: ${patientName}

  CURRENT MEDICATIONS:
  ${prescriptionContext}

  UPCOMING APPOINTMENTS:
  ${upcomingContext}

  RECENT MEDICAL HISTORY:
  ${pastContext}

  MEDICATION ORDERS:
  ${ordersContext}

  CARELINK PLATFORM FEATURES (help users navigate the app):
  - **Dashboard**: Your home screen showing upcoming appointments, active prescriptions, medication orders, and health reminders
  - **Book Appointment**: Click "Book Appointment" in the navigation bar or go to /book to browse available doctors and schedule visits
  - **View Appointment Details**: Click any appointment card to see full details, doctor notes, and prescriptions from that visit
  - **Order Medication**: On your dashboard, click "Order Medication" next to any active prescription to have it delivered
  - **Track Orders**: View your medication order status (pending, processing, shipped, delivered) on the dashboard
  - **AI Health Assistant**: That's me! I can help with health questions, explain your medications, remind you about appointments, and guide you through CareLink
  - **Sign Out**: Click your profile/name in the top navigation bar, then click "Sign Out"
  - **Support**: Click the "?" button in the bottom right corner for help and FAQs

  HOW TO USE CARELINK (step by step):
  1. Sign up/Login at /login or /signup
  2. Browse doctors at /book - see their specialties and book appointments
  3. View your dashboard to see all appointments and prescriptions
  4. After a doctor visit, check your dashboard for new prescriptions
  5. Order medications directly from your prescriptions
  6. Chat with me anytime for health guidance!

  GUIDELINES:
  - Address the patient by name when appropriate
  - Reference their specific medications, appointments, and doctors
  - Provide personalized advice based on their actual medical data
  - Format responses clearly with bullet points or numbered lists when helpful
  - Keep responses warm, supportive, and easy to understand
  - For medication questions, refer to their specific prescriptions and dosages
  - For appointment questions, refer to their actual scheduled visits
  - When asked about CareLink features, provide clear step-by-step guidance
  - Always remind them to consult their doctor for medical decisions
  - For emergencies, advise calling 911 immediately

  Remember: You have their complete medical context - use it to give specific, personalized answers, not generic advice. You ARE CareLink's AI assistant - never say CareLink is "not available" or "coming soon" because YOU are the CareLink assistant and the platform is fully functional!`

  try {
    const ai = new GoogleGenAI({ apiKey })

    // build chat history - map assistant to model for gemini
    const history = conversationHistory.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.content }]
    }))

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      config: {
        systemInstruction,
      },
      history,
    })

    const response = await chat.sendMessage({ message })
    const aiResponse = response.text

    if (!aiResponse) {
      return { error: 'No response generated. Please try again.' }
    }

    return { response: aiResponse }
  } catch (error) {
    console.error('AI Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // handle quota error specifically
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return { error: 'AI service is temporarily busy. Please try again in a moment.' }
    }

    return { error: `Failed to get response: ${errorMessage}` }
  }
}