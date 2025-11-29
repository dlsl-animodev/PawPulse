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

  const isVeterinarian = profile?.role === "veterinarian";

  // fetch appointment with all related data
  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      `
      *,
      veterinarians(id, name, specialty, image_url),
      owner:owner_id(id, full_name, email),
      pets(id, name, species, breed)
    `
    )
    .eq("id", id)
    .single();

  if (!appointment) {
    notFound();
  }

  // verify access - owner can only see their own, veterinarian can see their appointments
  if (!isVeterinarian && appointment.owner_id !== user.id) {
    redirect("/dashboard");
  }

  // if veterinarian, verify it's their appointment
  if (isVeterinarian) {
    const { data: vetProfile } = await supabase
      .from("veterinarians")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (appointment.veterinarian_id !== vetProfile?.id) {
      redirect("/dashboard");
    }
  }

  // get prescriptions for this appointment
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*, veterinarians(name)")
    .eq("appointment_id", appointment.id)
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
      isVeterinarian={isVeterinarian}
      currentUserId={user.id}
      chatRoom={chatRoom}
      chatMessages={chatMessages}
    />
  );
}
