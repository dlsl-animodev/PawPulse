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
import { Mic, MicOff, Loader2, Sparkles, Send, X } from "lucide-react";
import {
  ConsultationService,
  ConsultationResult,
} from "@/utils/ai/consultation/consultationService";
import { toast } from "sonner";
import { getGeminiApiKey } from "./actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AIBookingConsultationProps {
  onComplete: (result: ConsultationResult) => void;
  onCancel: () => void;
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  isFinal?: boolean;
}

export function AIBookingConsultation({
  onComplete,
  onCancel,
}: AIBookingConsultationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState("");
  const serviceRef = useRef<ConsultationService | null>(null);
  const volumeResetTimeout = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let service: ConsultationService | null = null;
    let isMounted = true;

    async function initService() {
      try {
        const apiKey = await getGeminiApiKey();
        if (!isMounted) return;

        service = new ConsultationService(apiKey, {
          onConnectionChange: (connected) => {
            if (isMounted) setIsConnected(connected);
          },
          onText: (text, isFinal) => {
            if (!isMounted) return;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              let newPrev = prev;

              // Finalize user message if it's still open when AI starts talking
              if (lastMsg && lastMsg.role === "user" && !lastMsg.isFinal) {
                newPrev = [...prev.slice(0, -1), { ...lastMsg, isFinal: true }];
              }

              const currentLastMsg = newPrev[newPrev.length - 1];

              if (
                currentLastMsg &&
                currentLastMsg.role === "ai" &&
                !currentLastMsg.isFinal
              ) {
                return [
                  ...newPrev.slice(0, -1),
                  {
                    ...currentLastMsg,
                    text: currentLastMsg.text + text,
                    isFinal,
                  },
                ];
              }

              if (!text) return newPrev;

              return [
                ...newPrev,
                { id: Date.now().toString(), role: "ai", text, isFinal },
              ];
            });
          },
          onInputText: (text) => {
            if (!isMounted) return;
            setMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg && lastMsg.role === "user" && !lastMsg.isFinal) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMsg, text: lastMsg.text + text },
                ];
              }
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "user",
                  text,
                  isFinal: false,
                },
              ];
            });
          },
          onAudioData: (buffer) => {
            if (!isMounted) return;
            let sum = 0;
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
              sum += data[i] * data[i];
            }
            const rms = Math.sqrt(sum / data.length);
            setVolume(rms);

            if (volumeResetTimeout.current) {
              clearTimeout(volumeResetTimeout.current);
            }
            volumeResetTimeout.current = setTimeout(() => {
              if (isMounted) setVolume(0);
            }, 100);
          },
          onOptionsReceived: (options, question) => {},
          onComplete: (result) => {
            if (isMounted) {
              onComplete(result);
              service?.stop();
            }
          },
          onError: (error) => {
            console.error(error);
            if (isMounted) {
              toast.error("An error occurred with the AI service.");
              setIsConnected(false);
            }
          },
          onInterrupted: () => {
            // if (isMounted) setTranscript("");
          },
        });

        serviceRef.current = service;
        await service.start();
      } catch (error) {
        console.error("Failed to initialize AI service:", error);
        if (isMounted) {
          toast.error("Failed to start AI service. Please try again.");
        }
      }
    }

    initService();

    return () => {
      isMounted = false;
      service?.stop();
      if (volumeResetTimeout.current) {
        clearTimeout(volumeResetTimeout.current);
      }
    };
  }, [onComplete]);

  const handleStop = async () => {
    if (serviceRef.current) {
      await serviceRef.current.stop();
      setIsConnected(false);
    }
  };

  const toggleMute = () => {
    if (serviceRef.current) {
      const newMutedState = !isMuted;
      serviceRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const handleSendText = () => {
    if (inputText.trim() && serviceRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          text: inputText,
          isFinal: true,
        },
      ]);
      serviceRef.current.sendTextResponse(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-0 md:p-4">
      <Card className="w-full h-full md:h-auto md:max-w-md mx-auto border-paw-primary/20 shadow-lg flex flex-col">
        <CardHeader className="text-center relative shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 md:hidden"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mx-auto bg-paw-soft p-3 rounded-full w-fit mb-4">
            <Sparkles className="h-6 w-6 text-paw-primary" />
          </div>
          <CardTitle className="text-paw-dark">AI Medical Assistant</CardTitle>
          <CardDescription>
            Speak naturally or type. I'll help you book your appointment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 flex-1 overflow-y-auto">
          <div className="h-32 w-full bg-paw-soft rounded-xl border border-paw-primary/10 flex items-center justify-center relative overflow-hidden p-4 shrink-0">
            {isConnected ? (
              <div className="flex flex-col items-center gap-2">
                {volume > 0.01 ? (
                  <div className="flex items-center gap-1 h-8">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-paw-primary rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(
                            8,
                            volume * 100 * (0.5 + Math.random() * 0.5)
                          )}px`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-paw-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-paw-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-paw-primary rounded-full animate-bounce"></div>
                  </div>
                )}
                <p className="text-sm text-paw-primary font-medium">
                  {volume > 0.01 ? "Speaking..." : "Listening..."}
                </p>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Connecting...</div>
            )}
          </div>

          <div className="flex-1 w-full overflow-y-auto px-2 space-y-4 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                Say "Hello" to start...
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-paw-primary text-white rounded-br-none"
                      : "bg-slate-100 text-slate-800 rounded-bl-none"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="w-full flex gap-2 shrink-0">
            <Input
              placeholder="Type your response..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSendText}
              disabled={!inputText.trim() || !isConnected}
              className="bg-paw-primary hover:bg-paw-primaryDark text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-4 w-full shrink-0 pb-4 md:pb-0">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 hidden md:flex"
            >
              Cancel
            </Button>
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`flex-1 ${
                isMuted
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : ""
              }`}
              disabled={!isConnected}
            >
              {isMuted ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" /> Unmute
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" /> Mute
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
