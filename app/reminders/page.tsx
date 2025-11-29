"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReminders } from "./actions";

import { useState, useEffect } from "react";

interface Reminder {
    id: string;
    type: string;
    title: string;
    message: string;
    appointment_id: string;
    reminder_by: string;
    reminder_to: string;
    sent_at: string;
    pet_id: string;
    name : string;
    veterinarian: string;
}

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        const fetchReminders = async () => {
            const result = await getReminders();

            // result = { error, data, status... }
            if (result?.data) {
                setReminders(result.data);
            }
        };
        fetchReminders();

        return () => setReminders([]);
    }, []);



    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
                ← Back to Dashboard
            </Link>

            <div className="mt-6">
                <h1 className="text-3xl font-bold">Reminders</h1>
                <p className="text-gray-600">
                    Manage your pet care reminders here.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {reminders.length === 0 && (
                    <p className="text-gray-500">No reminders found.</p>
                )}

                {reminders.map((reminder) => {
                    const sentDate = new Date(reminder.sent_at);
                    const formattedDate = sentDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    });
                    const formattedTime = sentDate.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    return (
                        <Card key={reminder.id} className="bg-[#eab05c]">
                            <CardContent className="space-y-6">
                                {/* Pet ID (you can replace with actual pet name) */}
                                <Badge variant="outline">
                                    {reminder.name}
                                </Badge>

                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">
                                        By {reminder.veterinarian}
                                    </p>
                                    <p className="text-sm">
                                        {formattedDate} | {formattedTime}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-2xl font-semibold">
                                        {reminder.title}
                                    </p>
                                    <p>{reminder.message}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
