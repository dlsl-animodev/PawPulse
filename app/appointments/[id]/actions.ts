"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addAppointmentNotes(
  appointmentId: string,
  vetNotes: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // security: verify the user is the veterinarian for this appointment
  const { data: vet } = await supabase
    .from("veterinarians")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!vet) {
    return { error: "Only veterinarians can add consultation notes" };
  }

  // verify this appointment belongs to this veterinarian
  const { data: appointment } = await supabase
    .from("appointments")
    .select("veterinarian_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment || appointment.veterinarian_id !== vet.id) {
    return { error: "You do not have permission to modify this appointment" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ vet_notes: vetNotes, status: "completed" })
    .eq("id", appointmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createPrescription(data: {
  appointmentId: string;
  petId: string;
  ownerId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  petWeightKg?: number;
  frequency?: string;
  duration?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // get veterinarian id from user
  const { data: vet } = await supabase
    .from("veterinarians")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!vet) {
    return { error: "Veterinarian profile not found" };
  }

  // validate pet_id - it's required for prescriptions
  const petId = data.petId && data.petId.trim() !== "" ? data.petId : null;
  if (!petId) {
    return { error: "A pet must be selected to create a prescription" };
  }

  // security: verify the veterinarian is assigned to this specific appointment
  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, owner_id, pet_id")
    .eq("id", data.appointmentId)
    .eq("veterinarian_id", vet.id)
    .single();

  if (appointmentError || !appointment) {
    console.error("Prescription security check failed:", appointmentError);
    return { error: "You can only prescribe for appointments assigned to you" };
  }

  const ownerId = appointment.owner_id;

  const { error } = await supabase.from("prescriptions").insert({
    pet_id: petId,
    owner_id: ownerId,
    veterinarian_id: vet.id,
    appointment_id: data.appointmentId,
    medication_name: data.medicationName,
    dosage: data.dosage,
    instructions: data.instructions,
    pet_weight_kg: data.petWeightKg || null,
    frequency: data.frequency || null,
    duration: data.duration || null,
    status: "active",
    refills_remaining: 3,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // security: verify the user owns this appointment
  const { data: appointment } = await supabase
    .from("appointments")
    .select("owner_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { error: "Appointment not found" };
  }

  if (appointment.owner_id !== user.id) {
    return { error: "You do not have permission to cancel this appointment" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function confirmAppointment(appointmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: vetProfile, error: vetError } = await supabase
    .from("veterinarians")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (vetError || !vetProfile) {
    return { error: "Veterinarian profile not found" };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, veterinarian_id, owner_id, pet_id, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return { error: "Appointment not found" };
  }

  if (appointment.veterinarian_id !== vetProfile.id) {
    return { error: "You are not assigned to this appointment" };
  }

  if (appointment.status !== "confirmed") {
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointmentId);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  const { data: existingRoom, error: roomLookupError } = await supabase
    .from("chat_rooms")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (roomLookupError) {
    return { error: roomLookupError.message };
  }

  let roomId = existingRoom?.id || null;

  if (!existingRoom) {
    const { data: newRoom, error: insertError } = await supabase
      .from("chat_rooms")
      .insert({
        appointment_id: appointmentId,
        veterinarian_id: vetProfile.id,
        owner_id: appointment.owner_id,
        pet_id: appointment.pet_id,
        status: "open",
      })
      .select("id")
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    roomId = newRoom?.id || null;
  } else if (existingRoom.status !== "open") {
    const { error: reopenError } = await supabase
      .from("chat_rooms")
      .update({ status: "open" })
      .eq("id", existingRoom.id);

    if (reopenError) {
      return { error: reopenError.message };
    }
  }

  revalidatePath("/appointments");
  revalidatePath(`/appointments/${appointmentId}`);
  revalidatePath("/dashboard");

  return { success: true, roomId };
}
