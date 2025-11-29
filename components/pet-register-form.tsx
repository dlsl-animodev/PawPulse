"use client";

import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PetSchema = z.object({
  name: z.string().min(1, { message: "Pet name is required" }),
  species: z.enum(["Dog", "Cat", "Bird", "Others"]),
  breed: z.string().optional(),
  sex: z.enum(["Male", "Female"]),
  ageValue: z
    .string()
    .regex(/^\d+$/, { message: "Age must be a number" })
    .transform((s) => Number(s)),
  ageUnit: z.enum(["months", "years"]),
  color: z.string().optional(),
});

export type PetFormValues = z.infer<typeof PetSchema>;

interface PetRegisterFormProps {
  onSubmit?: (values: PetFormValues) => void;
}

export function PetRegisterForm({ onSubmit }: PetRegisterFormProps) {
  const [values, setValues] = useState({
    name: "",
    species: "Dog",
    breed: "",
    sex: "Male",
    ageValue: "",
    ageUnit: "years",
    color: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange<K extends keyof typeof values>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const parse = PetSchema.safeParse(values);
    if (!parse.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parse.error.issues) {
        if (issue.path && issue.path[0]) {
          fieldErrors[String(issue.path[0])] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // Pass validated and transformed values
    const validated = parse.data;
    if (onSubmit) await onSubmit(validated);

    // keep the UI simple: clear name/breed/color/age
    setValues((v) => ({ ...v, name: "", breed: "", color: "", ageValue: "" }));
    setIsSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Pet</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pet Name</Label>
            <Input
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="e.g., Bella"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label>Species</Label>
            <div className="mt-1">
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2"
                value={values.species}
                onChange={(e) => handleChange("species", e.target.value)}
              >
                <option>Dog</option>
                <option>Cat</option>
                <option>Bird</option>
                <option>Others</option>
              </select>
            </div>
            {errors.species && (
              <p className="text-sm text-red-600 mt-1">{errors.species}</p>
            )}
          </div>

          <div>
            <Label>Breed</Label>
            <Input
              value={values.breed}
              onChange={(e) => handleChange("breed", e.target.value)}
              placeholder="e.g., Golden Retriever"
            />
            {errors.breed && (
              <p className="text-sm text-red-600 mt-1">{errors.breed}</p>
            )}
          </div>

          <div>
            <Label>Sex</Label>
            <div className="mt-1">
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2"
                value={values.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            {errors.sex && (
              <p className="text-sm text-red-600 mt-1">{errors.sex}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Age</Label>
              <Input
                value={values.ageValue}
                onChange={(e) => handleChange("ageValue", e.target.value)}
                placeholder="e.g., 2"
              />
              {errors.ageValue && (
                <p className="text-sm text-red-600 mt-1">{errors.ageValue}</p>
              )}
            </div>
            <div>
              <Label>Unit</Label>
              <div className="mt-1">
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2"
                  value={values.ageUnit}
                  onChange={(e) => handleChange("ageUnit", e.target.value)}
                >
                  <option value="months">months</option>
                  <option value="years">years</option>
                </select>
              </div>
              {errors.ageUnit && (
                <p className="text-sm text-red-600 mt-1">{errors.ageUnit}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Color / Markings</Label>
            <Input
              value={values.color}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="e.g., Brown with white patch"
            />
            {errors.color && (
              <p className="text-sm text-red-600 mt-1">{errors.color}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register Pet"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setValues({
                  name: "",
                  species: "Dog",
                  breed: "",
                  sex: "Male",
                  ageValue: "",
                  ageUnit: "years",
                  color: "",
                })
              }
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
