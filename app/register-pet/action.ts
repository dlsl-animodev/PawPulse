'use server";';
import { createClient } from "@/utils/supabase/server";

export async function registerPet(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const species = formData.get("species") as string;
  const breed = formData.get("breed") as string;
  const gender = formData.get("gender") as string;
  const ageValue = Number(formData.get("ageValue"));
  const color = formData.get("color") as string;
  const weightValue = Number(formData.get("weightValue"));
  const picture = formData.get("picture") as File | null;
  const notes = formData.get("notes") as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pictureUrl: string | null = null;

  // Upload picture if provided
  if (picture) {
    const fileExt = picture.name.split(".").pop();
    const filePath = `pets/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("pet-pictures")
      .upload(filePath, picture);

    if (uploadError) {
      throw new Error("Failed to upload picture: " + uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("pet-pictures")
      .getPublicUrl(filePath);

    pictureUrl = publicUrlData.publicUrl;
  }

  // Insert pet data
  const { data, error } = await supabase
    .from("pets")
    .insert({
      name,
      species,
      breed,
      gender,
      age: ageValue,
      color,
      weight_kg: weightValue,
      profile_image_url: pictureUrl,
      notes,
      owner_id: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to register pet: " + error.message);
  }

  return data;
}
