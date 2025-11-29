"use client";

import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Image from "next/image";

const PetSchema = z.object({
  name: z.string().min(1, { message: "Pet name is required" }),
  species: z.enum(["Dog", "Cat", "Bird", "Others"]),
  breed: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  ageValue: z
    .string()
    .min(1, { message: "Age is required" })
    .regex(/^\d+$/, { message: "Age must be a number" }),
  ageUnit: z.enum(["months", "years"]),
  color: z.string().optional(),
  notes: z.string().optional(),

  weightValue: z
    .string()
    .min(1, { message: "Weight is required" })
    .regex(/^\d+(?:\.\d+)?$/, { message: "Weight must be a number" }),
  weightUnit: z.enum(["kg", "lb"]),
});

export type PetFormValues = z.infer<typeof PetSchema>;

interface PetRegisterFormProps {
  registerAction: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function PetRegisterForm({ registerAction }: PetRegisterFormProps) {
  const [values, setValues] = useState({
    name: "",
    species: "Dog",
    breed: "",
    gender: "Male",
    ageValue: "",
    ageUnit: "years",
    color: "",
    weightValue: "",
    weightUnit: "kg",
    notes: "",

    picture: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleChange<K extends keyof typeof values>(
    key: K,
    v: (typeof values)[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate with Zod
    const result = PetSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();

      // Append all fields
      formData.append("name", values.name);
      formData.append("species", values.species);
      if (values.breed) formData.append("breed", values.breed);
      formData.append("gender", values.gender);
      formData.append("ageValue", values.ageValue);
      formData.append("ageUnit", values.ageUnit);
      if (values.color) formData.append("color", values.color);
      formData.append("weightValue", values.weightValue);
      formData.append("weightUnit", values.weightUnit);
      if (values.picture) formData.append("picture", values.picture);

      const result = await registerAction(formData);

      if (result?.error) {
        setErrors({ submit: result.error });
      }
      // If no error, the server action will redirect
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Failed to register pet",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Register New Pet</CardTitle>
        <CardDescription>
          Fill out the details below to add a new pet to the system.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General error message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Pet Name */}
          <div className="space-y-1">
            <Label>Pet Name</Label>
            <Input
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Bella"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Species + Sex */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Species</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={values.species}
                onChange={(e) => handleChange("species", e.target.value as any)}
              >
                <option>Dog</option>
                <option>Cat</option>
                <option>Bird</option>
                <option>Others</option>
              </select>
              {errors.species && (
                <p className="text-sm text-red-600">{errors.species}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Gender</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={values.gender}
                onChange={(e) => handleChange("gender", e.target.value as any)}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
              {errors.gender && (
                <p className="text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
          </div>

          {/* Breed + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Breed</Label>
              <Input
                value={values.breed}
                onChange={(e) => handleChange("breed", e.target.value)}
                placeholder="e.g., Golden Retriever"
              />
            </div>

            <div className="space-y-1">
              <Label>Color / Markings</Label>
              <Input
                value={values.color}
                onChange={(e) => handleChange("color", e.target.value)}
                placeholder="e.g., Brown with white patch"
              />
            </div>
          </div>

          {/* Age + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Age</Label>
                <Input
                  value={values.ageValue}
                  onChange={(e) => handleChange("ageValue", e.target.value)}
                  placeholder="e.g., 2"
                />
                {errors.ageValue && (
                  <p className="text-sm text-red-600">{errors.ageValue}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Unit</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={values.ageUnit}
                  onChange={(e) =>
                    handleChange("ageUnit", e.target.value as any)
                  }
                >
                  <option value="months">months</option>
                  <option value="years">years</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Weight</Label>
                <Input
                  value={values.weightValue}
                  onChange={(e) => handleChange("weightValue", e.target.value)}
                  placeholder="e.g., 5.5"
                />
                {errors.weightValue && (
                  <p className="text-sm text-red-600">{errors.weightValue}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Unit</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={values.weightUnit}
                  onChange={(e) =>
                    handleChange("weightUnit", e.target.value as any)
                  }
                >
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes:</Label>
            <textarea
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={values.notes}
              onChange={(e) => handleChange("notes", e.target.value as any)}
            ></textarea>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Pet Photo</Label>

            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleChange("picture", file);
                  setPreviewUrl(file ? URL.createObjectURL(file) : null);
                }}
              />

              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="preview"
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-md object-cover border"
                />
              )}
            </div>

            {previewUrl && (
              <Button
                variant="destructive"
                size="sm"
                type="button"
                className="mt-2"
                onClick={() => {
                  handleChange("picture", null);
                  setPreviewUrl(null);
                }}
              >
                Remove Photo
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Pet"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValues({
                  name: "",
                  species: "Dog",
                  breed: "",
                  gender: "Male",
                  ageValue: "",
                  ageUnit: "years",
                  color: "",
                  weightValue: "",
                  weightUnit: "kg",
                  notes: "",
                  picture: null,
                });
                setPreviewUrl(null);
                setErrors({});
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
