import { PetRegisterForm } from "@/components/pet-register-form";
import { registerPet } from "./action";
import Link from "next/link";

export default function RegisterPetPage() {
  // Wrap the server action
  async function handleRegisterPet(formData: FormData) {
    "use server";
    return await registerPet(formData);
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-4 inline-block"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold mb-4">Register Your Pet</h1>
        <p className="text-sm text-gray-600 mb-6">
          Register your pet to manage appointments and medical records.
        </p>
        <PetRegisterForm registerAction={handleRegisterPet} />
      </div>
    </div>
  );
}
