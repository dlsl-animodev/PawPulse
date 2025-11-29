"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getPrescriptionById, getPharmaciesWithMedication, createMedicationOrder } from "./actions";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";

interface Pharmacy {
    id: string;
    name: string;
    address: string;
    city: string;
    contact_phone: string;
    logo_url: string;
    delivery_fee: number;
    estimated_delivery_mins: number;
    inventory: {
        id: string;
        medication_name: string;
        unit_price: number;
        in_stock: boolean;
        requires_prescription: boolean;
        species_safe_for: string[];
        concentration: string;
    };
}

interface OrderPageProps {
    searchParams: Promise<{
        prescriptionId: string;
    }>;
}

export default function OrderPage({ searchParams }: OrderPageProps) {
    const router = useRouter();
    const [prescriptionLoading, setPrescriptionLoading] = useState<boolean>(true);
    const [pharmaciesLoading, setPharmaciesLoading] = useState<boolean>(true);
    const [prescription, setPrescription] = useState<any>(null);
    const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [deliveryAddress, setDeliveryAddress] = useState<string>("");
    const [deliveryNotes, setDeliveryNotes] = useState<string>("");
    const [isOrdering, setIsOrdering] = useState<boolean>(false);
    const [showOrderModal, setShowOrderModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            const prescriptionId = (await searchParams).prescriptionId;

            if (!prescriptionId) {
                toast.error("No prescription ID provided");
                router.push("/dashboard");
                return;
            }

            // fetch prescription
            const prescriptionData = await getPrescriptionById(prescriptionId);

            if (!prescriptionData) {
                toast.error("Prescription not found");
                router.push("/dashboard");
                return;
            }

            setPrescription(prescriptionData);
            setPrescriptionLoading(false);

            // fetch pharmacies with this medication
            const pharmacyData = await getPharmaciesWithMedication(prescriptionData.medication_name);
            setPharmacies(pharmacyData);
            setPharmaciesLoading(false);
        };

        fetchData();

        return () => {
            setPrescription(null);
            setPharmacies([]);
            setPrescriptionLoading(true);
            setPharmaciesLoading(true);
        };
    }, [searchParams, router]);

    const handleSelectPharmacy = (pharmacy: Pharmacy) => {
        setSelectedPharmacy(pharmacy);
        setShowOrderModal(true);
    };

    const handlePlaceOrder = async () => {
        if (!selectedPharmacy || !prescription) return;

        if (!deliveryAddress.trim()) {
            toast.error("Please enter a delivery address");
            return;
        }

        setIsOrdering(true);

        const result = await createMedicationOrder({
            prescriptionId: prescription.id,
            pharmacyId: selectedPharmacy.id,
            medicationName: selectedPharmacy.inventory.medication_name,
            quantity,
            unitPrice: selectedPharmacy.inventory.unit_price,
            deliveryFee: selectedPharmacy.delivery_fee,
            deliveryAddress,
            deliveryNotes,
            petId: prescription.pet_id,
        });

        setIsOrdering(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Order placed successfully!");
            setShowOrderModal(false);
            router.push("/dashboard");
        }
    };

    const calculateTotal = () => {
        if (!selectedPharmacy) return 0;
        return (selectedPharmacy.inventory.unit_price * quantity) + selectedPharmacy.delivery_fee;
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <Link href="/dashboard" className="text-blue-600 hover:underline hover:cursor-pointer">
                &larr; Back to Dashboard
            </Link>

            <div className="mt-6">
                <h1 className="text-3xl font-bold">
                    Select a Pharmacy to Order From
                </h1>
                <p className="text-gray-600">
                    Browse available pharmacies and choose one to place your order.
                </p>
            </div>

            <div className="flex flex-col gap-10">
                {/* prescription details section */}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
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
                                        </div>
                                        <div>
                                            <p>
                                                <strong>Pet:</strong>{" "}
                                                {prescription.pets?.name || "N/A"} ({prescription.pets?.species || "N/A"})
                                            </p>
                                            <p>
                                                <strong>Refills Remaining:</strong>{" "}
                                                {prescription.refills_remaining}
                                            </p>
                                            <p>
                                                <strong>Status:</strong>{" "}
                                                <span className={`capitalize ${prescription.status === "active" ? "text-green-600" : "text-gray-600"}`}>
                                                    {prescription.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* pharmacy list section */}
                <section>
                    <p className="text-2xl font-bold mb-4">Available Pharmacies</p>

                    {pharmaciesLoading ? (
                        <p className="text-gray-600">Loading pharmacies...</p>
                    ) : pharmacies.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center">
                                <p className="text-gray-600">
                                    No pharmacies currently have this medication in stock.
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Please check back later or contact your veterinarian for alternatives.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {pharmacies.map((pharmacy) => (
                                <Card key={`${pharmacy.id}-${pharmacy.inventory.id}`} className="w-full">
                                    <CardContent>
                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            {pharmacy.logo_url && (
                                                <img
                                                    src={pharmacy.logo_url}
                                                    alt={pharmacy.name}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold mb-2">
                                                    {pharmacy.name}
                                                </h3>
                                                <p className="text-gray-600">{pharmacy.address}, {pharmacy.city}</p>
                                                <p className="text-gray-600">Contact: {pharmacy.contact_phone}</p>

                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-medium">{pharmacy.inventory.medication_name}</p>
                                                    {pharmacy.inventory.concentration && (
                                                        <p className="text-sm text-gray-600">
                                                            Concentration: {pharmacy.inventory.concentration}
                                                        </p>
                                                    )}
                                                    <p className="text-lg font-bold text-green-600">
                                                        ₱{pharmacy.inventory.unit_price.toFixed(2)} per unit
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Delivery fee: ₱{pharmacy.delivery_fee.toFixed(2)}
                                                        {" "}({pharmacy.estimated_delivery_mins} mins est.)
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                className="mt-4 md:mt-0 px-6 py-2 rounded-2xl hover:cursor-pointer"
                                                onClick={() => handleSelectPharmacy(pharmacy)}
                                            >
                                                Order Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* order modal */}
            {showOrderModal && selectedPharmacy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold mb-4">Complete Your Order</h2>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="font-medium">{selectedPharmacy.name}</p>
                                    <p className="text-sm text-gray-600">{selectedPharmacy.inventory.medication_name}</p>
                                </div>

                                <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                                    <Textarea
                                        id="deliveryAddress"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                        placeholder="Enter your full delivery address"
                                        className="mt-1"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                                    <Textarea
                                        id="deliveryNotes"
                                        value={deliveryNotes}
                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                        placeholder="Any special instructions for delivery"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Unit Price:</span>
                                        <span>₱{selectedPharmacy.inventory.unit_price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Quantity:</span>
                                        <span>{quantity}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>₱{(selectedPharmacy.inventory.unit_price * quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery Fee:</span>
                                        <span>₱{selectedPharmacy.delivery_fee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>₱{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowOrderModal(false);
                                            setSelectedPharmacy(null);
                                        }}
                                        className="flex-1 hover:cursor-pointer"
                                        disabled={isOrdering}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handlePlaceOrder}
                                        className="flex-1 hover:cursor-pointer"
                                        disabled={isOrdering}
                                    >
                                        {isOrdering ? "Placing Order..." : "Place Order"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
