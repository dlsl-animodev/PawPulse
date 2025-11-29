"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
// 000f2cdb-d5b0-4db3-a4b7-3ce01a0e2a20

import { useState, useEffect } from "react";

interface MedicationInventoryEditProps {
    medicationId: string;
}

export default function MedicationInventoryEdit({
    medicationId,
}: MedicationInventoryEditProps) {
    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <Link href="/manage-inventory">
                <Button variant="link" className="px-0 mb-4">
                    &larr; Back to Inventory
                </Button>
            </Link>
            {/* Title  */}
            <div>
                <h1 className="text-3xl font-bold text-blue-900">Item Name</h1>
                <p className="text-gray-600">
                    Edit the details of your medication inventory item here.
                </p>
            </div>

            {/* Main Content  */}
            <div className="flex flex-col gap-4">
                <section>
                    <p className="font-semibold text-sm mb-2">Medication Name</p>
                    <Input />
                </section>
                <section>
                    <p className="font-semibold text-sm mb-2">Unit Price</p>
                    <Input />
                </section>
                <section>
                    <p className="font-semibold text-sm mb-2">Quantity</p>
                    <Input />
                </section>
                <Button className="w-full">
                    Save changes
                </Button>
            </div>
        </div>
    );
}
