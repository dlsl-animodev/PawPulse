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
  X,
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

function SubmitButton({ canSubmit, isGuest }: { canSubmit: boolean; isGuest: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || !canSubmit;
  return (
    <Button
      type="submit"
      disabled={disabled}
      className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
    >
      {pending ? "Processing..." : isGuest ? "Continue to Book" : "Confirm Appointment"}
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

export default function BookingForm({
  doctors,
  contactInfo,
  initialDoctorId,
  isGuest = false,
}: {
  doctors: Doctor[];
  contactInfo: ContactInfo;
  initialDoctorId?: string;
  isGuest?: boolean;
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
    () => storedBooking?.booking?.doctorId || initialDoctorId || ""
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
    return minSelectableDate;
  }, [storedBooking, minSelectableDate]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(
    () => storedBooking?.booking?.time || ""
  );
  const [storedNotes] = useState<string>(
    () => storedBooking?.booking?.notes || ""
  );
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
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
  const isSelectedTimeAvailable = selectedTime ? availableSlots.includes(selectedTime) : true;

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
        .select("date,status")
        .eq("doctor_id", selectedDoctorId)
        .gte("date", dayStart.toISOString())
        .lte("date", dayEnd.toISOString());

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
                const bookedDate = new Date(appointment.date);
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
    return doctors.filter((doctor) => {
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
  }, [doctors, specialtyFilter, search]);

  const dateFieldValue = useMemo(
    () => normalizeDateInput(selectedDate),
    [selectedDate]
  );

  const isSelectedTimeBlocked = Boolean(
    selectedTime && (takenTimes.includes(selectedTime) || !isSelectedTimeAvailable)
  );

  const canSubmit = Boolean(
    selectedDoctorId && selectedTime && !isSelectedTimeBlocked && isSelectedTimeAvailable
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
      const notes = formData.get("notes") as string || "";
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
      localStorage.setItem("guestBookingData", JSON.stringify(guestBookingData));

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
          ("redirectTo" in res && res.redirectTo) || `/signup?upgrade=true&next=/book/${selectedDoctorId}`
        );
      }
    }
  }

  function closeModal() {
    setDoctorModalOpen(false);
    setSearch("");
    setSpecialtyFilter("all");
  }

  // show registration prompt for guests
  if (requiresRegistration) {
    const selectedDoctor = doctors.find((d) => d.id === preConsultData?.doctorId);
    return (
      <div className="rounded-3xl border border-blue-100 bg-white/70 backdrop-blur-sm p-8 shadow-sm">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <UserPlus className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Your Pre-Consultation is Saved
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Create an account to complete your booking and access all CareLink features.
            </p>
          </div>

          {/* show saved consultation details */}
          {preConsultData && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-blue-900 mb-2">Saved consultation details:</p>
              <div className="space-y-1 text-sm text-blue-800">
                {selectedDoctor && (
                  <p>Doctor: <span className="font-medium">{selectedDoctor.name}</span></p>
                )}
                <p>Date: <span className="font-medium">{preConsultData.date}</span></p>
                <p>Time: <span className="font-medium">{formatSlotLabel(preConsultData.time)}</span></p>
                {preConsultData.notes && (
                  <p className="mt-2 pt-2 border-t border-blue-200">
                    Notes: <span className="text-blue-700">{preConsultData.notes.slice(0, 100)}{preConsultData.notes.length > 100 ? "..." : ""}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 max-w-sm mx-auto">
            <Link href={redirectUrl || "/signup?upgrade=true"}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 hover:cursor-pointer py-3 text-base">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account to Book
              </Button>
            </Link>
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
            <Button
              variant="ghost"
              className="w-full text-slate-500 hover:text-slate-700 hover:cursor-pointer"
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
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="doctorId" value={selectedDoctorId} />
      <input type="hidden" name="date" value={dateFieldValue} />
      <input type="hidden" name="time" value={selectedTime} />
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-blue-100 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
                  Select Date
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  Choose the perfect time
                </h3>
                <p className="text-sm text-slate-500">
                  Pick a date and time that works best for your consultation.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <Label>Calendar</Label>
                <div className="rounded-2xl border border-blue-100 p-4">
                  <div className="flex items-center justify-between mb-4">
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
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-900">
                        {currentMonth.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
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
                      className="rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
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
                          className={`h-12 rounded-xl border text-sm transition ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-200"
                          } ${
                            isDisabled
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:border-blue-400 hover:text-blue-600 hover:cursor-pointer"
                          } ${
                            isOutsideMonth && !isSelected
                              ? "text-slate-400"
                              : ""
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Pick a time</Label>
                <div className="rounded-2xl border border-blue-100 p-4 space-y-4">
                  {!selectedDoctorId && (
                    <p className="text-sm text-slate-500">
                      Select a doctor to see their available times.
                    </p>
                  )}
                  {selectedDoctorId && (
                    <>
                      <p className="text-sm text-slate-500">
                        Choose a slot between 10:00 AM and 5:00 PM.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {availableSlots.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No available time slots for this date.
                          </p>
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
                                className={`px-4 py-2 rounded-full text-sm border transition ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-700 border-slate-200"
                                } ${
                                  disabled
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:border-blue-400 hover:text-blue-600 hover:cursor-pointer"
                                }`}
                              >
                                {formatSlotLabel(slot)}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {slotsLoading
                          ? "Checking doctor availability..."
                          : takenTimes.length > 0
                          ? `Already booked: ${takenTimes
                              .map((slot) => formatSlotLabel(slot))
                              .join(", ")}`
                          : "All slots are currently open."}
                      </div>
                      {isSelectedTimeBlocked && (
                        <div className="text-sm text-red-500">
                          That slot was just booked. Please choose another time.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">
                  Consultation Details
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  Tell us about your visit
                </h3>
                <p className="text-sm text-slate-500">
                  A short description helps your doctor prepare ahead of time.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Reason for visit</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Describe your symptoms, concerns, or consultation goals..."
                rows={6}
                required
                className="rounded-2xl"
                defaultValue={storedNotes}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* guest banner */}
          {isGuest && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Browsing as guest</p>
                  <p className="text-sm text-amber-700">
                    Fill out the form below. You&apos;ll create an account when you&apos;re ready to book.
                  </p>
                </div>
              </div>
            </div>
          )}

          <section className="rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Contact Information
                </h3>
                <p className="text-sm text-slate-500">
                  {isGuest ? "Enter your details for the consultation." : "We'll use this to confirm your appointment."}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                {isGuest ? (
                  <Input
                    name="guestFirstName"
                    value={guestContact.firstName}
                    onChange={(e) => setGuestContact({ ...guestContact, firstName: e.target.value })}
                    placeholder="Your first name"
                    className="rounded-2xl"
                  />
                ) : (
                  <Input
                    value={contactInfo.firstName}
                    readOnly
                    className="rounded-2xl bg-slate-50"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                {isGuest ? (
                  <Input
                    name="guestLastName"
                    value={guestContact.lastName}
                    onChange={(e) => setGuestContact({ ...guestContact, lastName: e.target.value })}
                    placeholder="Your last name"
                    className="rounded-2xl"
                  />
                ) : (
                  <Input
                    value={contactInfo.lastName}
                    readOnly
                    className="rounded-2xl bg-slate-50"
                  />
                )}
              </div>
            </div>
            <div className="space-y-1.5 mt-4">
              <Label>Email Address</Label>
              <div className="relative">
                {isGuest ? (
                  <>
                    <Input
                      name="guestEmail"
                      type="email"
                      value={guestContact.email}
                      onChange={(e) => setGuestContact({ ...guestContact, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="pl-12 rounded-2xl"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Input
                      value={contactInfo.email}
                      readOnly
                      className="pl-12 rounded-2xl bg-slate-50"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-1.5 mt-4">
              <Label>Phone Number</Label>
              <div className="relative">
                {isGuest ? (
                  <>
                    <Input
                      name="guestPhone"
                      type="tel"
                      value={guestContact.phone}
                      onChange={(e) => setGuestContact({ ...guestContact, phone: e.target.value })}
                      placeholder="+63 917 123 4567"
                      className="pl-12 rounded-2xl"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Input
                      value={contactInfo.phone || "Not provided"}
                      readOnly
                      className="pl-12 rounded-2xl bg-slate-50"
                    />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Doctor</h3>
                <p className="text-sm text-slate-500">
                  Choose the specialist you want to meet.
                </p>
              </div>
            </div>

            <div className="border border-dashed border-blue-200 rounded-2xl p-4 mb-4 bg-blue-50/40">
              {selectedDoctor ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-blue-100">
                    <Image
                      src={
                        selectedDoctor.image_url ||
                        "https://placehold.co/80x80?text=Dr"
                      }
                      alt={selectedDoctor.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
                      Selected Specialist
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedDoctor.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedDoctor.specialty}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-sm">
                  No doctor selected yet. Browse our specialists to get started.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => setDoctorModalOpen(true)}
                disabled={doctors.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
              >
                {selectedDoctor ? "Change Doctor" : "Browse Doctors"}
              </Button>
              {selectedDoctor && (
                <p className="text-xs text-slate-500 text-center">
                  Prefer someone else? You can always switch doctors here.
                </p>
              )}
              {doctors.length === 0 && (
                <p className="text-xs text-red-500 text-center">
                  No doctors are available right now. Please check back soon.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <SubmitButton canSubmit={canSubmit} isGuest={isGuest} />
        {isGuest && (
          <p className="text-center text-xs text-slate-500 mt-3">
            You&apos;ll be prompted to create an account to complete your booking.
          </p>
        )}
      </div>

      {doctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={closeModal}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-blue-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-50">
              <div>
                <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
                  Our Care Team
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  Select a specialist
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-900 hover:cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name or specialty"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-11 rounded-2xl"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => setSpecialtyFilter(specialty)}
                      className={`px-4 py-2 rounded-full text-sm border hover:cursor-pointer ${
                        specialtyFilter === specialty
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {specialty === "all" ? "All" : specialty}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  No doctors match your search. Try a different specialty or
                  name.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredDoctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => {
                        handleDoctorSelection(doctor.id);
                        setError(null);
                        closeModal();
                      }}
                      className={`text-left rounded-2xl border transition shadow-sm hover:shadow-lg p-4 flex gap-4 hover:cursor-pointer ${
                        selectedDoctorId === doctor.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="h-16 w-16 rounded-2xl overflow-hidden bg-blue-100 shrink-0">
                        <Image
                          src={
                            doctor.image_url ||
                            "https://placehold.co/96x96?text=Dr"
                          }
                          alt={doctor.name}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
                          {doctor.specialty}
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {doctor.name}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {doctor.bio ||
                            "Experienced specialist ready to support your care."}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
