'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { patientAppointments: [], prescriptions: [], medicationOrders: [], reminders: [], doctorAppointments: [], profile: null, doctorProfile: null, user: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // patient view
  if (profile?.role !== 'doctor') {
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors (
          name,
          specialty,
          image_url
        )
      `)
      .eq('patient_id', user.id)
      .order('date', { ascending: true })

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    // fetch medication orders
    const { data: medicationOrders } = await supabase
      .from('medication_orders')
      .select('*')
      .eq('patient_id', user.id)
      .order('ordered_at', { ascending: false })

    // fetch reminders
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('patient_id', user.id)
      .eq('is_active', true)
      .order('time', { ascending: true })

    // get the most recent appointment for ai context
    const latestAppointment = appointments?.[0] || null

    return {
      patientAppointments: appointments || [],
      prescriptions: prescriptions || [],
      medicationOrders: medicationOrders || [],
      reminders: reminders || [],
      doctorAppointments: [],
      doctorProfile: null,
      profile,
      user,
      latestAppointment,
    }
  }

  // doctor view - look up doctor by user_id (proper link)
  const { data: doctorProfile } = await supabase
    .from('doctors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const doctorId = doctorProfile?.id

  const { data: doctorAppointments } = doctorId
    ? await supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id (
            id,
            full_name,
            email
          ),
          doctors (
            name,
            specialty
          )
        `)
        .eq('doctor_id', doctorId)
        .order('date', { ascending: true })
    : { data: [] }

  return {
    patientAppointments: [],
    prescriptions: [],
    medicationOrders: [],
    reminders: [],
    doctorAppointments: doctorAppointments || [],
    doctorProfile: doctorProfile || null,
    profile,
    user,
    latestAppointment: null,
  }
}

// doctor actions
export async function addAppointmentNotes(appointmentId: string, notes: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ notes, status: 'completed' })
    .eq('id', appointmentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createPrescription(data: {
  patientId: string
  medicationName: string
  dosage: string
  instructions: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // get doctor id
  const { data: doctor } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!doctor) {
    return { error: 'Doctor profile not found' }
  }

  const { error } = await supabase.from('prescriptions').insert({
    patient_id: data.patientId,
    doctor_id: doctor.id,
    medication_name: data.medicationName,
    dosage: data.dosage,
    instructions: data.instructions,
    status: 'active',
    refills_remaining: 3,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// medication ordering
export async function orderMedication(prescriptionId: string, medicationName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('medication_orders').insert({
    patient_id: user.id,
    prescription_id: prescriptionId,
    medication_name: medicationName,
    quantity: 1,
    status: 'pending',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getMedicationOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: orders } = await supabase
    .from('medication_orders')
    .select('*')
    .eq('patient_id', user.id)
    .order('ordered_at', { ascending: false })

  return orders || []
}
