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