// components/pet/pet-profile-client.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowBigRight, Edit } from "lucide-react";
import Link from "next/link";

type PetServerPayload = {
  pet: {
    id: string;
    name?: string | null;
    species?: string | null;
    breed?: string | null;
    gender?: string | null;
    age?: string | number | null;
    weight_kg?: number | string | null;
    color?: string | null;
    profile_image_url?: string | null;
    notes?: string | null;
    owner_id?: string | null;
  } | null;
  appointments?: Array<Record<string, any>>;
  prescriptions?: Array<Record<string, any>>;
  history?: Array<Record<string, any>>;
};

export default function PetProfile({ pet }: { pet: PetServerPayload }) {
  const petData = pet?.pet;
  const appointments = pet?.appointments ?? [];
  const prescriptions = pet?.prescriptions ?? [];
  const history = pet?.history ?? [];

  const appointmentsRef = useRef<HTMLDivElement | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const prescriptionsRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    const yOffset = -80;
    const y =
      ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (!petData) {
    return <div className="p-6 text-red-500">Pet not found.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-10">
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-blue-900">
          {petData.name ?? "Unnamed pet"}
        </h1>
        <p className="text-gray-600">
          View and manage this pet’s full profile.
        </p>
      </div>

      {appointments.length > 0 && (
        <Card className="bg-amber-300">
          <CardContent className="space-y-3">
            <Badge variant="outline">Upcoming</Badge>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-lg">
                Next appointment: {appointments[0].date ?? "TBD"}
              </p>
              <Button className="bg-orange-600 text-white">
                <ArrowBigRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <p className="font-medium text-sm mb-2">Jump to section</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => scrollTo(appointmentsRef)}>
            Appointments
          </Button>
          <Button variant="outline" onClick={() => scrollTo(detailsRef)}>
            Pet Details
          </Button>
          <Button variant="outline" onClick={() => scrollTo(prescriptionsRef)}>
            Prescriptions
          </Button>
          <Button variant="outline" onClick={() => scrollTo(historyRef)}>
            Medical History
          </Button>
        </div>
      </div>

      <div ref={detailsRef}>
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Pet Details</h2>
              <Edit />
            </div>

            <Image
              src={petData.profile_image_url ?? "/placeholder.jpg"}
              alt={petData.name ?? "pet"}
              width={600}
              height={340}
              className="rounded-md w-full aspect-video object-cover"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Name", value: petData.name },
                { label: "Species", value: petData.species },
                { label: "Breed", value: petData.breed },
                { label: "Age", value: petData.age },
                { label: "Weight (kg)", value: petData.weight_kg },
                { label: "Gender", value: petData.gender },
                { label: "Color", value: petData.color },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-sm font-semibold mb-1">{item.label}</p>
                  <Input disabled value={item.value ?? ""} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={appointmentsRef}>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Appointments</h2>
              <Button>New</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Reason", "Veterinarian"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((a) => (
                      <tr key={a.id ?? JSON.stringify(a)}>
                        <td className="px-4 py-2">{a.date}</td>
                        <td className="px-4 py-2">{a.reason}</td>
                        <td className="px-4 py-2">{a.vet_name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-gray-500">
                        No appointments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={prescriptionsRef}>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-semibold">Prescriptions</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Medication", "Dosage", "Prescribed By"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-2 text-left text-xs uppercase"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {prescriptions.length > 0 ? (
                    prescriptions.map((p) => (
                      <tr key={p.id ?? JSON.stringify(p)}>
                        <td className="px-4 py-2">{p.date ?? p.date_issued}</td>
                        <td className="px-4 py-2">{p.medication}</td>
                        <td className="px-4 py-2">{p.dosage}</td>
                        <td className="px-4 py-2">{p.vet_name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-gray-500">
                        No prescriptions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={historyRef}>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-semibold">Medical History</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead className="bg-gray-50">
                  <tr>
                    {["Date", "Condition", "Treatment", "Notes"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {history.length > 0 ? (
                    history.map((h) => (
                      <tr key={h.id ?? JSON.stringify(h)}>
                        <td className="px-4 py-2">{h.date}</td>
                        <td className="px-4 py-2">{h.condition}</td>
                        <td className="px-4 py-2">{h.treatment}</td>
                        <td className="px-4 py-2">{h.notes}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-gray-500">
                        No medical history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
