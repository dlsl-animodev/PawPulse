import { getDashboardData } from './actions'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

type OwnerAppointment = {
  id: string
  scheduled_at: string
  status: string
  vet_notes?: string | null
  veterinarians: {
    name: string
    specialty: string
  }
  pets?: {
    id: string
    name: string
    species: string
  } | null
}

type Prescription = {
  id: string
  medication_name: string
  dosage: string
  status: string
  instructions?: string
}

type MedicationOrder = {
  id: string
  medication_name: string
  quantity: number
  status: string
  ordered_at: string
}

type VetAppointment = {
  id: string
  scheduled_at: string
  status: string
  vet_notes?: string | null
  owner?: {
    id?: string
    full_name?: string
    email?: string
  }
  pets?: {
    id: string
    name: string
    species: string
  } | null
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ booked?: string }> }) {
  const dashboardData = await getDashboardData()
  const user = dashboardData.user
  const profile = dashboardData.profile
  const patientAppointments = (dashboardData.patientAppointments || []) as OwnerAppointment[]
  const prescriptions = (dashboardData.prescriptions || []) as Prescription[]
  const medicationOrders = (dashboardData.medicationOrders || []) as MedicationOrder[]
  const doctorAppointments = (dashboardData.doctorAppointments || []) as VetAppointment[]
  const doctorProfile = dashboardData.doctorProfile
  const latestAppointment = dashboardData.latestAppointment as OwnerAppointment | null
  const pets = dashboardData.pets || []

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const showSuccess = resolvedSearchParams?.booked === 'true'

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email,
        is_anonymous: user.is_anonymous,
        user_metadata: user.user_metadata,
      }}
      profile={profile}
      patientAppointments={patientAppointments}
      prescriptions={prescriptions}
      medicationOrders={medicationOrders}
      doctorAppointments={doctorAppointments}
      doctorProfile={doctorProfile}
      latestAppointment={latestAppointment}
      showSuccess={showSuccess}
      pets={pets}
    />
  )
}
