'use server'

import { createClient } from "@/utils/supabase/server";

export async function getPrescriptionById(prescriptionId: string) {
    const supabase = await createClient();

    const { data: prescription } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", prescriptionId)
        .maybeSingle();

    return prescription || null;
}

export async function getOrderById(orderId: string) {
    const supabase = await createClient();

    const { data: order } = await supabase
        .from("medication_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

    return order || null;
}
