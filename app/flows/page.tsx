import { CareFlowGrid } from "@/components/care-flows"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FlowsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-col gap-4 text-center">
          <p className="inline-flex items-center justify-center self-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
            Patient journey map
          </p>
          <h1 className="text-4xl font-extrabold text-slate-900">CareLink experience screens</h1>
          <p className="text-lg text-slate-600 max-w-3xl self-center">
            Onboarding through follow-up reminders with accessible, high-contrast controls, skeleton states, and decisive CTAs like
            Book Now, Join Call, and Order Refill.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/book" aria-label="Book Now from flows overview">
              <Button className="bg-blue-700 hover:bg-blue-800">Book Now</Button>
            </Link>
            <Link href="/login" aria-label="Go to login">
              <Button variant="outline" className="border-slate-300 text-slate-800">Sign in</Button>
            </Link>
          </div>
        </div>

        <CareFlowGrid />
      </div>
    </div>
  )
}
