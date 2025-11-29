"use client";

import { useState } from "react";
import BookingForm, { BookingInitialData } from "./[id]/booking-form";
import { AIBookingConsultation } from "./ai-booking-consultation";
import { Doctor } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, UserPen } from "lucide-react";
import { ConsultationResult } from "@/utils/ai/consultation/consultationService";

type ContactInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

interface BookingPageClientProps {
  doctors: Doctor[];
  pets?: any[];
  contactInfo: ContactInfo;
  isGuest: boolean;
}

export default function BookingPageClient({
  doctors,
  pets = [],
  contactInfo,
  isGuest,
}: BookingPageClientProps) {
  const [mode, setMode] = useState<"selection" | "ai" | "manual">("selection");
  const [initialData, setInitialData] = useState<
    BookingInitialData | undefined
  >(undefined);

  const handleAIComplete = (result: ConsultationResult) => {
    // Map result to BookingInitialData
    let doctorId: string | undefined = result.preferredDoctorId;

    if (!doctorId && result.preferredDoctorName) {
      const doctor = doctors.find((d) =>
        d.name.toLowerCase().includes(result.preferredDoctorName!.toLowerCase())
      );
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    // Parse Date
    let date: Date | undefined;
    if (result.preferredDate) {
      const lower = result.preferredDate.toLowerCase();
      const now = new Date();
      if (lower.includes("today")) {
        date = now;
      } else if (lower.includes("tomorrow")) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        date = tomorrow;
      } else {
        const parsed = new Date(result.preferredDate);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        }
      }
    }

    // Parse Time
    let time: string | undefined;
    if (result.preferredTime) {
      // Try to extract HH:MM
      let match = result.preferredTime.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        let hour = parseInt(match[1]);
        const minute = match[2];
        if (result.preferredTime.toLowerCase().includes("pm") && hour < 12) {
          hour += 12;
        }
        if (result.preferredTime.toLowerCase().includes("am") && hour === 12) {
          hour = 0;
        }
        time = `${hour.toString().padStart(2, "0")}:${minute}`;
      } else {
        // Try to match "2 PM" or "10 AM"
        match = result.preferredTime.match(/(\d{1,2})\s*(am|pm|AM|PM)/);
        if (match) {
          let hour = parseInt(match[1]);
          const period = match[2].toLowerCase();
          if (period === "pm" && hour < 12) hour += 12;
          if (period === "am" && hour === 12) hour = 0;
          time = `${hour.toString().padStart(2, "0")}:00`;
        }
      }
    }

    setInitialData({
      notes: `Pet Details:
Name: ${result.petName}
Type: ${result.petType}
Breed: ${result.petBreed || "Unknown"}
Age: ${result.petAge || "Unknown"}

Symptoms: ${result.summary}

Preferences: ${result.preferredDate || "None"} at ${
        result.preferredTime || "None"
      }`,
      doctorId: doctorId,
      date: date,
      time: time,
    });
    setMode("manual");
  };

  if (mode === "selection") {
    return (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer border-paw-primary/20 bg-paw-soft"
          onClick={() => setMode("ai")}
        >
          <CardHeader>
            <div className="bg-paw-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-paw-primary" />
            </div>
            <CardTitle>AI Assisted Booking</CardTitle>
            <CardDescription>
              Talk to our AI assistant. It will ask about your symptoms and help
              you fill out the form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-paw-primary hover:bg-paw-primaryDark text-white">
              Start AI Booking
            </Button>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setMode("manual")}
        >
          <CardHeader>
            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <UserPen className="w-6 h-6 text-slate-600" />
            </div>
            <CardTitle>Manual Booking</CardTitle>
            <CardDescription>
              Fill out the appointment form yourself. Choose your doctor and
              time slot directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Fill Form Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "ai") {
    return (
      <div className="mt-10">
        <AIBookingConsultation
          onComplete={handleAIComplete}
          onCancel={() => setMode("selection")}
        />
      </div>
    );
  }

  return (
    <BookingForm
      doctors={doctors}
      pets={pets}
      contactInfo={contactInfo}
      isGuest={isGuest}
      initialData={initialData}
    />
  );
}
