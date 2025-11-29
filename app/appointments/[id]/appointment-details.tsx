"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pill,
  Send,
  Stethoscope,
  User,
  X,
  AlertCircle,
  FilePlus2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addAppointmentNotes,
  createPrescription,
  cancelAppointment,
  confirmAppointment,
} from "./actions";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type Appointment = {
  id: string;
  scheduled_at: string;
  status: string;
  vet_notes?: string | null;
  symptoms?: string | null;
  visit_type?: string | null;
  veterinarians: {
    id: string;
    name: string;
    specialty: string;
    image_url?: string | null;
  };
  owner: {
    id: string;
    full_name: string;
    email: string;
  };
  pets?: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
  } | null;
};

type Prescription = {
  id: string;
  medication_name: string;
  dosage: string;
  instructions?: string | null;
  status: string;
  created_at: string;
  veterinarians?: {
    name: string;
  };
};

type ChatRoom = {
  id: string;
  status: string;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

interface AppointmentDetailsProps {
  appointment: Appointment;
  prescriptions: Prescription[];
  isVeterinarian: boolean;
  currentUserId: string;
  chatRoom: ChatRoom | null;
  chatMessages: ChatMessage[];
}

export function AppointmentDetails({
  appointment,
  prescriptions,
  isVeterinarian,
  currentUserId,
  chatRoom,
  chatMessages,
}: AppointmentDetailsProps) {
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [notes, setNotes] = useState(appointment.vet_notes || "");
  const [prescriptionData, setPrescriptionData] = useState({
    medication: "",
    dosage: "",
    instructions: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  const appointmentDate = new Date(appointment.scheduled_at);
  const isPast = appointmentDate < new Date();
  const isUpcoming =
    !isPast &&
    appointment.status !== "cancelled" &&
    appointment.status !== "completed";
  const chatPartnerName = isVeterinarian
    ? appointment.owner.full_name
    : `Dr. ${appointment.veterinarians.name}`;

  const statusColors: Record<string, string> = {
    scheduled: "bg-yellow-100 text-yellow-800",
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    if (!chatRoom?.id) return;

    const channel = supabase
      .channel(`chat-room-${chatRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${chatRoom.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((message) => message.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoom?.id, supabase]);

  useEffect(() => {
    if (!autoScrollEnabled) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, autoScrollEnabled]);

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceFromBottom < 64);
  }

  async function handleSaveNotes() {
    setIsSubmitting(true);
    await addAppointmentNotes(appointment.id, notes);
    setIsSubmitting(false);
    setShowNotesModal(false);
  }

  async function handleCreatePrescription() {
    if (!prescriptionData.medication.trim()) return;
    setIsSubmitting(true);

    const result = await createPrescription({
      appointmentId: appointment.id,
      petId: appointment.pets?.id || "",
      ownerId: appointment.owner.id,
      medicationName: prescriptionData.medication,
      dosage: prescriptionData.dosage,
      instructions: prescriptionData.instructions,
    });    setIsSubmitting(false);
    setShowPrescriptionModal(false);
    setPrescriptionData({ medication: "", dosage: "", instructions: "" });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Prescription for ${prescriptionData.medication} created successfully`);

    // send a chat message about the prescription if chat room is open
    if (chatRoom?.id && chatRoom.status === "open") {
      const prescriptionMessage = `New Prescription Created\n\nMedication: ${prescriptionData.medication}\nDosage: ${prescriptionData.dosage}${prescriptionData.instructions ? `\nInstructions: ${prescriptionData.instructions}` : ""}\n\nYou can order this medication from the pharmacy through your dashboard.`;

      await supabase.from("chat_messages").insert({
        room_id: chatRoom.id,
        sender_id: currentUserId,
        content: prescriptionMessage,
      });
    }

    router.refresh();
  }

  async function handleCancelAppointment() {
    setIsSubmitting(true);
    await cancelAppointment(appointment.id);
    setIsSubmitting(false);
    setShowCancelModal(false);
  }

  async function handleConfirmAppointment() {
    setIsConfirming(true);
    const result = await confirmAppointment(appointment.id);
    setIsConfirming(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Appointment confirmed. Chat is now open.");
    router.refresh();
  }

  async function handleSendMessage() {
    if (!chatRoom?.id || !messageInput.trim()) return;
    setIsSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      room_id: chatRoom.id,
      sender_id: currentUserId,
      content: messageInput.trim(),
    });
    setIsSending(false);

    if (error) {
      toast.error("Unable to send message. Please try again.");
      return;
    }

    setMessageInput("");
    setAutoScrollEnabled(true);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* notes modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowNotesModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Consultation Notes</CardTitle>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                Add notes for {appointment.pets?.name || appointment.owner.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter diagnosis, recommendations, follow-up instructions..."
                rows={6}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSubmitting}
                className="w-full hover:cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Notes & Mark Complete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* prescription modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPrescriptionModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>New Prescription</CardTitle>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                For {appointment.pets?.name || appointment.owner.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Medication Name</Label>
                <Input
                  value={prescriptionData.medication}
                  onChange={(e) =>
                    setPrescriptionData((p) => ({
                      ...p,
                      medication: e.target.value,
                    }))
                  }
                  placeholder="e.g., Amoxicillin 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  value={prescriptionData.dosage}
                  onChange={(e) =>
                    setPrescriptionData((p) => ({
                      ...p,
                      dosage: e.target.value,
                    }))
                  }
                  placeholder="e.g., 1 tablet 3x daily for 7 days"
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={prescriptionData.instructions}
                  onChange={(e) =>
                    setPrescriptionData((p) => ({
                      ...p,
                      instructions: e.target.value,
                    }))
                  }
                  placeholder="Take with food. Complete full course..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreatePrescription}
                disabled={isSubmitting || !prescriptionData.medication}
                className="w-full bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FilePlus2 className="h-4 w-4 mr-2" />
                )}
                Create Prescription
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelModal(false)}
          />
          <Card className="relative z-10 w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Cancel Appointment</CardTitle>
                  <CardDescription>
                    This action cannot be undone
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to cancel your appointment with{" "}
                {isVeterinarian
                  ? appointment.owner.full_name
                  : `Dr. ${appointment.veterinarians.name}`}{" "}
                on {appointmentDate.toLocaleDateString()} at{" "}
                {appointmentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                ?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 hover:cursor-pointer"
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelAppointment}
                  disabled={isSubmitting}
                  className="flex-1 hover:cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 hover:cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Details
            </h1>
            <p className="text-gray-600">
              {isVeterinarian
                ? `Pet: ${appointment.pets?.name || "Unknown"} (Owner: ${appointment.owner.full_name})`
                : `With Dr. ${appointment.veterinarians.name}`}
            </p>
          </div>
          <Badge
            className={`${
              statusColors[appointment.status] || "bg-gray-100 text-gray-800"
            } px-4 py-2 text-sm capitalize`}
          >
            {appointment.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* appointment card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Appointment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">
                      {appointmentDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold">
                      {appointmentDate.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {appointment.symptoms && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-1">Symptoms</p>
                  <p className="text-gray-700">{appointment.symptoms}</p>
                </div>
              )}

              {/* veterinarian/owner info */}
              <div className="pt-4 border-t">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    {isVeterinarian ? (
                      <User className="h-8 w-8 text-blue-600" />
                    ) : (
                      <Stethoscope className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {isVeterinarian ? "Pet Owner" : "Veterinarian"}
                    </p>
                    <p className="font-bold text-lg">
                      {isVeterinarian
                        ? appointment.owner.full_name
                        : `Dr. ${appointment.veterinarians.name}`}
                    </p>
                    {!isVeterinarian && (
                      <p className="text-blue-600 font-medium">
                        {appointment.veterinarians.specialty}
                      </p>
                    )}
                    {isVeterinarian && appointment.pets && (
                      <p className="text-gray-600 mt-1">
                        Pet: {appointment.pets.name} ({appointment.pets.species})
                      </p>
                    )}
                    {isVeterinarian && (
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <Mail className="h-4 w-4" />
                        {appointment.owner.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* actions for upcoming appointments */}
              {isUpcoming && (
                <div className="pt-4 border-t flex flex-wrap gap-3">
                  {isVeterinarian ? (
                    <>
                      {appointment.status === "pending" && (
                        <Button
                          onClick={handleConfirmAppointment}
                          disabled={isConfirming}
                          className="bg-green-600 hover:bg-green-700 hover:cursor-pointer"
                        >
                          {isConfirming ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Confirm & Open Chat
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowNotesModal(true)}
                        className="hover:cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Notes & Complete
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPrescriptionModal(true)}
                        className="hover:cursor-pointer"
                      >
                        <FilePlus2 className="h-4 w-4 mr-2" />
                        Write Prescription
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => setShowCancelModal(true)}
                      className="hover:cursor-pointer"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* consultation notes */}
          {appointment.vet_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Consultation Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {appointment.vet_notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* prescriptions from this visit */}
          {prescriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {rx.medication_name}
                        </p>
                        <p className="text-sm text-gray-600">{rx.dosage}</p>
                        {rx.instructions && (
                          <p className="text-sm text-gray-500 mt-1">
                            {rx.instructions}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Prescribed{" "}
                          {new Date(rx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        rx.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {rx.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Care Chat
              </CardTitle>
              <CardDescription>
                Real-time messaging with {chatPartnerName} is available once
                this visit is confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointment.status !== "confirmed" ? (
                <div className="border border-dashed border-yellow-200 bg-yellow-50 rounded-2xl p-4 text-sm text-yellow-800">
                  Chat opens after the veterinarian confirms this appointment. You
                  will receive an instant chat window here.
                </div>
              ) : !chatRoom ? (
                <div className="border border-dashed border-blue-200 bg-blue-50 rounded-2xl p-4 text-sm text-blue-800">
                  Setting up your chat room. Please refresh in a moment.
                </div>
              ) : (
                <div className="flex flex-col h-112">
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 overflow-y-auto space-y-4 pr-2"
                  >
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-6">
                        No messages yet. Say hello to start the conversation.
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage =
                          message.sender_id === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                                isOwnMessage
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p>{message.content}</p>
                              <div
                                className={`mt-1 text-[11px] ${
                                  isOwnMessage
                                    ? "text-white/70"
                                    : "text-gray-500"
                                }`}
                              >
                                {isOwnMessage ? "You" : chatPartnerName} •{" "}
                                {new Date(
                                  message.created_at
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSendMessage();
                    }}
                    className="mt-4 flex gap-3"
                  >
                    <Input
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      placeholder={`Message ${chatPartnerName}`}
                      disabled={isSending}
                      className="rounded-2xl"
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          {/* quick info card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">PetCare Veterinary Center</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">Duration: ~30 minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* help card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                For any questions about your appointment, contact our support
                team.
              </p>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full hover:cursor-pointer"
                >
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
