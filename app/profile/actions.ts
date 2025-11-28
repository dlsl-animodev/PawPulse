"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type PatientDetails = {
  id?: string;
  profile_id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  profile_completion_percent: number;
};

export type PatientAllergy = {
  id?: string;
  profile_id: string;
  allergy_type: "drug" | "food" | "environmental" | "other";
  allergen: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  reaction_description: string | null;
  diagnosed_date: string | null;
  notes: string | null;
};

export type PatientCondition = {
  id?: string;
  profile_id: string;
  condition_name: string;
  condition_type: "chronic" | "acute" | "resolved" | "hereditary";
  diagnosis_date: string | null;
  diagnosed_by: string | null;
  current_status: "active" | "managed" | "resolved" | "monitoring";
  treatment_notes: string | null;
  medications: string | null;
  notes: string | null;
};

export type PatientSurgery = {
  id?: string;
  profile_id: string;
  procedure_name: string;
  surgery_type:
    | "elective"
    | "emergency"
    | "cosmetic"
    | "diagnostic"
    | "therapeutic";
  surgery_date: string | null;
  hospital_name: string | null;
  surgeon_name: string | null;
  reason: string | null;
  outcome: "successful" | "complications" | "ongoing_recovery" | "unknown";
  complications: string | null;
  follow_up_required: boolean;
  notes: string | null;
};

export async function getPatientDetails() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("patient_details")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function upsertPatientDetails(details: Partial<PatientDetails>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // check if record exists
  const { data: existing } = await supabase
    .from("patient_details")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    // update
    const { error } = await supabase
      .from("patient_details")
      .update({ ...details, profile_id: user.id })
      .eq("profile_id", user.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // insert
    const { error } = await supabase
      .from("patient_details")
      .insert({ ...details, profile_id: user.id });

    if (error) {
      return { error: error.message };
    }
  }

  // also update the full_name in profiles if name changed
  if (details.first_name || details.last_name) {
    const fullName = [details.first_name, details.middle_name, details.last_name]
      .filter(Boolean)
      .join(" ");

    if (fullName) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);
    }
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function getPatientAllergies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("patient_allergies")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data || [] };
}

export async function addPatientAllergy(allergy: Omit<PatientAllergy, "id" | "profile_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_allergies")
    .insert({ ...allergy, profile_id: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deletePatientAllergy(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_allergies")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function getPatientConditions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("patient_conditions")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data || [] };
}

export async function addPatientCondition(condition: Omit<PatientCondition, "id" | "profile_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_conditions")
    .insert({ ...condition, profile_id: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deletePatientCondition(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_conditions")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function getPatientSurgeries() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("patient_surgeries")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data || [] };
}

export async function addPatientSurgery(surgery: Omit<PatientSurgery, "id" | "profile_id">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_surgeries")
    .insert({ ...surgery, profile_id: user.id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function deletePatientSurgery(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("patient_surgeries")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function updateAccountEmail(newEmail: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { error: error.message };
  }

  // update in profiles table as well
  await supabase.from("profiles").update({ email: newEmail }).eq("id", user.id);

  revalidatePath("/profile");
  return { success: true, message: "Verification email sent to new address" };
}

export async function updateAccountPassword(newPassword: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}