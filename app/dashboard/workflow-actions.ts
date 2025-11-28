'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const refillSchema = z.object({
  prescriptionId: z.string().uuid({ message: 'Missing prescription id.' }),
  note: z.string().max(500, 'Note is too long.').optional(),
})

async function getAuthedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: 'You must be signed in to perform this action.' }
  }

  return { supabase, user }
}

export async function requestRefill(payload: unknown) {
  const parsed = refillSchema.safeParse(payload)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid refill request.'
    return { error: message }
  }

  const authed = await getAuthedClient()
  if ('error' in authed) {
    return { error: authed.error }
  }


  const { error } = await authed.supabase
    .from('prescriptions')
    .update({ status: 'active' })
    .eq('id', parsed.data.prescriptionId)
    .eq('patient_id', authed.user.id)

  if (error) {
    console.error('Error processing refill request:', error)
    return { error: 'We could not submit your refill request. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true, message: 'Refill request submitted successfully!' }
}

export async function cancelAppointment(appointmentId: string) {
  const authed = await getAuthedClient()
  if ('error' in authed) {
    return { error: authed.error }
  }

  const { error } = await authed.supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('patient_id', authed.user.id)

  if (error) {
    console.error('Error cancelling appointment:', error)
    return { error: 'Unable to cancel appointment. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeAppointment(appointmentId: string) {
  const authed = await getAuthedClient()
  if ('error' in authed) {
    return { error: authed.error }
  }

  // check if user is a doctor
  const { data: profile } = await authed.supabase
    .from('profiles')
    .select('role')
    .eq('id', authed.user.id)
    .single()

  if (profile?.role !== 'doctor') {
    return { error: 'Only doctors can mark appointments as completed.' }
  }

  const { error } = await authed.supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error completing appointment:', error)
    return { error: 'Unable to complete appointment. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
