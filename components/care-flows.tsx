import type { ReactNode } from "react"
import { Calendar, CheckCircle2, Filter, PhoneCall, Pill, ShieldCheck, Sparkles, Video } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const SkeletonLine = ({ width = "w-full" }: { width?: string }) => (
  <div className={`h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/70 animate-pulse ${width}`} aria-hidden="true" />
)

const SkeletonButton = ({ label }: { label: string }) => (
  <button
    type="button"
    className="w-full rounded-md bg-slate-200 text-slate-600 py-2 font-semibold animate-pulse"
    aria-label={`${label} loading state`}
    disabled
  >
    {label}
  </button>
)

const ScreenShell = ({
  title,
  description,
  accent,
  children,
}: {
  title: string
  description: string
  accent: string
  children: ReactNode
}) => (
  <Card className="h-full border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500" role="region" aria-label={title}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-slate-900">
        <span className={`inline-flex size-9 items-center justify-center rounded-full ${accent} text-white`} aria-hidden="true">
          <Sparkles className="size-5" />
        </span>
        {title}
      </CardTitle>
      <CardDescription className="text-slate-600">{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
)

const AccessibleField = ({
  id,
  label,
  placeholder,
  type = "text",
  autoFocus,
  required,
}: {
  id: string
  label: string
  placeholder: string
  type?: string
  autoFocus?: boolean
  required?: boolean
}) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-slate-800 font-semibold">
      {label}
    </Label>
    <Input
      id={id}
      name={id}
      placeholder={placeholder}
      type={type}
      aria-label={label}
      autoFocus={autoFocus}
      required={required}
      className="border-slate-300 focus-visible:ring-blue-600"
    />
  </div>
)

export const OnboardingScreen = () => (
  <ScreenShell
    title="Onboarding"
    description="Collect key details and guide patients with clear next steps."
    accent="bg-blue-600"
  >
    <div className="grid gap-4" role="form" aria-label="Patient onboarding form" tabIndex={0}>
      <AccessibleField id="full-name" label="Full name" placeholder="Jane Patient" autoFocus required />
      <AccessibleField id="email" label="Email address" placeholder="jane.patient@email.com" type="email" required />
      <div className="space-y-2">
        <Label htmlFor="goals" className="text-slate-800 font-semibold">
          Care goals
        </Label>
        <Textarea
          id="goals"
          name="goals"
          placeholder="Share your goals so we can personalize your care plan"
          aria-label="Care goals"
          className="min-h-[80px] border-slate-300 focus-visible:ring-blue-600"
        />
      </div>
    </div>
    <div className="space-y-2" aria-live="polite">
      <SkeletonLine width="w-2/3" />
      <SkeletonLine width="w-1/2" />
    </div>
    <div className="flex items-center gap-3">
      <Button className="bg-blue-700 hover:bg-blue-800" aria-label="Continue onboarding">
        Continue
      </Button>
      <Button variant="outline" aria-label="Book Now from onboarding" className="border-blue-600 text-blue-700">
        Book Now
      </Button>
    </div>
  </ScreenShell>
)

export const DoctorSearchScreen = () => (
  <ScreenShell
    title="Doctor search & filter"
    description="Filter by specialty, language, and next availability."
    accent="bg-indigo-600"
  >
    <div className="grid gap-3" role="form" aria-label="Doctor search filters" tabIndex={0}>
      <AccessibleField id="specialty" label="Specialty" placeholder="Cardiology" />
      <AccessibleField id="language" label="Language" placeholder="English, Spanish" />
      <div className="flex items-center gap-3">
        <Label htmlFor="availability" className="text-slate-800 font-semibold">
          Next availability
        </Label>
        <button
          id="availability"
          className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Filter by next available appointment"
        >
          <Calendar className="size-4" aria-hidden="true" />
          Choose date
        </button>
        <button
          className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Apply advanced filters"
        >
          <Filter className="size-4" aria-hidden="true" />
          Filters
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Doctor results loading">
      {[1, 2].map((id) => (
        <Card key={id} className="p-4 border-slate-200">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-full bg-slate-200 animate-pulse" aria-hidden="true" />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="w-2/3" />
              <SkeletonLine width="w-1/2" />
              <SkeletonLine width="w-1/3" />
            </div>
          </div>
          <CardFooter className="pt-4">
            <SkeletonButton label="Book Now" />
          </CardFooter>
        </Card>
      ))}
    </div>
    <div className="flex justify-end">
      <Link href="/book" aria-label="Go to full doctor search results">
        <Button className="bg-indigo-600 hover:bg-indigo-700" aria-label="Book Now">
          Book Now
        </Button>
      </Link>
    </div>
  </ScreenShell>
)

export const AppointmentBookingScreen = () => (
  <ScreenShell
    title="Appointment booking"
    description="Confirm visit type, time, and payment with clear validation."
    accent="bg-emerald-600"
  >
    <div className="grid gap-3" role="form" aria-label="Appointment booking form" tabIndex={0}>
      <AccessibleField id="visit-type" label="Visit type" placeholder="Video consultation" />
      <AccessibleField id="date" label="Date" placeholder="Select date" type="date" />
      <AccessibleField id="time" label="Time" placeholder="10:30 AM" type="time" />
    </div>
    <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/70 p-4" aria-live="polite">
      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
        <CheckCircle2 className="size-5" aria-hidden="true" />
        Eligibility confirmed
      </div>
      <p className="text-sm text-emerald-800/80 mt-1">Insurance verified automatically before payment.</p>
    </div>
    <div className="flex items-center gap-3">
      <Button className="bg-emerald-600 hover:bg-emerald-700" aria-label="Book Now appointment">
        Book Now
      </Button>
      <Button variant="outline" aria-label="Add to calendar" className="border-emerald-600 text-emerald-700">
        Add to calendar
      </Button>
    </div>
  </ScreenShell>
)

export const InCallScreen = () => (
  <ScreenShell
    title="In-call view"
    description="Accessible controls for video, captions, and hand-raise."
    accent="bg-sky-600"
  >
    <div className="grid md:grid-cols-3 gap-4" role="group" aria-label="Live consultation layout" tabIndex={0}>
      <div className="md:col-span-2 h-48 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
        <Video className="size-8" aria-hidden="true" />
        <span className="sr-only">Video feed placeholder</span>
      </div>
      <div className="space-y-3" aria-label="Call controls" role="toolbar">
        <Button className="w-full bg-sky-600 hover:bg-sky-700" aria-label="Join Call">
          Join Call
        </Button>
        <Button variant="outline" className="w-full border-slate-300 text-slate-800" aria-label="Toggle captions">
          Enable captions
        </Button>
        <Button variant="outline" className="w-full border-slate-300 text-slate-800" aria-label="Raise hand">
          Raise hand
        </Button>
      </div>
    </div>
    <div className="flex items-center gap-3 text-sm text-slate-700" role="status" aria-live="polite">
      <ShieldCheck className="size-4 text-sky-700" aria-hidden="true" />
      End-to-end encryption and color-contrast compliant controls.
    </div>
  </ScreenShell>
)

export const PrescriptionCheckoutScreen = () => (
  <ScreenShell
    title="Prescription checkout"
    description="Verify refills, delivery, and insurance before payment."
    accent="bg-amber-600"
  >
    <div className="space-y-3" role="form" aria-label="Prescription checkout form" tabIndex={0}>
      <AccessibleField id="medication" label="Medication" placeholder="Atorvastatin 20mg" required />
      <AccessibleField id="quantity" label="Quantity" placeholder="30 tablets" required />
      <div className="grid gap-2">
        <Label htmlFor="delivery" className="text-slate-800 font-semibold">
          Delivery preference
        </Label>
        <Textarea
          id="delivery"
          name="delivery"
          placeholder="Enter address or pickup pharmacy"
          aria-label="Delivery preference"
          className="min-h-[70px] border-slate-300 focus-visible:ring-amber-600"
        />
      </div>
    </div>
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2 text-amber-800 font-semibold">
        <Pill className="size-4" aria-hidden="true" />
        Copay estimated at $15
      </div>
      <SkeletonLine width="w-1/2" />
    </div>
    <div className="flex items-center gap-3">
      <Button className="bg-amber-600 hover:bg-amber-700" aria-label="Order Refill">
        Order Refill
      </Button>
      <Button variant="outline" className="border-amber-500 text-amber-700" aria-label="Save for later">
        Save for later
      </Button>
    </div>
  </ScreenShell>
)

export const ReminderScreen = () => (
  <ScreenShell
    title="Reminders"
    description="Set reminders for medication, vitals, and follow-ups."
    accent="bg-purple-600"
  >
    <div className="grid gap-3" role="form" aria-label="Reminder setup form" tabIndex={0}>
      <AccessibleField id="reminder-title" label="Reminder title" placeholder="Morning medication" />
      <AccessibleField id="reminder-time" label="Time" placeholder="08:00 AM" type="time" />
      <AccessibleField id="reminder-frequency" label="Frequency" placeholder="Daily" />
    </div>
    <div className="grid grid-cols-2 gap-2" aria-label="Example reminder skeletons" role="status">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-lg border border-slate-200 p-3 space-y-2">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-1/2" />
        </div>
      ))}
    </div>
    <div className="flex items-center gap-3">
      <Button className="bg-purple-600 hover:bg-purple-700" aria-label="Save reminder">
        Save reminder
      </Button>
      <Button variant="outline" className="border-purple-500 text-purple-700" aria-label="Send test notification">
        Send test notification
      </Button>
    </div>
  </ScreenShell>
)

export const CareFlowGrid = () => (
  <div className="grid gap-6 lg:grid-cols-2" aria-label="Care journey screens">
    <OnboardingScreen />
    <DoctorSearchScreen />
    <AppointmentBookingScreen />
    <InCallScreen />
    <PrescriptionCheckoutScreen />
    <ReminderScreen />
    <Card className="lg:col-span-2 border-dashed border-2 border-slate-200 bg-slate-50/80">
      <CardHeader>
        <CardTitle className="text-slate-900">Checklist</CardTitle>
        <CardDescription className="text-slate-600">
          Each CTA uses clear labels, maintains focus order, and meets WCAG color contrast.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-slate-700 text-sm" role="list">
        <div className="flex items-center gap-2" role="listitem">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          Skeleton states communicate loading for doctor cards and reminders.
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          Buttons expose aria-labels and high-contrast backgrounds for the primary CTAs: Book Now, Join Call, Order Refill.
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          Form fields declare labels, required states, and focus outlines for keyboard navigation.
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <PhoneCall className="size-4 text-blue-600" aria-hidden="true" />
          Dedicated in-call actions maintain tab order and aria support for captions and hand-raise.
        </div>
      </CardContent>
    </Card>
  </div>
)
