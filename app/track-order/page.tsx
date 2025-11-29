"use client";

import { useEffect, useState } from "react";

import { getOrderById, getPrescriptionById } from "./actions";

import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TrackOrderPageProps {
    searchParams: Promise<{ orderId: string }>;
}

export default function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
    const [orderLoading, setOrderLoading] = useState<boolean>(true);
    const [order, setOrder] = useState<any>(null);
    const [prescription, setPrescription] = useState<any>(null);

    useEffect(() => {
        // Get order details
        const fetchOrderDetails = async () => {
            //TODO: HANDLE FETCHING ORDER DETAILS

            const orderId = (await searchParams).orderId;
            if (!orderId) {
                alert("No order ID provided");
                redirect("/dashboard");
                return;
            }

            const orderDetails = await getOrderById(orderId);
            if (!orderDetails) redirect("/dashboard");
            else setOrder(orderDetails);

            if (!orderDetails || !orderDetails.prescription_id) {
                alert("Order not found");
                redirect("/dashboard");
                return;
            }

            // Get prescription
            const prescriptionDetails = await getPrescriptionById(
                orderDetails.prescription_id
            );
            setPrescription(prescriptionDetails);

            setOrderLoading(false);
        };

        fetchOrderDetails();

        return () => {
            setOrder(null);
            setOrderLoading(true);
        };
    }, [searchParams]);

    return (
        <div className="container mx-auto  py-8 px-4 space-y-8">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
                &larr; Back to Dashboard
            </Link>
            <div className="mt-6">
                <h1 className="text-3xl font-bold text-blue-900">
                    Order Details
                </h1>
                <p>
                    Track your order for{" "}
                    {orderLoading ? "..." : order.medication_name}.
                </p>
            </div>

            {/* Content Wrapper */}
            <div className="flex flex-col items-center">
                {/* Content  */}
                <div className="w-full">
                    {/* Top Section  */}
                    <section className="w-full">
                        <Card>
                            <CardContent className="flex flex-col items-center gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Order Status
                                </p>
                                <p className="text-4xl font-medium">
                                    {orderLoading
                                        ? "Loading..."
                                        : order.status.toUpperCase()}
                                </p>
                                {/* Button Group  */}
                                <div className="flex flex-col gap-2 w-full mt-4">
                                    <Button className="w-full">Cancel Order</Button>
                                    <Button className="w-full">Edit Delivery Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        {/* Body Left Section  */}
                        <section>
                            <Card>
                                <CardContent>
                                    <h2 className="text-2xl font-semibold mb-4">
                                        Order Details
                                    </h2>
                                    {orderLoading ? (
                                        <p>Loading order details...</p>
                                    ) : (
                                        <div>
                                            <p>
                                                <strong>
                                                    Medication Name:
                                                </strong>{" "}
                                                {order.medication_name}
                                            </p>
                                            <p>
                                                <strong>Quantity:</strong>{" "}
                                                {order.quantity}
                                            </p>
                                            <p>
                                                <strong>Ordered At:</strong>{" "}
                                                {new Date(
                                                    order.ordered_at
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                        {/* Body Right Section  */}
                        <section>
                            <Card>
                                <CardContent>
                                    <h2 className="text-2xl font-semibold mb-4">
                                        Prescription Details
                                    </h2>
                                    {orderLoading || !prescription ? (
                                        <p>Loading prescription...</p>
                                    ) : (
                                        <div>
                                            <p>
                                                <strong>
                                                    Medication Name:
                                                </strong>{" "}
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
                                                <strong>
                                                    Refills Remaining:
                                                </strong>{" "}
                                                {prescription.refills_remaining}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
