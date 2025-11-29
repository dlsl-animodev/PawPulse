"use client";

import { useState, useTransition } from "react";
import { generateGeminiSummary } from "./ai-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AppointmentContext {
  id?: string;
  doctorName?: string;
  notes?: string | null;
  date?: string;
}

interface PrescriptionContext {
  medication_name: string;
  dosage: string;
  status: string;
}

const quickActions = [
  {
    intent: "prescription" as const,
    label: "Ask about prescription",
    helper: "Clarify medication purpose, timing, and safety flags.",
    icon: "💊",
  },
  {
    intent: "previsit" as const,
    label: "Pre-visit symptom summary",
    helper: "Create a clean, concise handoff for your clinician.",
    icon: "📋",
  },
  {
    intent: "next_steps" as const,
    label: "Next steps summary",
    helper: "Capture follow-up tasks and watchouts after the consult.",
    icon: "✅",
  },
];

export function AiFollowUpPanel({
  appointment,
  prescriptions,
}: {
  appointment?: AppointmentContext;
  prescriptions: PrescriptionContext[];
}) {
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prescriptionText = prescriptions
    .filter((rx) => rx.status === "active")
    .map((rx) => `${rx.medication_name} (${rx.dosage})`)
    .join(", ");

  const contextParts = [
    appointment?.notes ? `Visit notes: ${appointment.notes}` : null,
    appointment?.doctorName ? `Clinician: ${appointment.doctorName}` : null,
    appointment?.date
      ? `Visit date: ${new Date(appointment.date).toLocaleString()}`
      : null,
    prescriptionText ? `Active prescriptions: ${prescriptionText}` : null,
  ].filter(Boolean);

  const context =
    contextParts.join("\n") || "No recent visit data was provided.";

  function handleGenerate(intent: "prescription" | "previsit" | "next_steps") {
    if (!consent) {
      setError("Please check the consent box above to enable AI assistance.");
      return;
    }

    setError(null);
    setMessage(null);
    setActiveIntent(intent);

    startTransition(async () => {
      const result = await generateGeminiSummary({
        intent,
        context,
        appointmentId: appointment?.id,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.summary ?? null);
    });
  }

  return (
    <Card className="border-paw-primary/20 shadow-md">
      <CardHeader className="space-y-3 bg-paw-soft rounded-t-lg">
        <div className="flex items-center gap-2 text-paw-primary">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="text-xl">AI Health Assistant</CardTitle>
          <span className="ml-auto text-xs bg-white text-paw-primary px-2 py-1 rounded-full font-medium">
            Powered by Gemini
          </span>
        </div>
        <CardDescription className="text-paw-text">
          Get AI-powered insights about your prescriptions, prepare for
          appointments, or summarize next steps.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <div className="flex items-start gap-2 text-sm text-paw-primaryDark bg-paw-soft p-3 rounded-md border border-paw-primary/20">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            AI outputs are informational only and not a substitute for
            professional medical advice.
          </span>
        </div>

        <label
          className="flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:cursor-pointer select-none"
          style={{
            borderColor: consent ? "#f97316" : "#e5e7eb",
            backgroundColor: consent ? "#fff7ed" : "#ffffff",
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (e.target.checked) setError(null);
            }}
            className="sr-only"
          />
          <div
            className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              consent ? "bg-paw-primary border-paw-primary" : "border-gray-300"
            }`}
          >
            {consent && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
          <span className="text-sm text-paw-text leading-relaxed">
            I consent to share my redacted health information with Gemini AI for
            generating helpful summaries. I understand this is not medical
            advice.
          </span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.intent}
              type="button"
              variant="outline"
              className={`justify-start h-auto py-4 text-left hover:cursor-pointer hover:border-paw-primary/50 hover:bg-paw-soft transition-all ${
                !consent ? "opacity-50" : ""
              }`}
              disabled={isPending}
              onClick={() => handleGenerate(action.intent)}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{action.icon}</span>
                  <span className="font-semibold text-paw-dark">
                    {action.label}
                  </span>
                </div>
                <div className="text-xs text-paw-text">{action.helper}</div>
              </div>
            </Button>
          ))}
        </div>

        {isPending && (
          <div className="flex items-center justify-center gap-3 py-8 text-paw-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-medium">
              Generating your {activeIntent?.replace("_", " ")} summary...
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-4 rounded-md border border-red-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && !isPending && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 font-semibold">
              <Bot className="h-5 w-5" />
              AI Generated Summary
            </div>
            <div className="text-sm text-paw-text whitespace-pre-line leading-relaxed bg-white p-4 rounded-md border">
              {message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
