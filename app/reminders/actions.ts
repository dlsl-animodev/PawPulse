"use server";

import { createClient } from "@/utils/supabase/server";

export async function getReminders() {
    const supabase = await createClient();

    const reminderData = await supabase
        .from("reminders")
        .select("*")
        .order("sent_at", { ascending: true });

    // get pet name
    const petId = reminderData.data?.[0]?.pet_id;
    let petData;
    if (petId) {
        petData = await supabase
            .from("pets")
            .select("name")
            .eq("id", petId)
            .single();

        // get veterinarian
    }

    let vet;
    const vetId = reminderData.data?.[0]?.reminder_by;
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
                  name: petData?.data?.name || "Unknown Pet",
                  veterinarian: vet?.data?.name || "Unknown Veterinarian",
              }))
            : null,
        status: reminderData.status,
    };
}
