'use server'

import { createClient } from "@/utils/supabase/server";

export async function getPrescriptionById(prescriptionId: string) {
    const supabase = await createClient();

    const { data: prescription } = await supabase
        .from("prescriptions")
        .select("*, pets(name, species)")
        .eq("id", prescriptionId)
        .maybeSingle();

    return prescription || null;
}

// fetches pharmacies that have the medication in their inventory
export async function getPharmaciesWithMedication(medicationName: string) {
    const supabase = await createClient();

    // first get inventory items matching the medication
    const { data: inventoryItems, error: inventoryError } = await supabase
        .from("vet_pharmacy_inventory")
        .select(`
            id,
            medication_name,
            unit_price,
            in_stock,
            requires_prescription,
            species_safe_for,
            concentration,
            pharmacy_id,
            vet_pharmacies (
                id,
                name,
                address,
                city,
                contact_phone,
                logo_url,
                is_active,
                delivery_fee,
                estimated_delivery_mins
            )
        `)
        .ilike("medication_name", `%${medicationName}%`)
        .eq("in_stock", true);

    if (inventoryError) {
        console.error("Error fetching pharmacies:", inventoryError);
        return [];
    }

    // filter out inactive pharmacies and transform data
    const pharmaciesWithInventory = inventoryItems
        ?.filter((item: any) => item.vet_pharmacies?.is_active)
        .map((item: any) => ({
            id: item.vet_pharmacies.id,
            name: item.vet_pharmacies.name,
            address: item.vet_pharmacies.address,
            city: item.vet_pharmacies.city,
            contact_phone: item.vet_pharmacies.contact_phone,
            logo_url: item.vet_pharmacies.logo_url,
            delivery_fee: item.vet_pharmacies.delivery_fee,
            estimated_delivery_mins: item.vet_pharmacies.estimated_delivery_mins,
            inventory: {
                id: item.id,
                medication_name: item.medication_name,
                unit_price: item.unit_price,
                in_stock: item.in_stock,
                requires_prescription: item.requires_prescription,
                species_safe_for: item.species_safe_for,
                concentration: item.concentration,
            }
        })) || [];

    return pharmaciesWithInventory;
}

// creates a medication order
export async function createMedicationOrder(data: {
    prescriptionId: string;
    pharmacyId: string;
    medicationName: string;
    quantity: number;
    unitPrice: number;
    deliveryFee: number;
    deliveryAddress: string;
    deliveryNotes?: string;
    petId: string;
}) {
    const supabase = await createClient();

    // get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "You must be logged in to place an order" };
    }

    // verify the prescription belongs to the user
    const { data: prescription, error: prescriptionError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", data.prescriptionId)
        .eq("owner_id", user.id)
        .maybeSingle();

    if (prescriptionError || !prescription) {
        return { error: "Prescription not found or you don't have permission to order" };
    }

    if (prescription.status !== "active") {
        return { error: "This prescription is no longer active" };
    }

    // calculate total price
    const totalPrice = (data.unitPrice * data.quantity) + data.deliveryFee;

    // calculate estimated delivery time
    const { data: pharmacy } = await supabase
        .from("vet_pharmacies")
        .select("estimated_delivery_mins")
        .eq("id", data.pharmacyId)
        .maybeSingle();

    const estimatedDeliveryAt = new Date();
    estimatedDeliveryAt.setMinutes(
        estimatedDeliveryAt.getMinutes() + (pharmacy?.estimated_delivery_mins || 60)
    );

    // create the order
    const { data: order, error: orderError } = await supabase
        .from("medication_orders")
        .insert({
            owner_id: user.id,
            pet_id: data.petId,
            prescription_id: data.prescriptionId,
            pharmacy_id: data.pharmacyId,
            medication_name: data.medicationName,
            quantity: data.quantity,
            unit_price: data.unitPrice,
            delivery_fee: data.deliveryFee,
            total_price: totalPrice,
            delivery_address: data.deliveryAddress,
            delivery_notes: data.deliveryNotes || null,
            status: "pending",
            estimated_delivery_at: estimatedDeliveryAt.toISOString(),
        })
        .select()
        .single();

    if (orderError) {
        console.error("Error creating order:", orderError);
        return { error: "Failed to create order" };
    }

    return { success: true, order };
}