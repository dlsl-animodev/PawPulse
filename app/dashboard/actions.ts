'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ownerAppointments: [], prescriptions: [], medicationOrders: [], reminders: [], vetAppointments: [], profile: null, vetProfile: null, user: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // pet owner view
  if (profile?.role !== 'veterinarian') {
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        veterinarians (
          name,
          specialty,
          image_url
        ),
        pets (
          id,
          name,
          species
        )
      `)
      .eq('owner_id', user.id)
      .order('scheduled_at', { ascending: true })

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select(`
        *,
        pets (
          id,
          name,
          species
        )
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    // fetch medication orders
    const { data: medicationOrders } = await supabase
      .from('medication_orders')
      .select(`
        *,
        pets (
          id,
          name
        )
      `)
      .eq('owner_id', user.id)
      .order('ordered_at', { ascending: false })

    // fetch reminders
    const { data: reminders } = await supabase
      .from('reminders')
      .select(`
        *,
        pets (
          id,
          name
        )
      `)
      .eq('owner_id', user.id)
      .eq('is_read', false)
      .order('remind_at', { ascending: true })

    // fetch user's pets
    const { data: pets } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('name')

    // get the most recent appointment for ai context
    const latestAppointment = appointments?.[0] || null

    return {
      ownerAppointments: appointments || [],
      prescriptions: prescriptions || [],
      medicationOrders: medicationOrders || [],
      reminders: reminders || [],
      pets: pets || [],
      vetAppointments: [],
      vetProfile: null,
      profile,
      user,
      latestAppointment,
      // backwards compatibility
      patientAppointments: appointments || [],
      doctorAppointments: [],
      doctorProfile: null,
    }
  }

  // veterinarian view - look up vet by user_id
  const { data: vetProfile } = await supabase
    .from('veterinarians')
    .select(`
      *,
      vet_clinics (
        id,
        name,
        city
      )
    `)
    .eq('user_id', user.id)
    .maybeSingle()

  const vetId = vetProfile?.id

  const { data: vetAppointments } = vetId
    ? await supabase
        .from('appointments')
        .select(`
          *,
          owner:owner_id (
            id,
            full_name,
            email
          ),
          pets (
            id,
            name,
            species,
            breed,
            weight_kg
          ),
          veterinarians (
            name,
            specialty
          )
        `)
        .eq('veterinarian_id', vetId)
        .order('scheduled_at', { ascending: true })
    : { data: [] }

  return {
    ownerAppointments: [],
    prescriptions: [],
    medicationOrders: [],
    reminders: [],
    pets: [],
    vetAppointments: vetAppointments || [],
    vetProfile: vetProfile || null,
    profile,
    user,
    latestAppointment: null,
    // backwards compatibility
    patientAppointments: [],
    doctorAppointments: vetAppointments || [],
    doctorProfile: vetProfile || null,
  }
}

// veterinarian actions
export async function addAppointmentNotes(appointmentId: string, vetNotes: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ vet_notes: vetNotes, status: 'completed' })
    .eq('id', appointmentId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createPrescription(data: {
  petId: string
  ownerId: string
  appointmentId?: string
  medicationName: string
  dosage: string
  instructions: string
  petWeightKg?: number
  frequency?: string
  duration?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // get veterinarian id
  const { data: vet } = await supabase
    .from('veterinarians')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vet) {
    return { error: 'Veterinarian profile not found' }
  }

  const { error } = await supabase.from('prescriptions').insert({
    pet_id: data.petId,
    owner_id: data.ownerId,
    veterinarian_id: vet.id,
    appointment_id: data.appointmentId || null,
    medication_name: data.medicationName,
    dosage: data.dosage,
    instructions: data.instructions,
    pet_weight_kg: data.petWeightKg || null,
    frequency: data.frequency || null,
    duration: data.duration || null,
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
export async function orderMedication(prescriptionId: string, medicationName: string, petId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.from('medication_orders').insert({
    owner_id: user.id,
    pet_id: petId || null,
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
    .select(`
      *,
      pets (
        id,
        name
      )
    `)
    .eq('owner_id', user.id)
    .order('ordered_at', { ascending: false })

  return orders || []
}
