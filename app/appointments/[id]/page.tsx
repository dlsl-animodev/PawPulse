import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AppointmentDetails } from "./appointment-details";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isDoctor = profile?.role === "doctor";

  // fetch appointment with all related data
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `
      *,
      doctors(id, name, specialty, image_url),
      patient:patient_id(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (!appointment) {
    notFound();
  }

  // verify access - patient can only see their own, doctor can see their patients
  if (!isDoctor && appointment.patient_id !== user.id) {
    redirect("/dashboard");
  }

  // if doctor, verify it's their appointment
  if (isDoctor) {
    const { data: doctorProfile } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (appointment.doctor_id !== doctorProfile?.id) {
      redirect("/dashboard");
    }
  }

  // get prescriptions for this appointment (based on patient and around appointment date)
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*, doctors(name)")
    .eq("patient_id", appointment.patient_id)
    .order("created_at", { ascending: false });

  const { data: chatRoom } = await supabase
    .from("chat_rooms")
    .select("id, status")
    .eq("appointment_id", id)
    .maybeSingle();

  let chatMessages: {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
  }[] = [];

  if (chatRoom) {
    const { data: messages } = await supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at")
      .eq("room_id", chatRoom.id)
      .order("created_at", { ascending: true });

    chatMessages = messages || [];
  }

  return (
    <AppointmentDetails
      appointment={appointment}
      prescriptions={prescriptions || []}
      isDoctor={isDoctor}
      currentUserId={user.id}
      chatRoom={chatRoom}
      chatMessages={chatMessages}
    />
  );
}
