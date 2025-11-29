"use server";

import { createClient } from "@/utils/supabase/server";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

export async function getReminders() {
    const supabase = await createClient();

    const reminderData = await supabase
        .from("reminders")
        .select("*")
        .order("sent_at", { ascending: true });

    // ---- Fetch pet data ----
    const petId = reminderData.data?.[0]?.pet_id;

    let petData: PostgrestSingleResponse<{ name: string } | null> | null = null;
    if (petId) {
        petData = await supabase
            .from("pets")
            .select("name")
            .eq("id", petId)
            .single();
    }

    // ---- Fetch veterinarian data ----
    const vetId = reminderData.data?.[0]?.reminder_by;

    let vet: PostgrestSingleResponse<{ name: string } | null> | null = null;
    if (vetId) {
        vet = await supabase
            .from("veterinarians")
            .select("name")
            .eq("id", vetId)
            .single();
    }

    return {
        error: reminderData.error || petData?.error || vet?.error,
        data: reminderData.data
            ? reminderData.data.map((reminder) => ({
                  ...reminder,
                  name: petData?.data?.name ?? "Unknown Pet",
                  veterinarian: vet?.data?.name ?? "Unknown Veterinarian",
              }))
            : null,
        status: reminderData.status,
    };
}
