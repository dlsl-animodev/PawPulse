-- CareLink Database Schema (Fresh Start)
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (links to auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('patient', 'doctor')) default 'patient',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- ============================================
-- 2. DOCTORS TABLE
-- ============================================
create table public.doctors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  specialty text not null,
  bio text,
  image_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.doctors enable row level security;

create policy "Doctors are viewable by everyone." on public.doctors for select using (true);
create policy "Users can create their own doctor profile." on public.doctors for insert with check (auth.uid() = user_id);
create policy "Doctors can update their own profile." on public.doctors for update using (auth.uid() = user_id);

-- ============================================
-- 3. APPOINTMENTS TABLE
-- ============================================
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  date timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appointments enable row level security;

create policy "Patients can view their own appointments." on public.appointments for select using (auth.uid() = patient_id);
create policy "Doctors can view their appointments." on public.appointments for select using (
  exists (select 1 from public.doctors where doctors.id = appointments.doctor_id and doctors.user_id = auth.uid())
);
create policy "Patients can insert their own appointments." on public.appointments for insert with check (auth.uid() = patient_id);
create policy "Patients can update their own appointments." on public.appointments for update using (auth.uid() = patient_id);
create policy "Doctors can update their appointments." on public.appointments for update using (
  exists (select 1 from public.doctors where doctors.id = appointments.doctor_id and doctors.user_id = auth.uid())
);

-- ============================================
-- 4. PRESCRIPTIONS TABLE
-- ============================================
create table public.prescriptions (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete set null,
  medication_name text not null,
  dosage text not null,
  instructions text,
  refills_remaining integer default 0,
  status text check (status in ('active', 'completed', 'expired')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prescriptions enable row level security;

create policy "Patients can view their own prescriptions." on public.prescriptions for select using (auth.uid() = patient_id);
create policy "Doctors can view prescriptions they created." on public.prescriptions for select using (
  exists (select 1 from public.doctors where doctors.id = prescriptions.doctor_id and doctors.user_id = auth.uid())
);
create policy "Doctors can insert prescriptions." on public.prescriptions for insert with check (
  exists (select 1 from public.doctors where doctors.user_id = auth.uid())
);

-- ============================================
-- 5. MEDICATION ORDERS TABLE
-- ============================================
create table public.medication_orders (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  prescription_id uuid references public.prescriptions(id) on delete set null,
  medication_name text not null,
  quantity integer default 1,
  status text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) default 'pending',
  ordered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.medication_orders enable row level security;

create policy "Patients can view their own orders." on public.medication_orders for select using (auth.uid() = patient_id);
create policy "Patients can create orders." on public.medication_orders for insert with check (auth.uid() = patient_id);

-- ============================================
-- 6. REMINDERS TABLE
-- ============================================
create table public.reminders (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('appointment', 'medication', 'refill', 'follow_up')) not null,
  title text not null,
  remind_at timestamp with time zone not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reminders enable row level security;

create policy "Patients can manage their own reminders." on public.reminders for all using (auth.uid() = patient_id);

-- ============================================
-- 7. CHAT ROOMS & MESSAGING
-- ============================================
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'open', 'closed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_rooms enable row level security;

create unique index chat_rooms_appointment_unique on public.chat_rooms(appointment_id);

create policy "Participants can view chat rooms." on public.chat_rooms for select using (
  patient_id = auth.uid() or exists (
    select 1 from public.doctors d where d.id = chat_rooms.doctor_id and d.user_id = auth.uid()
  )
);

create policy "Participants can insert chat rooms." on public.chat_rooms for insert with check (
  patient_id = auth.uid() or exists (
    select 1 from public.doctors d where d.id = chat_rooms.doctor_id and d.user_id = auth.uid()
  )
);

create policy "Participants can update chat rooms." on public.chat_rooms for update using (
  patient_id = auth.uid() or exists (
    select 1 from public.doctors d where d.id = chat_rooms.doctor_id and d.user_id = auth.uid()
  )
) with check (
  patient_id = auth.uid() or exists (
    select 1 from public.doctors d where d.id = chat_rooms.doctor_id and d.user_id = auth.uid()
  )
);

create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_messages enable row level security;

create policy "Participants can view chat messages." on public.chat_messages for select using (
  exists (
    select 1
    from public.chat_rooms cr
    left join public.doctors d on d.id = cr.doctor_id
    where cr.id = chat_messages.room_id
      and (
        cr.patient_id = auth.uid()
        or d.user_id = auth.uid()
      )
  )
);

create policy "Participants can insert chat messages." on public.chat_messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1
    from public.chat_rooms cr
    left join public.doctors d on d.id = cr.doctor_id
    where cr.id = chat_messages.room_id
      and (
        cr.patient_id = auth.uid()
        or d.user_id = auth.uid()
      )
  )
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_doctor on public.appointments(doctor_id);
create index idx_appointments_date on public.appointments(date);
create index idx_prescriptions_patient on public.prescriptions(patient_id);
create index idx_orders_patient on public.medication_orders(patient_id);
create index idx_reminders_patient on public.reminders(patient_id);
create index idx_chat_messages_room on public.chat_messages(room_id);
create index idx_chat_messages_sender on public.chat_messages(sender_id);

-- ============================================
-- 9. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role text := coalesce(new.raw_user_meta_data->>'role', 'patient');
  new_name text := coalesce(new.raw_user_meta_data->>'full_name', 'Guest User');
  new_specialty text := coalesce(new.raw_user_meta_data->>'specialty', 'General Medicine');
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new_name,
    new_role
  );

  if new_role = 'doctor' then
    insert into public.doctors (user_id, name, specialty, bio, is_available)
    values (
      new.id,
      new_name,
      new_specialty,
      concat(new_specialty, ' specialist ready to see patients.'),
      true
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 9. GUEST PRE-CONSULTATION CAPTURE
-- ============================================
create table public.guest_pre_consults (
  id uuid default gen_random_uuid() primary key,
  session_token text not null,
  doctor_id uuid references public.doctors(id) on delete set null,
  symptoms text not null,
  goal text,
  urgency text check (urgency in ('low', 'normal', 'urgent')) default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '1 day') not null,
  is_migrated boolean default false
);

alter table public.guest_pre_consults enable row level security;

create policy "Guests can insert their own pre-consults" on public.guest_pre_consults
  for insert
  with check (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );

create policy "Guests can view their own pre-consults" on public.guest_pre_consults
  for select
  using (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );

create policy "Guests can update their own pre-consults" on public.guest_pre_consults
  for update
  using (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );

-- ============================================
-- PATIENT PROFILE TABLES (Progressive Profile)
-- ============================================

-- patient details: 1:1 with profiles, stores core personal/medical info
create table public.patient_details (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  first_name text,
  middle_name text,
  last_name text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_type text check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'Philippines',
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  profile_completion_percent integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patient_details enable row level security;

create policy "Users can view their own patient details." on public.patient_details
  for select using (auth.uid() = profile_id);
create policy "Users can insert their own patient details." on public.patient_details
  for insert with check (auth.uid() = profile_id);
create policy "Users can update their own patient details." on public.patient_details
  for update using (auth.uid() = profile_id);
create policy "Doctors can view patient details for their appointments." on public.patient_details
  for select using (
    exists (
      select 1 from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.patient_id = patient_details.profile_id
        and d.user_id = auth.uid()
    )
  );

-- patient allergies: 1:many with profiles
create table public.patient_allergies (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  allergy_type text check (allergy_type in ('drug', 'food', 'environmental', 'other')) not null,
  allergen text not null,
  severity text check (severity in ('mild', 'moderate', 'severe', 'life_threatening')) default 'moderate',
  reaction_description text,
  diagnosed_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patient_allergies enable row level security;

create policy "Users can view their own allergies." on public.patient_allergies
  for select using (auth.uid() = profile_id);
create policy "Users can insert their own allergies." on public.patient_allergies
  for insert with check (auth.uid() = profile_id);
create policy "Users can update their own allergies." on public.patient_allergies
  for update using (auth.uid() = profile_id);
create policy "Users can delete their own allergies." on public.patient_allergies
  for delete using (auth.uid() = profile_id);
create policy "Doctors can view patient allergies for their appointments." on public.patient_allergies
  for select using (
    exists (
      select 1 from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.patient_id = patient_allergies.profile_id
        and d.user_id = auth.uid()
    )
  );

-- patient conditions: 1:many with profiles (chronic/ongoing conditions)
create table public.patient_conditions (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  condition_name text not null,
  condition_type text check (condition_type in ('chronic', 'acute', 'resolved', 'hereditary')) default 'chronic',
  diagnosis_date date,
  diagnosed_by text,
  current_status text check (current_status in ('active', 'managed', 'resolved', 'monitoring')) default 'active',
  treatment_notes text,
  medications text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patient_conditions enable row level security;

create policy "Users can view their own conditions." on public.patient_conditions
  for select using (auth.uid() = profile_id);
create policy "Users can insert their own conditions." on public.patient_conditions
  for insert with check (auth.uid() = profile_id);
create policy "Users can update their own conditions." on public.patient_conditions
  for update using (auth.uid() = profile_id);
create policy "Users can delete their own conditions." on public.patient_conditions
  for delete using (auth.uid() = profile_id);
create policy "Doctors can view patient conditions for their appointments." on public.patient_conditions
  for select using (
    exists (
      select 1 from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.patient_id = patient_conditions.profile_id
        and d.user_id = auth.uid()
    )
  );

-- patient surgeries: 1:many with profiles (surgical history)
create table public.patient_surgeries (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  procedure_name text not null,
  surgery_type text check (surgery_type in ('elective', 'emergency', 'cosmetic', 'diagnostic', 'therapeutic')) default 'therapeutic',
  surgery_date date,
  hospital_name text,
  surgeon_name text,
  reason text,
  outcome text check (outcome in ('successful', 'complications', 'ongoing_recovery', 'unknown')) default 'successful',
  complications text,
  follow_up_required boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patient_surgeries enable row level security;

create policy "Users can view their own surgeries." on public.patient_surgeries
  for select using (auth.uid() = profile_id);
create policy "Users can insert their own surgeries." on public.patient_surgeries
  for insert with check (auth.uid() = profile_id);
create policy "Users can update their own surgeries." on public.patient_surgeries
  for update using (auth.uid() = profile_id);
create policy "Users can delete their own surgeries." on public.patient_surgeries
  for delete using (auth.uid() = profile_id);
create policy "Doctors can view patient surgeries for their appointments." on public.patient_surgeries
  for select using (
    exists (
      select 1 from public.appointments a
      join public.doctors d on d.id = a.doctor_id
      where a.patient_id = patient_surgeries.profile_id
        and d.user_id = auth.uid()
    )
  );

-- indexes for patient profile tables
create index idx_patient_details_profile on public.patient_details(profile_id);
create index idx_patient_allergies_profile on public.patient_allergies(profile_id);
create index idx_patient_conditions_profile on public.patient_conditions(profile_id);
create index idx_patient_surgeries_profile on public.patient_surgeries(profile_id);

-- function to calculate profile completion percentage
create or replace function public.calculate_profile_completion(p_profile_id uuid)
returns integer as $$
declare
  total_fields integer := 10;
  filled_fields integer := 0;
  details record;
begin
  select * into details from public.patient_details where profile_id = p_profile_id;

  if details is null then
    return 0;
  end if;

  if details.first_name is not null and details.first_name <> '' then filled_fields := filled_fields + 1; end if;
  if details.last_name is not null and details.last_name <> '' then filled_fields := filled_fields + 1; end if;
  if details.date_of_birth is not null then filled_fields := filled_fields + 1; end if;
  if details.gender is not null then filled_fields := filled_fields + 1; end if;
  if details.blood_type is not null and details.blood_type <> 'unknown' then filled_fields := filled_fields + 1; end if;
  if details.height_cm is not null then filled_fields := filled_fields + 1; end if;
  if details.weight_kg is not null then filled_fields := filled_fields + 1; end if;
  if details.address_line1 is not null and details.address_line1 <> '' then filled_fields := filled_fields + 1; end if;
  if details.emergency_contact_name is not null and details.emergency_contact_name <> '' then filled_fields := filled_fields + 1; end if;
  if details.emergency_contact_phone is not null and details.emergency_contact_phone <> '' then filled_fields := filled_fields + 1; end if;

  return (filled_fields * 100) / total_fields;
end;
$$ language plpgsql security definer;

-- trigger to auto-update profile completion percentage
create or replace function public.update_profile_completion()
returns trigger as $$
begin
  new.profile_completion_percent := public.calculate_profile_completion(new.profile_id);
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_patient_details_change
  before insert or update on public.patient_details
  for each row execute procedure public.update_profile_completion();
