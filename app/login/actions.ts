"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = (formData.get("role") as string) || "patient";
  const specialty = (formData.get("specialty") as string) || "General Medicine";
  const nextUrl = (formData.get("next") as string) || null;

  // check if current user is anonymous (upgrading account)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isUpgrade = currentUser?.is_anonymous === true

  if (isUpgrade) {
    // convert anonymous user to registered user
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: {
        full_name: fullName,
        role: role,
      }
    })

    if (error) {
      return { error: error.message }
    }

    // update profile to mark as converted
    await supabase
      .from('profiles')
      .update({
        is_anonymous: false,
        full_name: fullName,
        email: email,
        role: role,
        converted_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)

    // migrate any pre-consult data
    await supabase
      .from('guest_pre_consults')
      .update({ is_migrated: true })
      .eq('user_id', currentUser.id)
      .eq('is_migrated', false)

    // if upgrading to doctor, create doctor profile
    if (role === 'doctor' && data.user) {
      const { error: doctorError } = await supabase.from('doctors').insert({
        user_id: data.user.id,
        name: `Dr. ${fullName}`,
        specialty: specialty,
        bio: `${specialty} specialist dedicated to providing quality healthcare.`,
        is_available: true,
      })

      if (doctorError) {
        console.error('Failed to create doctor profile:', doctorError)
      }
    }

    revalidatePath('/', 'layout')
    redirect(nextUrl || '/dashboard')
  }

  // regular signup for new users
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
        specialty,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(nextUrl || "/dashboard");
}

export async function signInAnonymously(captchaToken?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInAnonymously({
    options: captchaToken ? { captchaToken } : undefined,
  })

  if (error) {
    return { error: error.message }
  }

  // create an anonymous session record
  if (data.user) {
    await supabase.from('anonymous_sessions').insert({
      user_id: data.user.id,
      browsing_data: {},
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// helper to check if user is anonymous
export async function getAuthStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAuthenticated: false, isAnonymous: false, user: null }
  }

  return {
    isAuthenticated: true,
    isAnonymous: user.is_anonymous ?? false,
    user
  }
}
