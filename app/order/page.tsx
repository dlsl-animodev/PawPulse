/*
    testpatient@gmail.com
    thisistestpatient

    patientex@gmail.com
    thisispatientex

    doc@gmail.com
    thisisdoc
*/

"use client";

import { useEffect, useState } from "react";

import { getPrescriptionById } from "./actions";

import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

const samplePharmacies = [
    {
        id: "pharmacy1",
        name: "HealthPlus Pharmacy",
        address: "123 Wellness St, Healthy City, HC 12345",
        contact: "(123) 456-7890",
        isPrescriptionAvailable: true,
    },
    {
        id: "pharmacy2",
        name: "CareWell Pharmacy",
        address: "456 Care Ave, Medic Town, MT 67890",
        contact: "(987) 654-3210",
        isPrescriptionAvailable: false,
    },
];

interface OrderPageProps {
    searchParams: Promise<{
        prescriptionId: string;
    }>;
}

export default function OrderPage({ searchParams }: OrderPageProps) {
    const [prescriptionLoading, setPrescriptionLoading] =
        useState<boolean>(true);
    const [prescription, setPrescription] = useState<any>(null);

    useEffect(() => {
        // Get prescription data
        const fetchPrescription = async () => {
            const prescriptionId = (await searchParams).prescriptionId;
            const prescription = await getPrescriptionById(prescriptionId);
            setPrescription(prescription);

            if (!prescription) {
                alert("Prescription not found");
                redirect("/dashboard");
                return;
            }

            setPrescriptionLoading(false);
        };

        fetchPrescription();

        return () => {
            setPrescription(null);
            setPrescriptionLoading(true);
        };
    }, [searchParams]);

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Title  */}
            <div>
                <h1 className="text-3xl font-bold text-blue-900">
                    Select a Pharmacy to Order From
                </h1>
                <p className="text-gray-600">
                    Browse available pharmacies and choose one to place your
                    order.
                </p>
            </div>
            {/* Content  */}
            <div className="flex flex-wrap gap-10">
                {/* Floating Prescription Left Section */}
                <section className="w-full">
                    <Card>
                        <CardContent>
                            {prescriptionLoading ? (
                                <p>Loading prescription...</p>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-semibold mb-4">
                                        Prescription Details
                                    </h2>
                                    <p>
                                        <strong>Medication Name:</strong>{" "}
                                        {prescription.medication_name}
                                    </p>
                                    <p>
                                        <strong>Dosage:</strong>{" "}
                                        {prescription.dosage}
                                    </p>
                                    <p>
                                        <strong>Instructions:</strong>{" "}
                                        {prescription.instructions}
                                    </p>
                                    <p>
                                        <strong>Refills Remaining:</strong>{" "}
                                        {prescription.refills_remaining}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
                {/* Pharmacy List Right Section */}
                <section>
                    <p className="text-2xl font-bold text-blue-900 mb-4">
                        {" "}
                        Pharmacies List{" "}
                    </p>
                    <div className="space-y-6">
                        {samplePharmacies
                            .filter(
                                (pharmacy) =>
                                    pharmacy.isPrescriptionAvailable === true
                            )
                            .map((pharmacy) => (
                                <Card key={pharmacy.id} className="w-96">
                                    <CardContent>
                                        <h3 className="text-xl font-semibold mb-2">
                                            {pharmacy.name}
                                        </h3>
                                        <p>{pharmacy.address}</p>
                                        <p>Contact: {pharmacy.contact}</p>
                                        <button
                                            className={`mt-4 px-4 py-2 rounded-2xl w-full ${
                                                pharmacy.isPrescriptionAvailable
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                            }`}
                                            disabled={
                                                !pharmacy.isPrescriptionAvailable
                                            }
                                            onClick={() =>
                                                // TODO: handle order placement
                                                alert(
                                                    `Order placed at ${pharmacy.name}!`
                                                )
                                            }
                                        >
                                            {pharmacy.isPrescriptionAvailable
                                                ? "Order Prescription"
                                                : "Prescription Not Available"}
                                        </button>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

// {
//   "id": "9563a5c3-6c00-4d3e-9aa1-48d0aac7e833",
//   "patient_id": "dbb6ff03-470f-4b10-a9b5-74431e5e6f4b",
//   "doctor_id": "6283fed0-8eca-4013-bd5c-35568806ad55",
//   "medication_name": "test",
//   "dosage": "test",
//   "instructions": "test",
//   "refills_remaining": 3,
//   "status": "active",
//   "created_at": "2025-11-28T08:01:03.628866+00:00"
// }
