"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addAppointmentNotes(
  appointmentId: string,
  notes: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // security: verify the user is the doctor for this appointment
  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    return { error: "Only doctors can add consultation notes" };
  }

  // verify this appointment belongs to this doctor
  const { data: appointment } = await supabase
    .from("appointments")
    .select("doctor_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment || appointment.doctor_id !== doctor.id) {
    return { error: "You do not have permission to modify this appointment" };
  }

  const { error } = await supabase
    .from("appointments")
    .update({ notes, status: "completed" })
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
  patientId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // get doctor id from user
  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctor) {
    return { error: "Doctor profile not found" };
  }

  // security: verify the doctor has an appointment with this patient
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctor.id)
    .eq("patient_id", data.patientId)
    .single();

  if (!appointment) {
    return { error: "You can only prescribe to patients you have appointments with" };
  }

  const { error } = await supabase.from("prescriptions").insert({
    patient_id: data.patientId,
    doctor_id: doctor.id,
    medication_name: data.medicationName,
    dosage: data.dosage,
    instructions: data.instructions,
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
    .select("patient_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) {
    return { error: "Appointment not found" };
  }

  if (appointment.patient_id !== user.id) {
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

  const { data: doctorProfile, error: doctorError } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (doctorError || !doctorProfile) {
    return { error: "Doctor profile not found" };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, doctor_id, patient_id, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError || !appointment) {
    return { error: "Appointment not found" };
  }

  if (appointment.doctor_id !== doctorProfile.id) {
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
        doctor_id: doctorProfile.id,
        patient_id: appointment.patient_id,
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
