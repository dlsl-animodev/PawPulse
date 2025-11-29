"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  UserPlus,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAppointment, type Doctor } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type ContactInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

// time slots from 10 AM to 5 PM (last slot at 5 PM)
const FIRST_SLOT_HOUR = 10;
const LAST_SLOT_HOUR = 17;
const TIME_SLOTS = Array.from(
  { length: LAST_SLOT_HOUR - FIRST_SLOT_HOUR + 1 },
  (_, index) => FIRST_SLOT_HOUR + index
).map((hour) => `${hour.toString().padStart(2, "0")}:00`);

function formatSlotLabel(slot: string) {
  const [hourStr] = slot.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:00 ${period}`;
}

function normalizeDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTimeKey(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

// get available time slots for a given date, filtering out past times for today
function getAvailableSlotsForDate(date: Date, now: Date): string[] {
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (!isToday) {
    return TIME_SLOTS;
  }

  // for today, filter out slots that have already passed
  const currentHour = now.getHours();
  return TIME_SLOTS.filter((slot) => {
    const slotHour = Number(slot.split(":")[0]);
    // slot must be at least 1 hour in the future
    return slotHour > currentHour;
  });
}

// check if a date has any available slots
function hasAvailableSlots(date: Date, now: Date): boolean {
  return getAvailableSlotsForDate(date, now).length > 0;
}

// get the minimum selectable date (today if slots available, otherwise tomorrow)
function getMinSelectableDate(now: Date): Date {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (hasAvailableSlots(today, now)) {
    return today;
  }

  // no slots available today, use tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function getCalendarDays(currentMonth: Date) {
  const firstOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const startDate = new Date(firstOfMonth);
  const weekday = startDate.getDay();
  startDate.setDate(startDate.getDate() - weekday);

  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  return days;
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function SubmitButton({
  canSubmit,
  isGuest,
}: {
  canSubmit: boolean;
  isGuest: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || !canSubmit;
  return (
    <Button
      type="submit"
      disabled={disabled}
      className="w-full py-6 text-lg font-semibold bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer rounded-2xl shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          Processing...
        </span>
      ) : isGuest ? (
        "Continue to Book"
      ) : (
        "Confirm Appointment"
      )}
    </Button>
  );
}

// helper to get stored guest booking data from localStorage
function getStoredBookingData() {
  if (typeof window === "undefined") return null;
  try {
    const storedData = localStorage.getItem("guestBookingData");
    if (!storedData) return null;
    return JSON.parse(storedData);
  } catch {
    return null;
  }
}

export type BookingInitialData = {
  notes?: string;
  doctorId?: string;
  date?: Date;
  time?: string;
};

function DoctorAvatar({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const placeHolderImages = ["/doc_placeholder.png", "/doc_placeholder_2.png"];

  function getRandomPlaceholder() {
    const index = Math.floor(Math.random() * placeHolderImages.length);
    return placeHolderImages[index];
  }

  const [imgSrc, setImgSrc] = useState(src || getRandomPlaceholder());

  useEffect(() => {
    setImgSrc(src || getRandomPlaceholder());
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={56}
      height={56}
      className={className}
      onError={() => setImgSrc(getRandomPlaceholder())}
    />
  );
}

export default function BookingForm({
  doctors,
  contactInfo,
  initialDoctorId,
  isGuest = false,
  initialData,
}: {
  doctors: Doctor[];
  contactInfo: ContactInfo;
  initialDoctorId?: string;
  isGuest?: boolean;
  initialData?: BookingInitialData;
}) {
  // check for stored booking data (after guest signup flow)
  const storedBooking = useMemo(() => {
    if (isGuest) return null;
    return getStoredBookingData();
  }, [isGuest]);

  // use current time for all time-based calculations
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    () =>
      storedBooking?.booking?.doctorId ||
      initialData?.doctorId ||
      initialDoctorId ||
      ""
  );

  // editable contact info for guests
  const [guestContact, setGuestContact] = useState({
    firstName: contactInfo.firstName || "",
    lastName: contactInfo.lastName || "",
    email: contactInfo.email || "",
    phone: contactInfo.phone || "",
  });

  // calculate minimum selectable date based on current time
  const minSelectableDate = useMemo(() => {
    return getMinSelectableDate(now);
  }, [now]);

  // get initial date from stored data or use minimum selectable date
  const initialDate = useMemo(() => {
    if (storedBooking?.booking?.date) {
      const parsed = new Date(storedBooking.booking.date);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (initialData?.date) {
      return initialData.date;
    }
    return minSelectableDate;
  }, [storedBooking, minSelectableDate, initialData]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(
    () => storedBooking?.booking?.time || initialData?.time || ""
  );
  const [notes, setNotes] = useState<string>(
    () => storedBooking?.booking?.notes || initialData?.notes || ""
  );

  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Stepper state
  const [step, setStep] = useState(1);

  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [preConsultData, setPreConsultData] = useState<{
    notes: string;
    doctorId: string;
    date: string;
    time: string;
  } | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);
  useRouter();

  // update "now" every minute to keep time slots current
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // get available slots for the selected date
  const availableSlots = useMemo(() => {
    return getAvailableSlotsForDate(selectedDate, now);
  }, [selectedDate, now]);

  // computed check if selected time is still valid
  const isSelectedTimeAvailable = selectedTime
    ? availableSlots.includes(selectedTime)
    : true;

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === selectedDoctorId
  );

  useEffect(() => {
    if (!selectedDoctorId) {
      return;
    }

    let isMounted = true;
    async function fetchTaken() {
      setSlotsLoading(true);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select("scheduled_at,status")
        .eq("veterinarian_id", selectedDoctorId)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString());

      if (!isMounted) return;

      if (fetchError) {
        console.error("Failed to load doctor availability", fetchError);
        setTakenTimes([]);
      } else {
        const blocked = Array.from(
          new Set(
            (data || [])
              .filter((appointment) => appointment.status !== "cancelled")
              .map((appointment) => {
                const bookedDate = new Date(appointment.scheduled_at);
                return getLocalTimeKey(bookedDate);
              })
          )
        );
        setTakenTimes(blocked);
      }
      setSlotsLoading(false);
    }

    fetchTaken();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDoctorId, supabase]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth),
    [currentMonth]
  );

  const canGoToPreviousMonth = useMemo(() => {
    const currentFirst = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const minFirst = new Date(
      minSelectableDate.getFullYear(),
      minSelectableDate.getMonth(),
      1
    );
    return currentFirst.getTime() > minFirst.getTime();
  }, [currentMonth, minSelectableDate]);

  const specialties = useMemo(() => {
    const uniq = Array.from(new Set(doctors.map((doctor) => doctor.specialty)));
    return ["all", ...uniq];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const filtered = doctors.filter((doctor) => {
      const matchSpecialty =
        specialtyFilter === "all" || doctor.specialty === specialtyFilter;
      const term = search.toLowerCase().trim();
      if (!term) return matchSpecialty;
      return (
        matchSpecialty &&
        (doctor.name.toLowerCase().includes(term) ||
          doctor.specialty.toLowerCase().includes(term) ||
          (doctor.bio || "").toLowerCase().includes(term))
      );
    });

    if (selectedDoctorId) {
      return filtered.sort((a, b) => {
        if (a.id === selectedDoctorId) return -1;
        if (b.id === selectedDoctorId) return 1;
        return 0;
      });
    }
    return filtered;
  }, [doctors, specialtyFilter, search, selectedDoctorId]);

  const dateFieldValue = useMemo(
    () => normalizeDateInput(selectedDate),
    [selectedDate]
  );

  const isSelectedTimeBlocked = Boolean(
    selectedTime &&
      (takenTimes.includes(selectedTime) || !isSelectedTimeAvailable)
  );

  const canSubmit = Boolean(
    selectedDoctorId &&
      selectedTime &&
      !isSelectedTimeBlocked &&
      isSelectedTimeAvailable
  );

  function handleDaySelect(day: Date) {
    // check if day is in the past
    if (day < minSelectableDate) return;
    // check if day has available slots
    if (!hasAvailableSlots(day, now)) return;
    setSelectedDate(new Date(day));
    setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    setSelectedTime("");
  }

  function handleDoctorSelection(doctorId: string) {
    setSelectedDoctorId(doctorId);
    setSelectedTime("");
    setTakenTimes([]);
    setSlotsLoading(false);
    // Auto advance to next step after selection
    setTimeout(() => setStep(2), 300);
  }

  async function handleSubmit(formData: FormData) {
    if (!selectedDoctorId) {
      setError("Please choose a doctor before booking.");
      toast.error("Please choose a doctor before booking.");
      return;
    }

    if (!selectedTime) {
      setError("Please choose a time slot.");
      toast.error("Please choose a time slot.");
      return;
    }

    if (isSelectedTimeBlocked) {
      setError(
        "That time slot just became unavailable. Please choose another."
      );
      toast.error(
        "That time slot just became unavailable. Please choose another."
      );
      return;
    }

    // for guests, show registration prompt instead of trying to create appointment
    if (isGuest) {
      const notes = (formData.get("notes") as string) || "";
      setPreConsultData({
        notes,
        doctorId: selectedDoctorId,
        date: dateFieldValue,
        time: selectedTime,
      });

      // save guest contact info and booking data to localStorage for signup form
      const guestBookingData = {
        contact: guestContact,
        booking: {
          notes,
          doctorId: selectedDoctorId,
          date: dateFieldValue,
          time: selectedTime,
        },
      };
      localStorage.setItem(
        "guestBookingData",
        JSON.stringify(guestBookingData)
      );

      setRequiresRegistration(true);
      setRedirectUrl(`/signup?upgrade=true&next=/book/${selectedDoctorId}`);
      toast.success("Your consultation details have been saved!");
      return;
    }

    const res = await createAppointment(formData);
    if (res?.error) {
      setError(res.error);
      toast.error(res.error);

      // handle anonymous user attempting to book
      if ("requiresRegistration" in res && res.requiresRegistration) {
        setRequiresRegistration(true);
        setRedirectUrl(
          ("redirectTo" in res && res.redirectTo) ||
            `/signup?upgrade=true&next=/book/${selectedDoctorId}`
        );
      }
    }
  }

  // Stepper Logic
  const steps = [
    { id: 1, title: "Vet", icon: Stethoscope },
    { id: 2, title: "Date & Time", icon: CalendarIcon },
    { id: 3, title: "Details", icon: Sparkles },
    ...(isGuest ? [{ id: 4, title: "Contact", icon: UserRound }] : []),
    { id: isGuest ? 5 : 4, title: "Review", icon: Check },
  ];

  const totalSteps = steps.length;

  const nextStep = () => {
    if (step === 1 && !selectedDoctorId) {
      toast.error("Please select a specialist to continue");
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTime)) {
      toast.error("Please select a date and time");
      return;
    }
    if (step === 3 && !notes.trim()) {
      toast.error("Please describe your reason for visit");
      return;
    }
    if (isGuest && step === 4) {
      if (
        !guestContact.firstName ||
        !guestContact.lastName ||
        !guestContact.email
      ) {
        toast.error("Please fill in your contact details");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // show registration prompt for guests
  if (requiresRegistration) {
    const selectedDoctor = doctors.find(
      (d) => d.id === preConsultData?.doctorId
    );
    return (
      <div className="rounded-3xl border border-orange-100 bg-white/70 backdrop-blur-sm p-8 shadow-sm max-w-xl mx-auto">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-paw-soft rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-10 h-10 text-paw-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-paw-dark mb-2">
              Your Pre-Consultation is Saved
            </h3>
            <p className="text-paw-text max-w-md mx-auto">
              Create an account to complete your booking and access all CareLink
              features.
            </p>
          </div>

          {/* show saved consultation details */}
          {preConsultData && (
            <div className="bg-paw-soft border border-orange-100 rounded-2xl p-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-paw-dark mb-2">
                Saved consultation details:
              </p>
              <div className="space-y-1 text-sm text-paw-text">
                {selectedDoctor && (
                  <p>
                    Doctor:{" "}
                    <span className="font-medium">{selectedDoctor.name}</span>
                  </p>
                )}
                <p>
                  Date:{" "}
                  <span className="font-medium">{preConsultData.date}</span>
                </p>
                <p>
                  Time:{" "}
                  <span className="font-medium">
                    {formatSlotLabel(preConsultData.time)}
                  </span>
                </p>
                {preConsultData.notes && (
                  <p className="mt-2 pt-2 border-t border-orange-200">
                    Notes:{" "}
                    <span className="text-paw-primaryDark">
                      {preConsultData.notes.slice(0, 100)}
                      {preConsultData.notes.length > 100 ? "..." : ""}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 max-w-sm mx-auto">
            <Link href={redirectUrl || "/signup?upgrade=true"}>
              <Button className="w-full bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer py-3 text-base">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account to Book
              </Button>
            </Link>
            <p className="text-xs text-paw-text">
              Already have an account?{" "}
              <Link href="/login" className="text-paw-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Button
              variant="ghost"
              className="w-full text-paw-text hover:text-paw-dark hover:cursor-pointer"
              onClick={() => {
                setRequiresRegistration(false);
                setPreConsultData(null);
                setError(null);
              }}
            >
              Go Back to Edit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="max-w-4xl mx-auto min-h-screen pb-32 md:pb-10"
    >
      {/* Hidden Inputs */}
      <input type="hidden" name="doctorId" value={selectedDoctorId} />
      <input type="hidden" name="date" value={dateFieldValue} />
      <input type="hidden" name="time" value={selectedTime} />
      <input type="hidden" name="notes" value={notes} />
      {isGuest && (
        <>
          <input
            type="hidden"
            name="guestFirstName"
            value={guestContact.firstName}
          />
          <input
            type="hidden"
            name="guestLastName"
            value={guestContact.lastName}
          />
          <input type="hidden" name="guestEmail" value={guestContact.email} />
          <input type="hidden" name="guestPhone" value={guestContact.phone} />
        </>
      )}

      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Header - Only visible on Step 1 */}
      {step === 1 && (
        <div className="text-center space-y-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs tracking-[0.3em] uppercase text-paw-primary font-bold">
            CareLink Booking
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-paw-dark tracking-tight">
            Schedule your consultation
          </h1>
          <p className="text-paw-text max-w-md mx-auto leading-relaxed">
            Choose from {doctors.length} trusted specialists to get started.
          </p>
        </div>
      )}

      {/* Modern Segmented Stepper */}
      <div className="mb-8 sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 -mx-4 px-4 md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {steps[step - 1].icon &&
              (() => {
                const Icon = steps[step - 1].icon;
                return (
                  <div className="p-1.5 bg-paw-soft text-paw-primary rounded-lg">
                    <Icon className="w-4 h-4" />
                  </div>
                );
              })()}
            <span className="text-sm font-bold text-paw-dark">
              {steps[step - 1].title}
            </span>
          </div>
          <span className="text-xs font-medium text-paw-text">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                s.id <= step ? "bg-paw-primary" : "bg-orange-100"
              )}
            />
          ))}
        </div>
      </div>

      <div className="min-h-[300px]">
        {/* Step 1: Doctor Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="">
              <div className="relative">
                <Input
                  placeholder="Search vets..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-10 rounded-2xl h-12 bg-paw-soft border-transparent focus:bg-white transition-all"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-paw-text/50" />
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="text-center text-paw-text py-12 bg-paw-soft rounded-3xl border border-dashed border-orange-200">
                No doctors match your search.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => handleDoctorSelection(doctor.id)}
                    className={cn(
                      "text-left rounded-2xl p-4 flex gap-4 transition-all hover:cursor-pointer group relative overflow-hidden",
                      selectedDoctorId === doctor.id
                        ? "bg-paw-primary text-white shadow-lg shadow-orange-200 scale-[1.02]"
                        : "bg-white border border-orange-100 hover:border-orange-200 hover:shadow-md"
                    )}
                  >
                    <div
                      className={cn(
                        "h-14 w-14 rounded-xl overflow-hidden shrink-0",
                        selectedDoctorId === doctor.id
                          ? "bg-white/20"
                          : "bg-paw-soft"
                      )}
                    >
                      <DoctorAvatar
                        src={doctor.image_url}
                        alt={doctor.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs uppercase tracking-wide font-bold mb-0.5",
                          selectedDoctorId === doctor.id
                            ? "text-orange-100"
                            : "text-paw-primary"
                        )}
                      >
                        {doctor.specialty}
                      </p>
                      <p
                        className={cn(
                          "text-base font-bold truncate",
                          selectedDoctorId === doctor.id
                            ? "text-white"
                            : "text-paw-dark"
                        )}
                      >
                        {doctor.name}
                      </p>
                      <p
                        className={cn(
                          "text-xs line-clamp-1",
                          selectedDoctorId === doctor.id
                            ? "text-orange-100"
                            : "text-paw-text"
                        )}
                      >
                        {doctor.bio || "Available for consultation"}
                      </p>
                    </div>
                    {selectedDoctorId === doctor.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-1.5 rounded-full">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-base font-semibold text-paw-dark ml-1">
                Select Date
              </Label>
              <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-paw-soft/50">
                  <span className="font-semibold text-paw-dark">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                      disabled={!canGoToPreviousMonth}
                      className="h-8 w-8 rounded-full hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                      className="h-8 w-8 rounded-full hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-paw-text/50 uppercase tracking-wider mb-2">
                    {"SunMonTueWedThuFriSat".match(/.{1,3}/g)?.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const isPast = day < minSelectableDate;
                      const hasNoSlots = !hasAvailableSlots(day, now);
                      const isDisabled = isPast || hasNoSlots;
                      const isSelected = isSameDay(day, selectedDate);
                      const isOutsideMonth =
                        day.getMonth() !== currentMonth.getMonth();

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleDaySelect(day)}
                          className={cn(
                            "aspect-square rounded-xl text-sm font-medium transition-all flex items-center justify-center relative",
                            isSelected
                              ? "bg-paw-primary text-white shadow-md shadow-orange-200"
                              : "text-paw-text hover:bg-paw-soft",
                            isDisabled && "opacity-20 cursor-not-allowed",
                            isOutsideMonth && !isSelected && "text-paw-text/30"
                          )}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold text-paw-dark ml-1">
                Available Times
              </Label>
              <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-5 min-h-[320px]">
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-paw-text/50">
                      No slots available
                    </div>
                  ) : (
                    availableSlots.map((slot) => {
                      const isTaken = takenTimes.includes(slot);
                      const disabled = !selectedDoctorId || isTaken;
                      const isActive = selectedTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedTime(slot);
                            setError(null);
                          }}
                          className={cn(
                            "py-3 px-2 rounded-xl text-sm font-medium border transition-all",
                            isActive
                              ? "bg-paw-primary text-white border-paw-primary shadow-md shadow-orange-200"
                              : "bg-white text-paw-text border-orange-200 hover:border-orange-300",
                            disabled &&
                              "opacity-40 cursor-not-allowed bg-paw-soft"
                          )}
                        >
                          {formatSlotLabel(slot)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-3xl border border-orange-200 p-1 shadow-sm">
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Please describe your symptoms or reason for visit..."
                rows={8}
                className="rounded-[20px] border-0 focus-visible:ring-0 resize-none text-base p-4 placeholder:text-paw-text/50"
              />
            </div>
            <div className="flex items-start gap-3 p-4 bg-paw-soft rounded-2xl text-paw-primaryDark text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                Your notes are encrypted and only visible to your doctor. Please
                be as detailed as possible.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Contact (Guest Only) */}
        {isGuest && step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={guestContact.firstName}
                  onChange={(e) =>
                    setGuestContact({
                      ...guestContact,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="Jane"
                  className="rounded-2xl h-12 bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={guestContact.lastName}
                  onChange={(e) =>
                    setGuestContact({
                      ...guestContact,
                      lastName: e.target.value,
                    })
                  }
                  placeholder="Doe"
                  className="rounded-2xl h-12 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={guestContact.email}
                onChange={(e) =>
                  setGuestContact({ ...guestContact, email: e.target.value })
                }
                placeholder="jane@example.com"
                className="rounded-2xl h-12 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={guestContact.phone}
                onChange={(e) =>
                  setGuestContact({ ...guestContact, phone: e.target.value })
                }
                placeholder="+1 (555) 000-0000"
                className="rounded-2xl h-12 bg-white"
              />
            </div>
          </div>
        )}

        {/* Step 5 (or 4): Review */}
        {step === totalSteps && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white rounded-3xl border border-orange-200 overflow-hidden shadow-sm divide-y divide-orange-100">
              {/* Doctor Summary */}
              <div className="p-5 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-paw-soft shrink-0">
                  <DoctorAvatar
                    src={selectedDoctor?.image_url}
                    alt={selectedDoctor?.name || "Doctor"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-paw-primary font-bold">
                    Veterinary Specialist
                  </p>
                  <p className="text-base font-bold text-paw-dark truncate">
                    {selectedDoctor?.name}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-paw-primary hover:bg-paw-soft rounded-full px-3"
                  onClick={() => setStep(1)}
                >
                  Change
                </Button>
              </div>

              {/* Date & Time Summary */}
              <div className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-paw-soft flex items-center justify-center shrink-0 text-paw-primary">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-paw-text">
                    Date & Time
                  </p>
                  <p className="text-base font-semibold text-paw-dark">
                    {selectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {selectedTime ? formatSlotLabel(selectedTime) : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-paw-primary hover:bg-paw-soft rounded-full px-3"
                  onClick={() => setStep(2)}
                >
                  Change
                </Button>
              </div>

              {/* Notes Summary */}
              <div className="p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-paw-secondary/10 flex items-center justify-center shrink-0 text-paw-secondary">
                  <Info className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-paw-text">Notes</p>
                  <p className="text-sm text-paw-text mt-1 line-clamp-2">
                    {notes || "No notes provided"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-paw-primary hover:bg-paw-soft rounded-full px-3"
                  onClick={() => setStep(3)}
                >
                  Edit
                </Button>
              </div>

              {/* Guest Contact Summary */}
              {isGuest && (
                <div className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-paw-accent/20 flex items-center justify-center shrink-0 text-yellow-600">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paw-text">Contact</p>
                    <p className="text-base font-semibold text-paw-dark truncate">
                      {guestContact.firstName} {guestContact.lastName}
                    </p>
                    <p className="text-xs text-paw-text truncate">
                      {guestContact.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-paw-primary hover:bg-paw-soft rounded-full px-3"
                    onClick={() => setStep(4)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-orange-200 z-50 md:static md:bg-transparent md:p-0 md:border-0 md:mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            className="text-paw-text hover:text-paw-dark hover:bg-paw-soft rounded-xl px-4 h-12 text-base font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : (
          <div></div> // Spacer
        )}

        {step < totalSteps ? (
          <Button
            type="button"
            onClick={nextStep}
            className="bg-paw-primary hover:bg-paw-dark text-white rounded-xl px-6 h-12 text-base font-semibold shadow-lg shadow-orange-200 transition-all hover:scale-105 active:scale-95"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="w-full max-w-[200px] ml-auto">
            <SubmitButton canSubmit={canSubmit} isGuest={isGuest} />
          </div>
        )}
      </div>
    </form>
  );
}
