"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "./chat-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Send, Sparkles, User, X, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "Tell me about my current medications",
  "When is my next appointment?",
  "What should I ask my doctor?",
  "Help me prepare for my visit",
];

export function AiChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(message?: string) {
    const text = message || input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsLoading(true);

    const result = await sendChatMessage(
      text,
      messages.map((m) => ({ role: m.role, content: m.content }))
    );

    setIsLoading(false);

    if (result.error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, ${result.error}` },
      ]);
    } else if (result.response) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);
    }
  }

  function handleClearChat() {
    setMessages([]);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-32 rounded-full bg-paw-primary text-white shadow-lg flex items-center justify-center hover:bg-paw-primaryDark hover:cursor-pointer transition-all hover:scale-105 z-50"
      >
        <Sparkles className="h-6 w-6 mr-2" />
        Ask AI
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[420px] h-144 flex flex-col shadow-2xl z-50 border-paw-primary/20">
      <CardHeader className="bg-paw-primary text-white rounded-t-lg py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">CareLink AI</CardTitle>
              <CardDescription className="text-white/90 text-xs">
                Your personal health assistant
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-white/80 hover:text-white hover:cursor-pointer p-1"
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="h-8 w-8 rounded-full bg-paw-soft flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-paw-primary" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-sm text-paw-text">
                <p className="font-medium mb-2">
                  Hi! I&apos;m your CareLink AI assistant.
                </p>
                <p>
                  I have access to your medical records, appointments, and
                  prescriptions. Ask me anything about your healthcare!
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-paw-text font-medium">Try asking:</p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="block w-full text-left text-sm p-2 rounded-lg border border-gray-200 hover:border-paw-primary/50 hover:bg-paw-soft transition-colors hover:cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-paw-primary" : "bg-paw-soft"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-paw-primary" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 text-sm max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-paw-primary text-white"
                      : "bg-gray-100 text-paw-text"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:text-paw-dark">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-full bg-paw-soft flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-paw-primary" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-paw-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <div className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-paw-primary hover:bg-paw-primaryDark hover:cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-paw-text text-center mt-2">
          Personalized to your medical records
        </p>
      </div>
    </Card>
  );
}
