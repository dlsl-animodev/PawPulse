"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MedicationInventoryEdit from "./medication-inventory-edit";

interface ManageInventoryPageProps {
    searchParams: Promise<{
        medicationId: string;
    }>;
}

export default function ManageInventoryPage({
    searchParams,
}: ManageInventoryPageProps) {
    const [medicationId, setMedicationId] = useState<string>("");

    useEffect(() => {
        // Get searchParams
        const getSearchParams = async () => {
            const params = await searchParams;
            setMedicationId(params.medicationId);
        };

        getSearchParams();

        return () => {
            setMedicationId("");
        };
    }, [searchParams]);

    if (medicationId)
        return <MedicationInventoryEdit medicationId={medicationId} />;

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Title  */}
            <div>
                <h1 className="text-3xl font-bold text-blue-900">
                    Manage Inventory
                </h1>
                <p className="text-gray-600">
                    View and manage your current inventory of medications.
                </p>
            </div>

            <Card>
                <CardContent>
                    <p className="font-semibold text-sm text-muted-foreground">
                        Active Orders
                    </p>
                    <p className="text-4xl  font-bold mt-4">25</p>
                </CardContent>
            </Card>

            {/* Inventory Section  */}
            <div>
                <p className="text-2xl font-bold text-blue-900 mb-4">
                    Inventory
                </p>
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardContent>
                            <p className="text-2xl font-semibold mb-4">
                                {" "}
                                Medication Name
                            </p>
                            <p>
                                {" "}
                                <strong> Quantity: </strong> 10{" "}
                            </p>
                            <p>
                                {" "}
                                <strong>Price: </strong>PHP 150{" "}
                            </p>
                            <Link href={`/manage-inventory?medicationId=000f2cdb-d5b0-4db3-a4b7-3ce01a0e2a20`}>
                                <Button className="w-full mt-4">
                                    Edit inventory
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
