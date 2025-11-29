export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: "Dog" | "Cat" | "Bird" | "Other";
  gender: string;
  breed: string;
  color: string;
  weight_kg: number;
  notes: string;
  profile_image_url: string;
  age: number;
  nextCheckup?: string;
  is_active: boolean;
}
