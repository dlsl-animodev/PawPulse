"use client";

import { useState, useEffect } from "react";
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
  Bell,
  Calendar,
  Check,
  ClipboardList,
  Clock,
  FilePlus2,
  History,
  Loader2,
  NotebookPen,
  Package,
  Pill,
  Plus,
  ShoppingCart,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { AiChatPanel } from "./ai-chat";
import { SupportModal } from "@/components/support-modal";
import { Pet } from "@/lib/types/pet";
import {
  addAppointmentNotes,
  createPrescription,
  orderMedication,
} from "./actions";

type OwnerAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  vet_notes?: string | null;
  veterinarians: {
    name: string;
    specialty: string;
  };
  pets?: {
    id: string;
    name: string;
    species: string;
  } | null;
};

type Prescription = {
  id: string;
  medication_name: string;
  dosage: string;
  status: string;
  instructions?: string;
};

type MedicationOrder = {
  id: string;
  medication_name: string;
  quantity: number;
  status: string;
  ordered_at: string;
};

type VetAppointment = {
  id: string;
  scheduled_at: string;
  status: string;
  vet_notes?: string | null;
  owner?: {
    full_name?: string;
    email?: string;
    id?: string;
  };
  pets?: {
    id: string;
    name: string;
    species: string;
  } | null;
};

interface DashboardClientProps {
  user: {
    id?: string;
    email?: string;
    is_anonymous?: boolean;
    user_metadata?: {
      full_name?: string;
    };
  };
  profile: {
    role?: string;
    id?: string;
    full_name?: string;
  } | null;
  patientAppointments: OwnerAppointment[];
  prescriptions: Prescription[];
  medicationOrders: MedicationOrder[];
  doctorAppointments: VetAppointment[];
  doctorProfile: {
    specialty?: string;
    name?: string;
  } | null;
  latestAppointment: OwnerAppointment | null;
  showSuccess: boolean;
  pets: Pet[];
}

export function DashboardClient({
  user,
  profile,
  patientAppointments,
  prescriptions,
  medicationOrders,
  doctorAppointments,
  doctorProfile,
  //latestAppointment,
  showSuccess,
  pets,
}: DashboardClientProps) {
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [orderingMed, setOrderingMed] = useState<string | null>(null);
  const [orderedMeds, setOrderedMeds] = useState<string[]>([]);

  // doctor modals
  const [notesModal, setNotesModal] = useState<{
    open: boolean;
    appointmentId: string;
    patientName: string;
  } | null>(null);
  const [prescriptionModal, setPrescriptionModal] = useState<{
    open: boolean;
    petId: string;
    ownerId: string;
    petName: string;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [prescriptionData, setPrescriptionData] = useState({
    medication: "",
    dosage: "",
    instructions: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // clear guest booking data from localStorage after successful booking
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem("guestBookingData");
    }
  }, [showSuccess]);

  const role = profile?.role === "veterinarian" ? "doctor" : "pet_owner";
  const userName =
    profile?.full_name || user.user_metadata?.full_name || "User";
  const capitalizedUserName = userName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  const userEmail = user.email || "";

  const upcomingPatientAppointments = patientAppointments.filter(
    (apt) =>
      new Date(apt.scheduled_at) >= new Date() && apt.status !== "completed"
  );
  const pastAppointments = patientAppointments
    .filter(
      (apt) =>
        new Date(apt.scheduled_at) < new Date() || apt.status === "completed"
    )
    .slice(0, 5);
  const refillReminders = prescriptions
    .filter((script) => script.status === "active")
    .slice(0, 3);

  const doctorAppointmentsToday = doctorAppointments.filter((appt) => {
    const apptDate = new Date(appt.scheduled_at);
    const now = new Date();
    return apptDate.toDateString() === now.toDateString();
  });

  const doctorQueue = doctorAppointments.filter(
    (appt) => appt.status !== "completed"
  );

  async function handleOrderMedication(
    prescriptionId: string,
    medicationName: string
  ) {
    setOrderingMed(medicationName);
    const result = await orderMedication(prescriptionId, medicationName);
    if (!result.error) {
      setOrderedMeds((prev) => [...prev, medicationName]);
    }
    setOrderingMed(null);
  }

  async function handleAddNotes() {
    if (!notesModal || !notes.trim()) return;
    setIsSubmitting(true);
    await addAppointmentNotes(notesModal.appointmentId, notes);
    setIsSubmitting(false);
    setNotesModal(null);
    setNotes("");
  }

  async function handleCreatePrescription() {
    if (!prescriptionModal || !prescriptionData.medication.trim()) return;
    setIsSubmitting(true);
    await createPrescription({
      petId: prescriptionModal.petId,
      ownerId: prescriptionModal.ownerId,
      medicationName: prescriptionData.medication,
      dosage: prescriptionData.dosage,
      instructions: prescriptionData.instructions,
    });
    setIsSubmitting(false);
    setPrescriptionModal(null);
    setPrescriptionData({ medication: "", dosage: "", instructions: "" });
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        userEmail={userEmail}
        userName={userName}
      />

      {/* notes modal for doctors */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setNotesModal(null)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Consultation Notes</CardTitle>
                <button
                  onClick={() => setNotesModal(null)}
                  className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                Patient: {notesModal.patientName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter consultation notes, diagnosis, recommendations..."
                  rows={5}
                />
              </div>
              <Button
                onClick={handleAddNotes}
                disabled={isSubmitting}
                className="w-full hover:cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save & Complete Appointment
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* prescription modal for doctors */}
      {prescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPrescriptionModal(null)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Prescription</CardTitle>
                <button
                  onClick={() => setPrescriptionModal(null)}
                  className="text-gray-400 hover:text-gray-600 hover:cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                For: {prescriptionModal.petName}
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
                  placeholder="e.g., 1 tablet 3x daily"
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
                  placeholder="Take with food. Complete the full course..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreatePrescription}
                disabled={isSubmitting}
                className="w-full bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer"
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

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          Appointment booked successfully!
        </div>
      )}

      {/* anonymous user upgrade banner */}
      {user.is_anonymous && (
        <div className="bg-paw-soft border border-paw-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-paw-primary shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-paw-dark">
                You&apos;re browsing as a guest
              </p>
              <p className="text-sm text-paw-text">
                Create an account to book appointments, save your medical
                history, and access all features.
              </p>
            </div>
          </div>
          <Link href="/signup">
            <Button className="bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer whitespace-nowrap">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          </Link>
        </div>
      )}

      {/* no pets registered banner */}
      {!user.is_anonymous && profile?.role !== "veterinarian" && pets.length === 0 && (
        <div className="bg-paw-soft border border-paw-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-paw-primary shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-paw-dark">
                No pets registered yet
              </p>
              <p className="text-sm text-paw-text">
                Register your pet to manage appointments, medical records, and get
                personalized care.
              </p>
            </div>
          </div>
          <Link href="/register-pet">
            <Button className="bg-paw-primary hover:bg-paw-primaryDark text-white hover:cursor-pointer whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Register Pet
            </Button>
          </Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-paw-primary">
            Welcome back, {capitalizedUserName}
          </h1>
          <p className="text-paw-text">
            {role === "doctor"
              ? "Here is a snapshot of your clinic workflow for today."
              : "Here's an overview of your care journey."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/book">
            <Button className="bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              {role === "doctor" ? "View Schedule" : "Book Appointment"}
            </Button>
          </Link>
          {role === "doctor" && doctorProfile && (
            <Badge
              variant="outline"
              className="border-paw-primary/20 text-paw-primary bg-paw-soft"
            >
              {doctorProfile.specialty}
            </Badge>
          )}
        </div>
      </div>

      {role === "doctor" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-paw-primary" />
                <h2 className="text-xl font-semibold text-paw-dark">
                  Today&apos;s Schedule
                </h2>
              </div>
              <span className="text-sm text-paw-text">
                {doctorAppointmentsToday.length} visit(s)
              </span>
            </div>

            {doctorAppointmentsToday.length === 0 ? (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="py-10 text-center text-gray-500">
                  No appointments scheduled today.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctorAppointmentsToday.map((apt) => (
                  <Card
                    key={apt.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <Link
                        href={`/appointments/${apt.id}`}
                        className="flex items-start gap-4 flex-1 hover:cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-full bg-paw-soft border border-paw-primary/20 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-paw-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-paw-dark">
                            {apt.owner?.full_name || "Pet Owner"}
                          </h3>
                          <p className="text-sm text-paw-text">
                            {apt.pets?.name
                              ? `${apt.pets.name} (${apt.pets.species})`
                              : apt.owner?.email}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(apt.scheduled_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                apt.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {apt.status !== "completed" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 hover:cursor-pointer"
                            onClick={() =>
                              setNotesModal({
                                open: true,
                                appointmentId: apt.id,
                                patientName:
                                  apt.pets?.name ||
                                  apt.owner?.full_name ||
                                  "Pet",
                              })
                            }
                          >
                            <NotebookPen className="h-4 w-4" />
                            Add Notes
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-1 hover:cursor-pointer"
                            onClick={() =>
                              setPrescriptionModal({
                                open: true,
                                petId: apt.pets?.id || "",
                                ownerId: apt.owner?.id || "",
                                petName: apt.pets?.name || "Pet",
                              })
                            }
                          >
                            <FilePlus2 className="h-4 w-4" />
                            Prescription
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* all appointments */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-paw-dark flex items-center gap-2 mb-4">
                <ClipboardList className="h-5 w-5 text-paw-primary" />
                All Appointments
              </h2>
              {doctorAppointments.length === 0 ? (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="py-8 text-center text-gray-500">
                    No appointments yet. Patients will appear here once they
                    book.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {doctorAppointments.map((apt) => (
                    <Card
                      key={apt.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <Link
                          href={`/appointments/${apt.id}`}
                          className="flex items-center gap-3 flex-1 hover:cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Stethoscope className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {apt.owner?.full_name || "Pet Owner"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(apt.scheduled_at).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(apt.scheduled_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {apt.status}
                          </Badge>
                          <Link href={`/appointments/${apt.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:cursor-pointer"
                            >
                              View
                            </Button>
                          </Link>
                          {apt.status !== "completed" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setNotesModal({
                                    open: true,
                                    appointmentId: apt.id,
                                    patientName:
                                      apt.pets?.name ||
                                      apt.owner?.full_name ||
                                      "Pet",
                                  })
                                }
                                className="hover:cursor-pointer"
                              >
                                <NotebookPen className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setPrescriptionModal({
                                    open: true,
                                    petId: apt.pets?.id || "",
                                    ownerId: apt.owner?.id || "",
                                    petName: apt.pets?.name || "Pet",
                                  })
                                }
                                className="hover:cursor-pointer"
                              >
                                <FilePlus2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-paw-primary" />
              <h2 className="text-xl font-semibold text-paw-dark">
                Patient Queue
              </h2>
            </div>

            {doctorQueue.length === 0 ? (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="py-8 text-center text-sm text-gray-500">
                  No patients waiting right now.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {doctorQueue.slice(0, 5).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {apt.owner?.full_name || "Pet Owner"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(apt.scheduled_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-paw-primary text-white border-none">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <CardDescription className="text-white/90">
                  Your activity summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/90">
                    Today&apos;s appointments
                  </span>
                  <span className="font-bold">
                    {doctorAppointmentsToday.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90">Pending patients</span>
                  <span className="font-bold">{doctorQueue.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/90">Completed today</span>
                  <span className="font-bold">
                    {
                      doctorAppointmentsToday.filter(
                        (a) => a.status === "completed"
                      ).length
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-paw-dark flex items-center gap-2">
              <Calendar className="h-5 w-5 text-paw-primary" />
              Upcoming Consults
            </h2>

            {upcomingPatientAppointments.length === 0 ? (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No upcoming appointments</p>
                  <Link href="/book">
                    <Button variant="outline" className="hover:cursor-pointer">
                      Find a Veterinarian
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingPatientAppointments.map((apt) => (
                  <Link
                    key={apt.id}
                    href={`/appointments/${apt.id}`}
                    className="block hover:cursor-pointer"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        <div className="bg-paw-soft p-6 flex flex-col items-center justify-center min-w-[120px] border-b sm:border-b-0 sm:border-r border-paw-primary/20">
                          <span className="text-3xl font-bold text-paw-primary">
                            {new Date(apt.scheduled_at).getDate()}
                          </span>
                          <span className="text-sm font-medium text-paw-primaryDark uppercase">
                            {new Date(apt.scheduled_at).toLocaleString(
                              "default",
                              {
                                month: "short",
                              }
                            )}
                          </span>
                        </div>
                        <div className="p-6 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="font-bold text-lg text-paw-dark">
                              {apt.veterinarians.name}
                            </h3>
                            <p className="text-paw-primary text-sm font-medium mb-2">
                              {apt.veterinarians.specialty}
                            </p>
                            {apt.pets && (
                              <p className="text-sm text-gray-600 mb-2">
                                Pet: {apt.pets.name} ({apt.pets.species})
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(apt.scheduled_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    apt.status === "confirmed"
                                      ? "bg-green-500"
                                      : "bg-yellow-500"
                                  }`}
                                />
                                <span className="capitalize">{apt.status}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:cursor-pointer"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* order medications */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-paw-dark flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-paw-primary" />
                Order Medications
              </h2>
              <Card>
                <CardContent className="p-6">
                  {prescriptions.filter((p) => p.status === "active").length ===
                  0 ? (
                    <div className="text-center py-6">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No active prescriptions to order
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Book an appointment to get prescriptions
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions
                        .filter((p) => p.status === "active")
                        .map((script) => {
                          const alreadyOrdered = medicationOrders.some(
                            (o) =>
                              o.medication_name === script.medication_name &&
                              o.status !== "delivered"
                          );
                          return (
                            <div
                              key={script.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-paw-soft flex items-center justify-center">
                                  <Pill className="h-6 w-6 text-paw-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-paw-dark">
                                    {script.medication_name}
                                  </p>
                                  <p className="text-sm text-paw-text">
                                    {script.dosage}
                                  </p>
                                  {script.instructions && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {script.instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {alreadyOrdered ||
                              orderedMeds.includes(script.medication_name) ? (
                                <Badge className="bg-green-100 text-green-700 px-4 py-2">
                                  <Check className="h-4 w-4 mr-1" />
                                  Ordered
                                </Badge>
                              ) : (
                                <Link
                                  href={`/order?prescriptionId=${script.id}`}
                                >
                                  <Button
                                    onClick={() => {
                                      return;
                                      handleOrderMedication(
                                        script.id,
                                        script.medication_name
                                      );
                                    }}
                                    disabled={
                                      orderingMed === script.medication_name
                                    }
                                    className="bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer"
                                  >
                                    {orderingMed === script.medication_name ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Ordering...
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Order Now
                                      </>
                                    )}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* medication order tracking */}
            {medicationOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-paw-dark flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-paw-primary" />
                  Order Tracking
                </h2>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    {medicationOrders.map((order) => {
                      const statusColors: Record<string, string> = {
                        pending: "bg-yellow-100 text-yellow-800",
                        processing: "bg-paw-soft text-paw-primaryDark",
                        shipped: "bg-purple-100 text-purple-800",
                        delivered: "bg-green-100 text-green-800",
                      };
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                order.status === "delivered"
                                  ? "bg-green-100"
                                  : "bg-paw-soft"
                              }`}
                            >
                              <Package
                                className={`h-5 w-5 ${
                                  order.status === "delivered"
                                    ? "text-green-600"
                                    : "text-paw-primary"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-paw-dark">
                                {order.medication_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Ordered{" "}
                                {new Date(
                                  order.ordered_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge
                              className={
                                statusColors[order.status] ||
                                "bg-gray-100 text-gray-800"
                              }
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Badge>
                            <Link href={`/track-order?orderId=${order.id}`}>
                              <Button>Track Order</Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* medical history */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-paw-dark flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-paw-primary" />
                Medical History
              </h2>
              <Card>
                <CardContent className="p-6">
                  {pastAppointments.length === 0 &&
                  prescriptions.length === 0 ? (
                    <div className="text-center py-6">
                      <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No medical history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastAppointments.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            Past Consultations
                          </h3>
                          <div className="space-y-2">
                            {pastAppointments.map((apt) => (
                              <Link
                                key={apt.id}
                                href={`/appointments/${apt.id}`}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors hover:cursor-pointer"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {apt.veterinarians.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {apt.veterinarians.specialty}
                                  </p>
                                  {apt.vet_notes && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {apt.vet_notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-700">
                                    {new Date(
                                      apt.scheduled_at
                                    ).toLocaleDateString()}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="capitalize text-xs"
                                  >
                                    {apt.status}
                                  </Badge>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-paw-primary" />
              <h2 className="text-xl font-semibold text-paw-dark">
                My Prescriptions
              </h2>
            </div>

            {prescriptions.length === 0 ? (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Pill className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">No prescriptions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((script) => (
                  <Card key={script.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">
                            {script.medication_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {script.dosage}
                          </p>
                        </div>
                        <Badge
                          className={
                            script.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {script.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* reminders */}
            <Card className="border-paw-primary/20 bg-paw-soft">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-paw-primary" />
                  <CardTitle className="text-base text-paw-dark">
                    Reminders
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPatientAppointments.length === 0 &&
                refillReminders.length === 0 ? (
                  <p className="text-sm text-paw-text">No upcoming reminders</p>
                ) : (
                  <>
                    {upcomingPatientAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Calendar className="h-4 w-4 text-paw-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-paw-dark">
                            Appt: {apt.veterinarians.name}
                          </p>
                          <p className="text-paw-primary">
                            {new Date(apt.scheduled_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {refillReminders.map((script) => (
                      <div
                        key={script.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Pill className="h-4 w-4 text-paw-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-paw-dark">
                            {script.medication_name}
                          </p>
                          <p className="text-paw-primary">Refill soon</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-paw-primary text-white border-none">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription className="text-white/90">
                  24/7 support available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  className="w-full text-paw-primaryDark font-bold hover:cursor-pointer"
                  onClick={() => setSupportModalOpen(true)}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ai chat panel */}
      {role === "pet_owner" && <AiChatPanel />}
    </div>
  );
}
