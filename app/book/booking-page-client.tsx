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
  contactInfo: ContactInfo;
  isGuest: boolean;
}

export default function BookingPageClient({
  doctors,
  contactInfo,
  isGuest,
}: BookingPageClientProps) {
  const [mode, setMode] = useState<"selection" | "ai" | "manual">("selection");
  const [initialData, setInitialData] = useState<
    BookingInitialData | undefined
  >(undefined);

  const handleAIComplete = (result: ConsultationResult) => {
    // Map result to BookingInitialData
    let doctorId: string | undefined;
    if (result.preferredDoctor) {
      const doctor = doctors.find((d) =>
        d.name.toLowerCase().includes(result.preferredDoctor!.toLowerCase())
      );
      if (doctor) {
        doctorId = doctor.id;
      }
    }

    setInitialData({
      notes: `Symptoms: ${result.summary}\n\nPreferences: ${
        result.preferredDate || "None"
      } at ${result.preferredTime || "None"}`,
      doctorId: doctorId,
    });
    setMode("manual");
  };

  if (mode === "selection") {
    return (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/50"
          onClick={() => setMode("ai")}
        >
          <CardHeader>
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>AI Assisted Booking</CardTitle>
            <CardDescription>
              Talk to our AI assistant. It will ask about your symptoms and help
              you fill out the form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start AI Booking</Button>
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
      contactInfo={contactInfo}
      isGuest={isGuest}
      initialData={initialData}
    />
  );
}
