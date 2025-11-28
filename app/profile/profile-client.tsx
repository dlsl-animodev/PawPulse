"use client";

import React, { useState, useTransition } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  User,
  Heart,
  AlertTriangle,
  Settings,
  Plus,
  Trash2,
  Save,
  Activity,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  PatientDetails,
  PatientAllergy,
  PatientCondition,
  PatientSurgery,
  upsertPatientDetails,
  addPatientAllergy,
  deletePatientAllergy,
  addPatientCondition,
  deletePatientCondition,
  addPatientSurgery,
  deletePatientSurgery,
  updateAccountEmail,
  updateAccountPassword,
} from "./actions";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  phone: string | null;
};

interface ProfileClientProps {
  user: SupabaseUser;
  profile: Profile | null;
  initialDetails: PatientDetails | null;
  initialAllergies: PatientAllergy[];
  initialConditions: PatientCondition[];
  initialSurgeries: PatientSurgery[];
}

type TabId = "personal" | "medical" | "allergies" | "account";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal Info", icon: <User className="h-4 w-4" /> },
  { id: "medical", label: "Medical History", icon: <Heart className="h-4 w-4" /> },
  { id: "allergies", label: "Allergies", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "account", label: "Account", icon: <Settings className="h-4 w-4" /> },
];

export default function ProfileClient({
  user,
  profile,
  initialDetails,
  initialAllergies,
  initialConditions,
  initialSurgeries,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isPending, startTransition] = useTransition();

  // personal info state
  const [details, setDetails] = useState<Partial<PatientDetails>>({
    first_name: initialDetails?.first_name || "",
    middle_name: initialDetails?.middle_name || "",
    last_name: initialDetails?.last_name || "",
    date_of_birth: initialDetails?.date_of_birth || "",
    gender: initialDetails?.gender || "",
    blood_type: initialDetails?.blood_type || "",
    height_cm: initialDetails?.height_cm || null,
    weight_kg: initialDetails?.weight_kg || null,
    address_line1: initialDetails?.address_line1 || "",
    address_line2: initialDetails?.address_line2 || "",
    city: initialDetails?.city || "",
    state: initialDetails?.state || "",
    postal_code: initialDetails?.postal_code || "",
    country: initialDetails?.country || "Philippines",
    emergency_contact_name: initialDetails?.emergency_contact_name || "",
    emergency_contact_phone: initialDetails?.emergency_contact_phone || "",
    emergency_contact_relationship: initialDetails?.emergency_contact_relationship || "",
  });

  // medical history state
  const [conditions, setConditions] = useState<PatientCondition[]>(initialConditions);
  const [surgeries, setSurgeries] = useState<PatientSurgery[]>(initialSurgeries);
  const [newCondition, setNewCondition] = useState<{
    condition_name: string;
    condition_type: PatientCondition["condition_type"];
    current_status: PatientCondition["current_status"];
    notes: string;
  }>({
    condition_name: "",
    condition_type: "chronic",
    current_status: "active",
    notes: "",
  });
  const [newSurgery, setNewSurgery] = useState<{
    procedure_name: string;
    surgery_type: PatientSurgery["surgery_type"];
    surgery_date: string;
    hospital_name: string;
    outcome: PatientSurgery["outcome"];
  }>({
    procedure_name: "",
    surgery_type: "therapeutic",
    surgery_date: "",
    hospital_name: "",
    outcome: "successful",
  });

  // allergies state
  const [allergies, setAllergies] = useState<PatientAllergy[]>(initialAllergies);
  const [newAllergy, setNewAllergy] = useState<{
    allergy_type: PatientAllergy["allergy_type"];
    allergen: string;
    severity: PatientAllergy["severity"];
    reaction_description: string;
  }>({
    allergy_type: "drug",
    allergen: "",
    severity: "moderate",
    reaction_description: "",
  });

  // account state
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSavePersonalInfo = () => {
    startTransition(async () => {
      const result = await upsertPatientDetails(details);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Personal information saved");
      }
    });
  };

  const handleAddCondition = () => {
    if (!newCondition.condition_name.trim()) {
      toast.error("Please enter a condition name");
      return;
    }
    startTransition(async () => {
      const result = await addPatientCondition({
        condition_name: newCondition.condition_name,
        condition_type: newCondition.condition_type,
        current_status: newCondition.current_status,
        notes: newCondition.notes || null,
        diagnosis_date: null,
        diagnosed_by: null,
        treatment_notes: null,
        medications: null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Condition added");
        setNewCondition({
          condition_name: "",
          condition_type: "chronic",
          current_status: "active",
          notes: "",
        });
        // refresh will happen via revalidatePath
      }
    });
  };

  const handleDeleteCondition = (id: string) => {
    startTransition(async () => {
      const result = await deletePatientCondition(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Condition removed");
        setConditions((prev) => prev.filter((c) => c.id !== id));
      }
    });
  };

  const handleAddSurgery = () => {
    if (!newSurgery.procedure_name.trim()) {
      toast.error("Please enter a procedure name");
      return;
    }
    startTransition(async () => {
      const result = await addPatientSurgery({
        procedure_name: newSurgery.procedure_name,
        surgery_type: newSurgery.surgery_type,
        surgery_date: newSurgery.surgery_date || null,
        hospital_name: newSurgery.hospital_name || null,
        outcome: newSurgery.outcome,
        surgeon_name: null,
        reason: null,
        complications: null,
        follow_up_required: false,
        notes: null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Surgery added");
        setNewSurgery({
          procedure_name: "",
          surgery_type: "therapeutic",
          surgery_date: "",
          hospital_name: "",
          outcome: "successful",
        });
      }
    });
  };

  const handleDeleteSurgery = (id: string) => {
    startTransition(async () => {
      const result = await deletePatientSurgery(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Surgery removed");
        setSurgeries((prev) => prev.filter((s) => s.id !== id));
      }
    });
  };

  const handleAddAllergy = () => {
    if (!newAllergy.allergen.trim()) {
      toast.error("Please enter an allergen");
      return;
    }
    startTransition(async () => {
      const result = await addPatientAllergy({
        allergy_type: newAllergy.allergy_type,
        allergen: newAllergy.allergen,
        severity: newAllergy.severity,
        reaction_description: newAllergy.reaction_description || null,
        diagnosed_date: null,
        notes: null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Allergy added");
        setNewAllergy({
          allergy_type: "drug",
          allergen: "",
          severity: "moderate",
          reaction_description: "",
        });
      }
    });
  };

  const handleDeleteAllergy = (id: string) => {
    startTransition(async () => {
      const result = await deletePatientAllergy(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Allergy removed");
        setAllergies((prev) => prev.filter((a) => a.id !== id));
      }
    });
  };

  const handleUpdateEmail = () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }
    startTransition(async () => {
      const result = await updateAccountEmail(newEmail);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Email updated");
        setNewEmail("");
      }
    });
  };

  const handleUpdatePassword = () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const result = await updateAccountPassword(newPassword);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password updated");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* tabs navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:cursor-pointer ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div className="rounded-3xl border border-blue-100 bg-white/70 backdrop-blur-sm p-6 md:p-8 shadow-sm">
        {activeTab === "personal" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                <p className="text-sm text-slate-500">
                  Basic details and emergency contacts
                </p>
              </div>
            </div>

            {/* name fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={details.first_name || ""}
                  onChange={(e) => setDetails({ ...details, first_name: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={details.middle_name || ""}
                  onChange={(e) => setDetails({ ...details, middle_name: e.target.value })}
                  placeholder="Santos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={details.last_name || ""}
                  onChange={(e) => setDetails({ ...details, last_name: e.target.value })}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            {/* dob, gender, blood type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={details.date_of_birth || ""}
                  onChange={(e) => setDetails({ ...details, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={details.gender || ""}
                  onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <select
                  id="bloodType"
                  value={details.blood_type || ""}
                  onChange={(e) => setDetails({ ...details, blood_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* height & weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={details.height_cm || ""}
                  onChange={(e) =>
                    setDetails({ ...details, height_cm: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="170"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={details.weight_kg || ""}
                  onChange={(e) =>
                    setDetails({ ...details, weight_kg: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="70"
                />
              </div>
            </div>

            {/* address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={details.address_line1 || ""}
                    onChange={(e) => setDetails({ ...details, address_line1: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={details.address_line2 || ""}
                    onChange={(e) => setDetails({ ...details, address_line2: e.target.value })}
                    placeholder="Apartment, suite, unit, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={details.city || ""}
                    onChange={(e) => setDetails({ ...details, city: e.target.value })}
                    placeholder="Manila"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={details.state || ""}
                    onChange={(e) => setDetails({ ...details, state: e.target.value })}
                    placeholder="Metro Manila"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={details.postal_code || ""}
                    onChange={(e) => setDetails({ ...details, postal_code: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={details.country || ""}
                    onChange={(e) => setDetails({ ...details, country: e.target.value })}
                    placeholder="Philippines"
                  />
                </div>
              </div>
            </div>

            {/* emergency contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={details.emergency_contact_name || ""}
                    onChange={(e) => setDetails({ ...details, emergency_contact_name: e.target.value })}
                    placeholder="Maria Dela Cruz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={details.emergency_contact_phone || ""}
                    onChange={(e) => setDetails({ ...details, emergency_contact_phone: e.target.value })}
                    placeholder="+63 917 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relationship</Label>
                  <Input
                    id="emergencyRelation"
                    value={details.emergency_contact_relationship || ""}
                    onChange={(e) =>
                      setDetails({ ...details, emergency_contact_relationship: e.target.value })
                    }
                    placeholder="Spouse, Parent, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSavePersonalInfo}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {activeTab === "medical" && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-red-600 text-white flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Medical History</h2>
                <p className="text-sm text-slate-500">
                  Conditions and surgical history
                </p>
              </div>
            </div>

            {/* conditions section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Medical Conditions
              </h3>

              {/* existing conditions */}
              {conditions.length > 0 && (
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{condition.condition_name}</p>
                        <p className="text-sm text-slate-500">
                          {condition.condition_type} &bull; {condition.current_status}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCondition(condition.id!)}
                        disabled={isPending}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* add new condition */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-4">
                <p className="text-sm font-medium text-slate-700">Add a condition</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    value={newCondition.condition_name}
                    onChange={(e) => setNewCondition({ ...newCondition, condition_name: e.target.value })}
                    placeholder="Condition name"
                  />
                  <select
                    value={newCondition.condition_type}
                    onChange={(e) =>
                      setNewCondition({
                        ...newCondition,
                        condition_type: e.target.value as PatientCondition["condition_type"],
                      })
                    }
                    className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="chronic">Chronic</option>
                    <option value="acute">Acute</option>
                    <option value="resolved">Resolved</option>
                    <option value="hereditary">Hereditary</option>
                  </select>
                  <select
                    value={newCondition.current_status}
                    onChange={(e) =>
                      setNewCondition({
                        ...newCondition,
                        current_status: e.target.value as PatientCondition["current_status"],
                      })
                    }
                    className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="managed">Managed</option>
                    <option value="resolved">Resolved</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <Button
                  onClick={handleAddCondition}
                  disabled={isPending}
                  variant="outline"
                  className="hover:cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            </div>

            {/* surgeries section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                Surgical History
              </h3>

              {/* existing surgeries */}
              {surgeries.length > 0 && (
                <div className="space-y-2">
                  {surgeries.map((surgery) => (
                    <div
                      key={surgery.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{surgery.procedure_name}</p>
                        <p className="text-sm text-slate-500">
                          {surgery.surgery_type}
                          {surgery.surgery_date && ` &bull; ${surgery.surgery_date}`}
                          {surgery.hospital_name && ` &bull; ${surgery.hospital_name}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSurgery(surgery.id!)}
                        disabled={isPending}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* add new surgery */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-4">
                <p className="text-sm font-medium text-slate-700">Add a surgery</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={newSurgery.procedure_name}
                    onChange={(e) => setNewSurgery({ ...newSurgery, procedure_name: e.target.value })}
                    placeholder="Procedure name"
                  />
                  <select
                    value={newSurgery.surgery_type}
                    onChange={(e) =>
                      setNewSurgery({
                        ...newSurgery,
                        surgery_type: e.target.value as PatientSurgery["surgery_type"],
                      })
                    }
                    className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="therapeutic">Therapeutic</option>
                    <option value="elective">Elective</option>
                    <option value="emergency">Emergency</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="cosmetic">Cosmetic</option>
                  </select>
                  <Input
                    type="date"
                    value={newSurgery.surgery_date}
                    onChange={(e) => setNewSurgery({ ...newSurgery, surgery_date: e.target.value })}
                    placeholder="Surgery date"
                  />
                  <Input
                    value={newSurgery.hospital_name}
                    onChange={(e) => setNewSurgery({ ...newSurgery, hospital_name: e.target.value })}
                    placeholder="Hospital name"
                  />
                </div>
                <Button
                  onClick={handleAddSurgery}
                  disabled={isPending}
                  variant="outline"
                  className="hover:cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Surgery
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "allergies" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Allergies</h2>
                <p className="text-sm text-slate-500">
                  Drug, food, and environmental allergies
                </p>
              </div>
            </div>

            {/* existing allergies */}
            {allergies.length > 0 && (
              <div className="space-y-2">
                {allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          allergy.severity === "life_threatening"
                            ? "bg-red-100 text-red-700"
                            : allergy.severity === "severe"
                            ? "bg-orange-100 text-orange-700"
                            : allergy.severity === "moderate"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {allergy.severity.replace("_", " ")}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{allergy.allergen}</p>
                        <p className="text-sm text-slate-500 capitalize">{allergy.allergy_type} allergy</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAllergy(allergy.id!)}
                      disabled={isPending}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {allergies.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No allergies recorded</p>
                <p className="text-sm">Add any known allergies below</p>
              </div>
            )}

            {/* add new allergy */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-4">
              <p className="text-sm font-medium text-slate-700">Add an allergy</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={newAllergy.allergen}
                  onChange={(e) => setNewAllergy({ ...newAllergy, allergen: e.target.value })}
                  placeholder="Allergen (e.g., Penicillin, Peanuts)"
                />
                <select
                  value={newAllergy.allergy_type}
                  onChange={(e) =>
                    setNewAllergy({
                      ...newAllergy,
                      allergy_type: e.target.value as PatientAllergy["allergy_type"],
                    })
                  }
                  className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="drug">Drug</option>
                  <option value="food">Food</option>
                  <option value="environmental">Environmental</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={newAllergy.severity}
                  onChange={(e) =>
                    setNewAllergy({
                      ...newAllergy,
                      severity: e.target.value as PatientAllergy["severity"],
                    })
                  }
                  className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life_threatening">Life Threatening</option>
                </select>
                <Textarea
                  value={newAllergy.reaction_description}
                  onChange={(e) =>
                    setNewAllergy({ ...newAllergy, reaction_description: e.target.value })
                  }
                  placeholder="Describe the reaction (optional)"
                  rows={2}
                />
              </div>
              <Button
                onClick={handleAddAllergy}
                disabled={isPending}
                variant="outline"
                className="hover:cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Allergy
              </Button>
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Account Settings</h2>
                <p className="text-sm text-slate-500">
                  Manage your email and password
                </p>
              </div>
            </div>

            {/* current account info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Current email</p>
              <p className="font-medium text-slate-900">{user.email || profile?.email || "Not set"}</p>
            </div>

            {/* update email */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Change Email</h3>
              <div className="flex gap-4">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="flex-1"
                />
                <Button
                  onClick={handleUpdateEmail}
                  disabled={isPending || !newEmail.trim()}
                  className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
                >
                  Update Email
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                A verification email will be sent to confirm the change.
              </p>
            </div>

            {/* update password */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={isPending || !newPassword || !confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
              >
                Update Password
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}