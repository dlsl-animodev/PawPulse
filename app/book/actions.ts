"use server";

import { createClient } from "@/utils/supabase/server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

export type Veterinarian = {
  id: string;
  user_id: string | null;
  clinic_id: string | null;
  name: string;
  specialty: string;
  species_treated: string[];
  license_number: string | null;
  bio: string | null;
  image_url: string | null;
  years_experience: number | null;
  is_available: boolean;
  created_at: string;
  vet_clinics?: {
    id: string;
    name: string;
    city: string | null;
    emergency_services: boolean;
  } | null;
};

// backwards compatibility alias
export type Doctor = Veterinarian;

export async function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return apiKey;
}

const createAppointmentSchema = z.object({
  veterinarianId: z.string().uuid({ message: "Choose a valid veterinarian." }),
  petId: z.string().uuid({ message: "Choose a valid pet." }).optional().nullable().transform(val => val || undefined),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  symptoms: z.string().min(5, "Please describe your pet's symptoms or reason for visit."),
  visitType: z.enum(["checkup", "vaccination", "surgery", "grooming", "emergency", "dental", "follow_up", "other"]).default("checkup"),
});

const guestPreConsultSchema = z.object({
  veterinarianId: z.string().uuid({ message: "Choose a valid veterinarian." }),
  petName: z.string().min(1, "Pet name is required.").optional(),
  petSpecies: z.string().min(1, "Species is required.").optional(),
  petBreed: z.string().optional(),
  petAge: z.string().optional(),
  petWeightKg: z.coerce.number().positive().optional(),
  symptoms: z.string().min(10, "Share a brief description of your pet's symptoms."),
  goal: z
    .string()
    .min(5, "Let us know what you want to achieve from this visit.")
    .max(500)
    .optional(),
  urgency: z.enum(["low", "normal", "urgent"]).default("normal"),
});

async function getOrCreateGuestToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("guest_session_token")?.value;

  if (existing) return existing;

  const token = randomUUID();
  cookieStore.set({
    name: "guest_session_token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return token;
}

export async function getVeterinarians(): Promise<Veterinarian[]> {
  const supabase = await createClient();

  const { data: veterinarians, error } = await supabase
    .from("veterinarians")
    .select(`
      *,
      vet_clinics (
        id,
        name,
        city,
        emergency_services
      )
    `)
    .eq("is_available", true)
    .order("name");

  if (error) {
    console.error("Error fetching veterinarians:", error);
    return [];
  }

  return veterinarians ?? [];
}

// backwards compatibility alias
export const getDoctors = getVeterinarians;

export async function getVeterinarianById(id: string): Promise<Veterinarian | null> {
  const supabase = await createClient();
  const { data: veterinarian, error } = await supabase
    .from("veterinarians")
    .select(`
      *,
      vet_clinics (
        id,
        name,
        city,
        emergency_services
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching veterinarian:", error);
    return null;
  }

  return veterinarian;
}

// backwards compatibility alias
export const getDoctorById = getVeterinarianById;

export async function createGuestPreConsult(formData: FormData) {
  const guestToken = await getOrCreateGuestToken();
  const supabase = await createClient({ guestToken });

  const parsed = guestPreConsultSchema.safeParse({
    veterinarianId: formData.get("veterinarianId") || formData.get("doctorId"),
    petName: formData.get("petName"),
    petSpecies: formData.get("petSpecies"),
    petBreed: formData.get("petBreed"),
    petAge: formData.get("petAge"),
    petWeightKg: formData.get("petWeightKg"),
    symptoms: formData.get("symptoms"),
    goal: formData.get("goal"),
    urgency: formData.get("urgency") ?? "normal",
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Please review your answers.";
    return { error: message };
  }

  const { error } = await supabase.from("guest_pre_consults").insert({
    session_token: guestToken,
    veterinarian_id: parsed.data.veterinarianId,
    pet_name: parsed.data.petName,
    pet_species: parsed.data.petSpecies,
    pet_breed: parsed.data.petBreed,
    pet_age: parsed.data.petAge,
    pet_weight_kg: parsed.data.petWeightKg,
    symptoms: parsed.data.symptoms,
    goal: parsed.data.goal,
    urgency: parsed.data.urgency,
  });

  if (error) {
    console.error("Error saving guest pre-consult:", error);
    return { error: "Unable to save your pre-consultation right now." };
  }

  return { success: true };
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient();

  const veterinarianId = (formData.get("veterinarianId") || formData.get("doctorId")) as string | null;
  const petId = formData.get("petId") as string | null;
  const date = formData.get("date") as string | null;
  const time = formData.get("time") as string | null;
  const symptoms = (formData.get("symptoms") || formData.get("notes")) as string | null;
  const visitType = formData.get("visitType") as string | null;

  const parsed = createAppointmentSchema.safeParse({
    veterinarianId: veterinarianId || undefined,
    petId: petId || undefined,
    date: date || undefined,
    time: time || undefined,
    symptoms: symptoms || undefined,
    visitType: visitType || "checkup",
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Invalid appointment details.";
    return { error: message };
  }

  const scheduledAt = new Date(
    `${parsed.data.date}T${parsed.data.time}:00`
  );

  if (Number.isNaN(scheduledAt.getTime())) {
    return { error: "Invalid appointment date or time." };
  }

  const { data: { user } = { user: null } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to book an appointment" };
  }

  // check if user is anonymous - they need to register first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      error: "Please create an account to book appointments",
      requiresRegistration: true,
      redirectTo: `/signup?upgrade=true&next=/book/${parsed.data.veterinarianId}`,
    };
  }

  const { error } = await supabase.from("appointments").insert({
    owner_id: user.id,
    pet_id: parsed.data.petId || null,
    veterinarian_id: parsed.data.veterinarianId,
    scheduled_at: scheduledAt.toISOString(),
    symptoms: parsed.data.symptoms,
    visit_type: parsed.data.visitType,
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

export async function revalidateVeterinarians() {
  revalidatePath("/book");
}

// backwards compatibility alias
export const revalidateDoctors = revalidateVeterinarians;
