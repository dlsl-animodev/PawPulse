"use client";

import { signup, getAuthStatus } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";

function SubmitButton({ isUpgrade }: { isUpgrade: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full hover:cursor-pointer"
      type="submit"
      disabled={pending}
    >
      {pending
        ? isUpgrade
          ? "Completing account..."
          : "Creating account..."
        : isUpgrade
        ? "Complete Account"
        : "Create Account"}
    </Button>
  );
}

const specialties = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Psychiatry",
  "Orthopedics",
  "Neurology",
  "Ophthalmology",
  "Dentistry",
];

const pharmacies = [
  "Mercury Drug - Multiple Branches Nationwide",
  "Watsons Pharmacy - SM Megamall, Mandaluyong",
  "Rose Pharmacy - Ayala Center, Makati",
];

// helper function to get prefill data from localStorage
function getGuestPrefillData(): { fullName: string; email: string } {
  if (typeof window === "undefined") {
    return { fullName: "", email: "" };
  }
  try {
    const storedData = localStorage.getItem("guestBookingData");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed.contact) {
        const fullName = [parsed.contact.firstName, parsed.contact.lastName]
          .filter(Boolean)
          .join(" ");
        return {
          fullName: fullName || "",
          email: parsed.contact.email || "",
        };
      }
    }
  } catch {
    // ignore localStorage errors
  }
  return { fullName: "", email: "" };
}

function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"patient" | "doctor" | "pharmacist">(
    "patient"
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const isUpgrade = searchParams.get("upgrade") === "true";
  const message = searchParams.get("message");
  const nextUrl = searchParams.get("next");

  useEffect(() => {
    // check if user is currently anonymous
    async function checkAuth() {
      const status = await getAuthStatus();
      setIsAnonymous(status.isAnonymous);
    }
    if (isUpgrade) {
      checkAuth();
    }
  }, [isUpgrade]);

  // load prefill data on mount (directly set input values without triggering re-render)
  useEffect(() => {
    const prefill = getGuestPrefillData();
    if (prefill.fullName && fullNameRef.current && !fullNameRef.current.value) {
      fullNameRef.current.value = prefill.fullName;
    }
    if (prefill.email && emailRef.current && !emailRef.current.value) {
      emailRef.current.value = prefill.email;
    }
  }, []);

  async function handleSubmit(formData: FormData) {
    const res = await signup(formData);
    if (res?.error) {
      setError(res.error);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-blue-900">
          {isUpgrade && isAnonymous ? "Complete Your Account" : "Join CareLink"}
        </CardTitle>
        <CardDescription className="text-center">
          {message ||
            (isUpgrade && isAnonymous
              ? "Register to book appointments and access your full dashboard"
              : "Create an account to manage your health")}
        </CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {isUpgrade && isAnonymous && (
            <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded-md border border-blue-200">
              Your consultation history will be saved to your new account
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              ref={fullNameRef}
              id="fullName"
              name="fullName"
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label>I am a</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:cursor-pointer ${
                  role === "patient"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Patient</div>
                <div className="text-xs text-gray-500">Book appointments</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:cursor-pointer ${
                  role === "doctor"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Doctor</div>
                <div className="text-xs text-gray-500">Manage patients</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("pharmacist")}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:cursor-pointer ${
                  role === "pharmacist"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold">Pharmacist</div>
                <div className="text-xs text-gray-500">Manage medications</div>
              </button>
            </div>
          </div>

          {role === "doctor" && (
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <select
                id="specialty"
                name="specialty"
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="next" value={nextUrl || ""} />
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <SubmitButton isUpgrade={isUpgrade && isAnonymous} />
          <div className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:underline hover:cursor-pointer"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<LoadingCard />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
