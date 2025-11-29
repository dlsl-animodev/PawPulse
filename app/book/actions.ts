"use server";

import { createClient } from '@/utils/supabase/server'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
};

export async function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return apiKey;
}

const createAppointmentSchema = z.object({
  doctorId: z.string().uuid({ message: "Choose a valid doctor." }),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  notes: z.string().min(5, "Please add a brief note about your visit."),
});

const guestPreConsultSchema = z.object({
  doctorId: z.string().uuid({ message: 'Choose a valid doctor.' }),
  symptoms: z.string().min(10, 'Share a brief description of your symptoms.'),
  goal: z.string().min(5, 'Let us know what you want to achieve from this visit.').max(500).optional(),
  urgency: z.enum(['low', 'normal', 'urgent']).default('normal'),
})

async function getOrCreateGuestToken() {
  const cookieStore = await cookies()
  const existing = cookieStore.get('guest_session_token')?.value

  if (existing) return existing

  const token = randomUUID()
  cookieStore.set({
    name: 'guest_session_token',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  })

  return token
}

export async function getDoctors(): Promise<Doctor[]> {
  const supabase = await createClient();

  const { data: doctors, error } = await supabase
    .from("doctors")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }

  return doctors ?? [];
}

export async function getDoctorById(id: string) {
  const supabase = await createClient();
  const { data: doctor, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching doctor:", error);
    return null;
  }

  return doctor;
}

export async function createGuestPreConsult(formData: FormData) {
  const guestToken = await getOrCreateGuestToken()
  const supabase = await createClient({ guestToken })

  const parsed = guestPreConsultSchema.safeParse({
    doctorId: formData.get('doctorId'),
    symptoms: formData.get('symptoms'),
    goal: formData.get('goal'),
    urgency: formData.get('urgency') ?? 'normal',
  })

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Please review your answers.'
    return { error: message }
  }

  const { error } = await supabase.from('guest_pre_consults').insert({
    session_token: guestToken,
    doctor_id: parsed.data.doctorId,
    symptoms: parsed.data.symptoms,
    goal: parsed.data.goal,
    urgency: parsed.data.urgency,
  })

  if (error) {
    console.error('Error saving guest pre-consult:', error)
    return { error: 'Unable to save your pre-consultation right now.' }
  }

  return { success: true }
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();

  const parsed = createAppointmentSchema.safeParse({
    doctorId: formData.get("doctorId"),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Invalid appointment details.";
    return { error: message };
  }

  const appointmentDate = new Date(
    `${parsed.data.date}T${parsed.data.time}:00`
  );

  if (Number.isNaN(appointmentDate.getTime())) {
    return { error: "Invalid appointment date or time." };
  }

  const { data: { user } = { user: null } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to book an appointment" };
  }

  // check if user is anonymous - they need to register first
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous")
    .eq("id", user.id)
    .single();

  if (profile?.is_anonymous) {
    return {
      error: "Please create an account to book appointments",
      requiresRegistration: true,
      redirectTo: `/signup?upgrade=true&next=/book/${parsed.data.doctorId}`,
    };
  }

  const { error } = await supabase.from("appointments").insert({
    patient_id: user.id,
    doctor_id: parsed.data.doctorId,
    date: appointmentDate.toISOString(),
    notes: parsed.data.notes,
    status: "pending",
  });

  if (error) {
    console.error("Error creating appointment:", error);
    return {
      error: "Unable to create appointment right now. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  redirect("/dashboard?booked=true");
}

export async function revalidateDoctors() {
  revalidatePath("/book");
}