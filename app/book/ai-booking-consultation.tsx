"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import {
  ConsultationService,
  ConsultationResult,
} from "@/utils/ai/consultation/consultationService";
import { toast } from "sonner";
import { getGeminiApiKey } from "./actions";

interface AIBookingConsultationProps {
  onComplete: (result: ConsultationResult) => void;
  onCancel: () => void;
}

export function AIBookingConsultation({
  onComplete,
  onCancel,
}: AIBookingConsultationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const serviceRef = useRef<ConsultationService | null>(null);

  useEffect(() => {
    let service: ConsultationService | null = null;

    async function initService() {
      try {
        const apiKey = await getGeminiApiKey();
        service = new ConsultationService(apiKey, {
          onConnectionChange: (connected) => {
            setIsConnected(connected);
          },
          onText: (text, isFinal) => {
            setTranscript(text);
          },
          onInputText: (text) => {
            // Optional: show user input
          },
          onAudioData: (buffer) => {
            // Visualizer hook
          },
          onOptionsReceived: (options, question) => {},
          onComplete: (result) => {
            onComplete(result);
            service?.stop();
          },
          onError: (error) => {
            console.error(error);
            toast.error("An error occurred with the AI service.");
            setIsConnected(false);
          },
          onInterrupted: () => {},
        });

        serviceRef.current = service;
        await service.start();
      } catch (error) {
        console.error("Failed to initialize AI service:", error);
        toast.error("Failed to start AI service. Please try again.");
      }
    }

    initService();

    return () => {
      service?.stop();
    };
  }, [onComplete]);

  const handleStop = async () => {
    if (serviceRef.current) {
      await serviceRef.current.stop();
      setIsConnected(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-blue-200 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>AI Medical Assistant</CardTitle>
        <CardDescription>
          Speak naturally. I'll help you book your appointment.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="h-32 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden p-4">
          {isConnected ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              </div>
              <p className="text-sm text-blue-600 font-medium">Listening...</p>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Connecting...</div>
          )}
        </div>

        <div className="text-center text-sm text-slate-600 min-h-[3rem] px-4">
          {transcript || "Say 'Hello' to start..."}
        </div>

        <div className="flex gap-4 w-full">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleStop}
            variant="destructive"
            className="flex-1"
            disabled={!isConnected}
          >
            <MicOff className="mr-2 h-4 w-4" /> Stop & Finish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
