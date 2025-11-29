"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowBigRight, Edit } from "lucide-react";
import Link from "next/link";

import DogImage from "../../public/dog.jpg";
import Image from "next/image";

interface PetProfilePageProps {
    searchParams: Promise<{
        petId: string;
    }>;
}

export default function PetProfilePage({ searchParams }: PetProfilePageProps) {
    // Refs for scrolling
    const appointmentsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);
    const prescriptionsRef = useRef<HTMLDivElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (ref.current) {
            const yOffset = -80; // adjust offset
            const y =
                ref.current.getBoundingClientRect().top +
                window.pageYOffset +
                yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:underline"
            >
                &larr; Back to Dashboard
            </Link>

            {/* Title */}
            <div className="mt-8">
                <h1 className="text-3xl font-bold text-blue-900">
                    Pet Profile
                </h1>
                <p className="text-gray-600">
                    View and manage your pet profile.
                </p>
            </div>

            <Card className="bg-[#eab05c]">
                <CardContent className="space-y-4">
                    <Badge variant={"outline"}> Urgent </Badge>
                    <div className="flex items-center gap-16">
                        <p className="font-semibold text-xl">
                            Appointment today at 3:00 PM
                        </p>
                        <Button
                            variant={"secondary"}
                            className="bg-[#d95022] text-white"
                        >
                            <ArrowBigRight />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Jump Buttons */}
            <div>
                <p className="font-medium text-sm mb-2">Jump to a section</p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={"outline"}
                        onClick={() => scrollTo(appointmentsRef)}
                    >
                        Appointments
                    </Button>
                    <Button
                        variant={"outline"}
                        onClick={() => scrollTo(detailsRef)}
                    >
                        Pet Details
                    </Button>
                    <Button
                        variant={"outline"}
                        onClick={() => scrollTo(prescriptionsRef)}
                    >
                        Prescriptions
                    </Button>
                    <Button
                        variant={"outline"}
                        onClick={() => scrollTo(historyRef)}
                    >
                        Medical History
                    </Button>
                </div>
            </div>

            {/* Pet Details */}
            <div ref={detailsRef}>
                <Card>
                    <CardContent>
                        <div className="flex ">
                            <h2 className="text-2xl font-semibold mb-4">
                                Pet Details
                            </h2>
                            <Edit />
                        </div>
                        <Image
                            src={DogImage}
                            alt="Dog Picture"
                            width={200}
                            height={200}
                            className="rounded-md mb-4 w-full aspect-video object-cover"
                        />
                        <section className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Pet Name
                                </p>
                                <Input disabled />
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Species
                                </p>
                                <Input disabled />
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Breed
                                </p>
                                <Input disabled />
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Age
                                </p>
                                <Input disabled />
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Weight
                                </p>
                                <Input disabled />
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-2">
                                    Gender
                                </p>
                                <Input disabled />
                            </div>
                        </section>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments */}
            <div ref={appointmentsRef}>
                <Card>
                    <CardContent>
                        <div className="space-y-2 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">
                                Appointments
                            </h2>
                            <Button>New </Button>
                        </div>
                    </CardContent>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 ">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Veterinarian
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2024-05-01
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Annual Checkup
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Dr. Smith
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2023-11-15
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Vaccination
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Dr. Johnson
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Prescriptions */}
            <div ref={prescriptionsRef}>
                <Card>
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">
                            Prescriptions
                        </h2>
                    </CardContent>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date Issued
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medication
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Dosage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Prescribed By
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2024-04-22
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Amoxicillin
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        50mg / 2x daily
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Dr. Smith
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2023-12-10
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Deworming Tablet
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        1 tablet / single dose
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Dr. Johnson
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Medical History */}
            <div ref={historyRef}>
                <Card>
                    <CardContent>
                        <h2 className="text-2xl font-semibold mb-4">
                            Medical History
                        </h2>
                    </CardContent>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Condition / Diagnosis
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Treatment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Notes
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2024-03-18
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Skin Allergy
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Antihistamine Injection
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Improved after 2 days
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-6 py-4 text-sm">
                                        2023-10-02
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Ear Infection
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Ear Drops (7 days)
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        Follow-up recommended
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
