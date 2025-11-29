-- ============================================
-- PetCare Veterinary Platform Database Schema
-- ============================================

-- ============================================
-- 1. PROFILES TABLE (Pet Owners & Veterinarians)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('pet_owner', 'veterinarian', 'admin')) default 'pet_owner',
  phone text,
  address text,
  city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- ============================================
-- 2. VET CLINICS TABLE (B2B Partners)
-- ============================================
create table public.vet_clinics (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  city text,
  contact_email text,
  contact_phone text,
  logo_url text default 'https://placehold.co/200x200/0ea5e9/white?text=VetClinic',
  description text,
  species_accepted text[] default '{}',
  operating_hours text,
  emergency_services boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vet_clinics enable row level security;

create policy "Vet clinics are viewable by everyone." on public.vet_clinics for select using (true);
create policy "Admins can manage vet clinics." on public.vet_clinics for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create index idx_vet_clinics_city on public.vet_clinics(city);

-- ============================================
-- 3. VETERINARIANS TABLE
-- ============================================
create table public.veterinarians (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  clinic_id uuid references public.vet_clinics(id) on delete set null,
  name text not null,
  specialty text not null,
  species_treated text[] default '{}',
  license_number text,
  bio text,
  image_url text,
  years_experience integer,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.veterinarians enable row level security;

create policy "Veterinarians are viewable by everyone." on public.veterinarians for select using (true);
create policy "Vets can update their own profile." on public.veterinarians for update using (auth.uid() = user_id);
create policy "Admins can manage veterinarians." on public.veterinarians for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create index idx_veterinarians_clinic on public.veterinarians(clinic_id);
create index idx_veterinarians_user on public.veterinarians(user_id);

-- ============================================
-- 4. PETS TABLE (Primary Patient Entity)
-- ============================================
create table public.pets (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  species text not null,
  breed text,
  age date,
  gender text check (gender in ('male', 'female', 'unknown')) default 'unknown',
  weight_kg numeric(6, 2),
  profile_image_url text,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pets enable row level security;

create policy "Owners can view their own pets." on public.pets for select using (auth.uid() = owner_id);
create policy "Owners can insert their own pets." on public.pets for insert with check (auth.uid() = owner_id);
create policy "Owners can update their own pets." on public.pets for update using (auth.uid() = owner_id);
create policy "Owners can delete their own pets." on public.pets for delete using (auth.uid() = owner_id);
-- note: vet policy for viewing pets is created after appointments table exists

create index idx_pets_owner on public.pets(owner_id);
create index idx_pets_species on public.pets(species);

-- ============================================
-- 5. PET WEIGHT HISTORY TABLE
-- ============================================
create table public.pet_weight_history (
  id uuid default gen_random_uuid() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  weight_kg numeric(6, 2) not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pet_weight_history enable row level security;

create policy "Owners can view their pet weight history." on public.pet_weight_history for select using (
  exists (select 1 from public.pets where pets.id = pet_weight_history.pet_id and pets.owner_id = auth.uid())
);
-- note: vet policy for weight history is created after appointments table exists

create index idx_pet_weight_history_pet on public.pet_weight_history(pet_id);

-- ============================================
-- 6. VACCINE CATALOG TABLE
-- ============================================
create table public.vaccine_catalog (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  species_for text[] not null,
  typical_interval_months integer,
  is_core_vaccine boolean default false,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vaccine_catalog enable row level security;

create policy "Vaccine catalog is viewable by everyone." on public.vaccine_catalog for select using (true);

-- ============================================
-- 7. PET VACCINATIONS TABLE
-- ============================================
create table public.pet_vaccinations (
  id uuid default gen_random_uuid() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  vaccine_id uuid references public.vaccine_catalog(id) on delete set null,
  vaccine_name text not null,
  administered_at timestamp with time zone not null,
  administered_by uuid references public.veterinarians(id) on delete set null,
  next_due_date date,
  batch_number text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pet_vaccinations enable row level security;

create policy "Owners can view their pet vaccinations." on public.pet_vaccinations for select using (
  exists (select 1 from public.pets where pets.id = pet_vaccinations.pet_id and pets.owner_id = auth.uid())
);
create policy "Vets can manage vaccinations." on public.pet_vaccinations for all using (
  exists (select 1 from public.veterinarians where user_id = auth.uid())
);

create index idx_pet_vaccinations_pet on public.pet_vaccinations(pet_id);
create index idx_pet_vaccinations_due_date on public.pet_vaccinations(next_due_date);

-- ============================================
-- 8. PET ALLERGIES TABLE
-- ============================================
create table public.pet_allergies (
  id uuid default gen_random_uuid() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  allergen text not null,
  severity text check (severity in ('mild', 'moderate', 'severe')) default 'moderate',
  reaction text,
  diagnosed_at date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pet_allergies enable row level security;

create policy "Owners can manage their pet allergies." on public.pet_allergies for all using (
  exists (select 1 from public.pets where pets.id = pet_allergies.pet_id and pets.owner_id = auth.uid())
);
create policy "Vets can view pet allergies." on public.pet_allergies for select using (
  exists (select 1 from public.veterinarians where user_id = auth.uid())
);

create index idx_pet_allergies_pet on public.pet_allergies(pet_id);

-- ============================================
-- 9. PET CONDITIONS TABLE (Medical History)
-- ============================================
create table public.pet_conditions (
  id uuid default gen_random_uuid() primary key,
  pet_id uuid references public.pets(id) on delete cascade not null,
  condition_name text not null,
  diagnosed_at date,
  status text check (status in ('active', 'managed', 'resolved')) default 'active',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pet_conditions enable row level security;

create policy "Owners can manage their pet conditions." on public.pet_conditions for all using (
  exists (select 1 from public.pets where pets.id = pet_conditions.pet_id and pets.owner_id = auth.uid())
);
create policy "Vets can view pet conditions." on public.pet_conditions for select using (
  exists (select 1 from public.veterinarians where user_id = auth.uid())
);

create index idx_pet_conditions_pet on public.pet_conditions(pet_id);

-- ============================================
-- 10. APPOINTMENTS TABLE
-- ============================================
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete set null,
  veterinarian_id uuid references public.veterinarians(id) on delete set null not null,
  scheduled_at timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) default 'pending',
  visit_type text check (visit_type in ('checkup', 'vaccination', 'surgery', 'grooming', 'emergency', 'dental', 'follow_up', 'other')) default 'checkup',
  symptoms text,
  goal text,
  vet_notes text,
  diagnosis text,
  pet_weight_at_visit numeric(6, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appointments enable row level security;

create policy "Owners can view their own appointments." on public.appointments for select using (auth.uid() = owner_id);
create policy "Owners can insert their own appointments." on public.appointments for insert with check (auth.uid() = owner_id);
create policy "Owners can update their own appointments." on public.appointments for update using (auth.uid() = owner_id);
create policy "Vets can view appointments assigned to them." on public.appointments for select using (
  exists (select 1 from public.veterinarians where veterinarians.id = appointments.veterinarian_id and veterinarians.user_id = auth.uid())
);
create policy "Vets can update appointments assigned to them." on public.appointments for update using (
  exists (select 1 from public.veterinarians where veterinarians.id = appointments.veterinarian_id and veterinarians.user_id = auth.uid())
);

create index idx_appointments_owner on public.appointments(owner_id);
create index idx_appointments_pet on public.appointments(pet_id);
create index idx_appointments_vet on public.appointments(veterinarian_id);
create index idx_appointments_scheduled on public.appointments(scheduled_at);

-- deferred policies: require appointments table to exist
create policy "Vets can view pets they have appointments with." on public.pets for select using (
  exists (
    select 1 from public.appointments a
    join public.veterinarians v on v.id = a.veterinarian_id
    where a.pet_id = pets.id and v.user_id = auth.uid()
  )
);

create policy "Vets can view/insert weight history for their patients." on public.pet_weight_history for all using (
  exists (
    select 1 from public.pets p
    join public.appointments a on a.pet_id = p.id
    join public.veterinarians v on v.id = a.veterinarian_id
    where p.id = pet_weight_history.pet_id and v.user_id = auth.uid()
  )
);

-- ============================================
-- 11. VET PHARMACIES TABLE
-- ============================================
create table public.vet_pharmacies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  city text not null,
  contact_phone text,
  logo_url text default 'https://placehold.co/200x200/22c55e/white?text=VetPharmacy',
  is_active boolean default true,
  delivery_fee numeric(10, 2) default 60.00,
  estimated_delivery_mins integer default 60,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vet_pharmacies enable row level security;

create policy "Vet pharmacies are viewable by everyone." on public.vet_pharmacies for select using (true);
create policy "Admins can manage vet pharmacies." on public.vet_pharmacies for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- 12. VET PHARMACY INVENTORY TABLE
-- ============================================
create table public.vet_pharmacy_inventory (
  id uuid default gen_random_uuid() primary key,
  pharmacy_id uuid references public.vet_pharmacies(id) on delete cascade not null,
  medication_name text not null,
  species_safe_for text[] default '{}',
  concentration text,
  unit_price numeric(10, 2) not null,
  dose_per_kg_min numeric(6, 3),
  dose_per_kg_max numeric(6, 3),
  dose_unit text,
  requires_prescription boolean default true,
  in_stock boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vet_pharmacy_inventory enable row level security;

create policy "Vet inventory is viewable by everyone." on public.vet_pharmacy_inventory for select using (true);
create policy "Admins can manage vet inventory." on public.vet_pharmacy_inventory for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create index idx_vet_pharmacy_inventory_pharmacy on public.vet_pharmacy_inventory(pharmacy_id);
create index idx_vet_pharmacy_inventory_medication on public.vet_pharmacy_inventory(medication_name);

-- ============================================
-- 13. PRESCRIPTIONS TABLE
-- ============================================
create table public.prescriptions (
  id uuid default gen_random_uuid() primary key,
  pet_id uuid references public.pets(id) on delete set null not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  veterinarian_id uuid references public.veterinarians(id) on delete set null not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  medication_name text not null,
  dosage text not null,
  calculated_dose numeric(10, 3),
  pet_weight_kg numeric(6, 2),
  frequency text,
  duration text,
  instructions text,
  refills_remaining integer default 0,
  status text check (status in ('active', 'completed', 'expired', 'cancelled')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prescriptions enable row level security;

create policy "Owners can view their pet prescriptions." on public.prescriptions for select using (auth.uid() = owner_id);
create policy "Vets can view prescriptions they created." on public.prescriptions for select using (
  exists (select 1 from public.veterinarians where veterinarians.id = prescriptions.veterinarian_id and veterinarians.user_id = auth.uid())
);
create policy "Vets can insert prescriptions." on public.prescriptions for insert with check (
  exists (select 1 from public.veterinarians where veterinarians.user_id = auth.uid())
);
create policy "Vets can update prescriptions they created." on public.prescriptions for update using (
  exists (select 1 from public.veterinarians where veterinarians.id = prescriptions.veterinarian_id and veterinarians.user_id = auth.uid())
);

create index idx_prescriptions_pet on public.prescriptions(pet_id);
create index idx_prescriptions_owner on public.prescriptions(owner_id);
create index idx_prescriptions_vet on public.prescriptions(veterinarian_id);

-- ============================================
-- 14. MEDICATION ORDERS TABLE
-- ============================================
create table public.medication_orders (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete set null,
  prescription_id uuid references public.prescriptions(id) on delete set null,
  pharmacy_id uuid references public.vet_pharmacies(id) on delete set null,
  medication_name text not null,
  quantity integer default 1,
  unit_price numeric(10, 2),
  delivery_fee numeric(10, 2) default 60.00,
  total_price numeric(10, 2),
  delivery_address text,
  delivery_notes text,
  status text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) default 'pending',
  estimated_delivery_at timestamp with time zone,
  ordered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.medication_orders enable row level security;

create policy "Owners can view their own orders." on public.medication_orders for select using (auth.uid() = owner_id);
create policy "Owners can create orders." on public.medication_orders for insert with check (auth.uid() = owner_id);
create policy "Admins can manage all orders." on public.medication_orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================
-- 15. REMINDERS TABLE
-- ============================================
create table public.reminders (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete set null,
  type text check (type in ('appointment', 'medication', 'vaccination', 'refill', 'follow_up', 'checkup')) not null,
  title text not null,
  description text,
  remind_at timestamp with time zone not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reminders enable row level security;

create policy "Owners can manage their own reminders." on public.reminders for all using (auth.uid() = owner_id);

create index idx_reminders_owner on public.reminders(owner_id);
create index idx_reminders_remind_at on public.reminders(remind_at);

-- ============================================
-- 16. CHAT ROOMS TABLE
-- ============================================
create table public.chat_rooms (
  id uuid default gen_random_uuid() primary key,
  appointment_id uuid references public.appointments(id) on delete cascade not null,
  veterinarian_id uuid references public.veterinarians(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete set null,
  status text check (status in ('pending', 'open', 'closed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_rooms enable row level security;

create unique index chat_rooms_appointment_unique on public.chat_rooms(appointment_id);

create policy "Participants can view chat rooms." on public.chat_rooms for select using (
  owner_id = auth.uid() or exists (
    select 1 from public.veterinarians v where v.id = chat_rooms.veterinarian_id and v.user_id = auth.uid()
  )
);
create policy "Participants can insert chat rooms." on public.chat_rooms for insert with check (
  owner_id = auth.uid() or exists (
    select 1 from public.veterinarians v where v.id = chat_rooms.veterinarian_id and v.user_id = auth.uid()
  )
);
create policy "Participants can update chat rooms." on public.chat_rooms for update using (
  owner_id = auth.uid() or exists (
    select 1 from public.veterinarians v where v.id = chat_rooms.veterinarian_id and v.user_id = auth.uid()
  )
);

-- ============================================
-- 17. CHAT MESSAGES TABLE
-- ============================================
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
    left join public.veterinarians v on v.id = cr.veterinarian_id
    where cr.id = chat_messages.room_id
      and (cr.owner_id = auth.uid() or v.user_id = auth.uid())
  )
);
create policy "Participants can insert chat messages." on public.chat_messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1
    from public.chat_rooms cr
    left join public.veterinarians v on v.id = cr.veterinarian_id
    where cr.id = chat_messages.room_id
      and (cr.owner_id = auth.uid() or v.user_id = auth.uid())
  )
);

create index idx_chat_messages_room on public.chat_messages(room_id);
create index idx_chat_messages_sender on public.chat_messages(sender_id);

-- ============================================
-- 18. GUEST PRE-CONSULTATION TABLE
-- ============================================
create table public.guest_pre_consults (
  id uuid default gen_random_uuid() primary key,
  session_token text not null,
  veterinarian_id uuid references public.veterinarians(id) on delete set null,
  pet_name text,
  pet_species text,
  pet_breed text,
  pet_age text,
  pet_weight_kg numeric(6, 2),
  symptoms text not null,
  goal text,
  urgency text check (urgency in ('low', 'normal', 'urgent')) default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '1 day') not null,
  is_migrated boolean default false
);

alter table public.guest_pre_consults enable row level security;

create policy "Guests can insert their own pre-consults" on public.guest_pre_consults
  for insert with check (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );
create policy "Guests can view their own pre-consults" on public.guest_pre_consults
  for select using (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );
create policy "Guests can update their own pre-consults" on public.guest_pre_consults
  for update using (
    session_token = coalesce(current_setting('request.headers', true)::json->>'x-guest-token', '')
    and session_token <> ''
  );

-- ============================================
-- 19. TRIGGERS & FUNCTIONS
-- ============================================

-- auto-log weight changes to history
create or replace function public.log_pet_weight_change()
returns trigger as $$
begin
  if old.weight_kg is distinct from new.weight_kg and new.weight_kg is not null then
    insert into public.pet_weight_history (pet_id, weight_kg, recorded_by)
    values (new.id, new.weight_kg, auth.uid());
  end if;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_pet_update
  before update on public.pets
  for each row execute procedure public.log_pet_weight_change();

-- auto-create vaccination reminders
create or replace function public.create_vaccination_reminder()
returns trigger as $$
declare
  pet_record record;
  reminder_date timestamp with time zone;
begin
  if new.next_due_date is not null then
    select p.*, pr.id as profile_owner_id
    into pet_record
    from public.pets p
    join public.profiles pr on pr.id = p.owner_id
    where p.id = new.pet_id;

    reminder_date := new.next_due_date::timestamp with time zone - interval '7 days';

    insert into public.reminders (owner_id, pet_id, type, title, description, remind_at)
    values (
      pet_record.owner_id,
      new.pet_id,
      'vaccination',
      new.vaccine_name || ' vaccination due for ' || pet_record.name,
      'Your pet ' || pet_record.name || ' is due for ' || new.vaccine_name || ' vaccination on ' || to_char(new.next_due_date, 'Month DD, YYYY'),
      reminder_date
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_vaccination_insert
  after insert on public.pet_vaccinations
  for each row execute procedure public.create_vaccination_reminder();

-- migrate guest pre-consult to registered user
create or replace function public.migrate_guest_to_user(p_guest_token text, p_user_id uuid)
returns void as $$
declare
  guest_data record;
  new_pet_id uuid;
begin
  for guest_data in
    select * from public.guest_pre_consults
    where session_token = p_guest_token and is_migrated = false
  loop
    if guest_data.pet_name is not null then
      insert into public.pets (owner_id, name, species, breed, weight_kg)
      values (
        p_user_id,
        guest_data.pet_name,
        coalesce(guest_data.pet_species, 'unknown'),
        guest_data.pet_breed,
        guest_data.pet_weight_kg
      )
      returning id into new_pet_id;
    end if;

    update public.guest_pre_consults
    set is_migrated = true
    where id = guest_data.id;
  end loop;
end;
$$ language plpgsql security definer;

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_role text := coalesce(new.raw_user_meta_data->>'role', 'pet_owner');
  new_name text := coalesce(new.raw_user_meta_data->>'full_name', 'Pet Owner');
  new_specialty text := coalesce(new.raw_user_meta_data->>'specialty', 'General Practice');
  guest_token text := coalesce(new.raw_user_meta_data->>'guest_token', '');
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new_name,
    new_role
  );

  if new_role = 'veterinarian' then
    insert into public.veterinarians (user_id, name, specialty, bio, is_available)
    values (
      new.id,
      new_name,
      new_specialty,
      'Veterinarian specializing in ' || new_specialty || '.',
      true
    );
  end if;

  if guest_token <> '' then
    perform public.migrate_guest_to_user(guest_token, new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 20. SEED DATA - VET CLINICS (Philippine)
-- ============================================
insert into public.vet_clinics (id, name, address, city, contact_email, contact_phone, logo_url, description, species_accepted, emergency_services) values
  ('c1111111-1111-1111-1111-111111111111', 'BGC Animal Hospital', '32nd St, Bonifacio Global City', 'Taguig', 'info@bgcanimalhospital.com', '+63 2 8555 1234', 'https://placehold.co/200x200/0ea5e9/white?text=BGC+Animal', 'Full-service veterinary hospital offering comprehensive care for dogs, cats, and exotic pets in BGC.', ARRAY['dog', 'cat', 'bird', 'rabbit', 'reptile', 'exotic'], true),
  ('c2222222-2222-2222-2222-222222222222', 'Vets in Practice', 'Jupiter St, Makati City', 'Makati', 'hello@vetsinpractice.ph', '+63 2 8888 5678', 'https://placehold.co/200x200/0ea5e9/white?text=VIP', 'Modern veterinary clinic providing quality pet healthcare with a personal touch since 2005.', ARRAY['dog', 'cat', 'bird', 'rabbit'], false),
  ('c3333333-3333-3333-3333-333333333333', 'Animal House Veterinary Clinic', 'Katipunan Ave, Quezon City', 'Quezon City', 'care@animalhouse.ph', '+63 2 8777 9012', 'https://placehold.co/200x200/0ea5e9/white?text=Animal+House', 'Trusted veterinary care for all pets, specializing in surgery and internal medicine.', ARRAY['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea pig'], true),
  ('c4444444-4444-4444-4444-444444444444', 'Pet Central Veterinary Hospital', 'Ortigas Center, Pasig City', 'Pasig', 'info@petcentral.ph', '+63 2 8633 4567', 'https://placehold.co/200x200/0ea5e9/white?text=Pet+Central', 'State-of-the-art veterinary hospital with 24/7 emergency services and specialist consultations.', ARRAY['dog', 'cat', 'bird', 'rabbit', 'reptile', 'fish', 'exotic'], true);

-- ============================================
-- 21. SEED DATA - VET PHARMACIES
-- ============================================
insert into public.vet_pharmacies (id, name, address, city, contact_phone, logo_url, delivery_fee, estimated_delivery_mins) values
  ('a1111111-1111-1111-1111-111111111111', 'Pet Express Pharmacy', 'Multiple Branches Metro Manila', 'Metro Manila', '+63 2 8911 7777', 'https://placehold.co/200x200/22c55e/white?text=Pet+Express', 60.00, 45),
  ('a2222222-2222-2222-2222-222222222222', 'VetMart Pharmacy', 'SM Megamall Pet Section, Mandaluyong', 'Mandaluyong', '+63 2 8631 8888', 'https://placehold.co/200x200/22c55e/white?text=VetMart', 75.00, 60),
  ('a3333333-3333-3333-3333-333333333333', 'PetCare Pharmacy', 'Eastwood City, Quezon City', 'Quezon City', '+63 2 8893 9999', 'https://placehold.co/200x200/22c55e/white?text=PetCare', 55.00, 50);

-- ============================================
-- 22. SEED DATA - VACCINE CATALOG
-- ============================================
insert into public.vaccine_catalog (id, name, species_for, typical_interval_months, is_core_vaccine, description) values
  ('b1111111-1111-1111-1111-111111111111', 'Rabies', ARRAY['dog', 'cat'], 12, true, 'Core vaccine required by law. Protects against rabies virus.'),
  ('b2222222-2222-2222-2222-222222222222', 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', ARRAY['dog'], 12, true, 'Core combination vaccine protecting against four major canine diseases.'),
  ('b3333333-3333-3333-3333-333333333333', 'Bordetella (Kennel Cough)', ARRAY['dog'], 6, false, 'Recommended for dogs in contact with other dogs. Protects against kennel cough.'),
  ('b4444444-4444-4444-4444-444444444444', 'Leptospirosis', ARRAY['dog'], 12, false, 'Recommended for dogs exposed to wildlife or contaminated water.'),
  ('b5555555-5555-5555-5555-555555555555', 'Canine Influenza', ARRAY['dog'], 12, false, 'Protects against dog flu strains H3N2 and H3N8.'),
  ('b6666666-6666-6666-6666-666666666666', 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', ARRAY['cat'], 12, true, 'Core combination vaccine for cats protecting against respiratory and digestive diseases.'),
  ('b7777777-7777-7777-7777-777777777777', 'FeLV (Feline Leukemia Virus)', ARRAY['cat'], 12, false, 'Recommended for outdoor cats. Protects against feline leukemia.'),
  ('b8888888-8888-8888-8888-888888888888', 'FIV (Feline Immunodeficiency Virus)', ARRAY['cat'], 12, false, 'Recommended for outdoor cats at risk of fighting.'),
  ('b9999999-9999-9999-9999-999999999999', 'RHDV (Rabbit Hemorrhagic Disease)', ARRAY['rabbit'], 12, true, 'Core vaccine protecting rabbits against hemorrhagic disease.'),
  ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Myxomatosis', ARRAY['rabbit'], 6, true, 'Core vaccine for rabbits in areas where myxomatosis is present.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Polyomavirus', ARRAY['bird'], 12, false, 'Recommended for young birds and breeding birds.'),
  ('bccccccc-cccc-cccc-cccc-cccccccccccc', 'Pacheco''s Disease', ARRAY['bird'], 12, false, 'Recommended for birds in multi-bird households or aviaries.');

-- ============================================
-- 23. SEED DATA - VET PHARMACY INVENTORY (Weight-Based Medications)
-- ============================================
insert into public.vet_pharmacy_inventory (pharmacy_id, medication_name, species_safe_for, concentration, unit_price, dose_per_kg_min, dose_per_kg_max, dose_unit, requires_prescription, in_stock) values
  ('a1111111-1111-1111-1111-111111111111', 'Carprofen (Rimadyl)', ARRAY['dog'], '25mg tablet', 45.00, 2.0, 4.0, 'mg/kg twice daily', true, true),
  ('a1111111-1111-1111-1111-111111111111', 'Apoquel (Oclacitinib)', ARRAY['dog'], '5.4mg tablet', 120.00, 0.4, 0.6, 'mg/kg twice daily', true, true),
  ('a1111111-1111-1111-1111-111111111111', 'Heartgard Plus', ARRAY['dog'], 'Chewable', 350.00, null, null, '1 chew monthly', true, true),
  ('a1111111-1111-1111-1111-111111111111', 'Frontline Plus', ARRAY['dog', 'cat'], 'Topical', 450.00, null, null, '1 application monthly', false, true),
  ('a1111111-1111-1111-1111-111111111111', 'NexGard', ARRAY['dog'], 'Chewable', 550.00, null, null, '1 chew monthly', true, true),
  ('a1111111-1111-1111-1111-111111111111', 'Amoxicillin', ARRAY['dog', 'cat', 'bird', 'rabbit'], '250mg capsule', 15.00, 10.0, 25.0, 'mg/kg twice daily', true, true),
  ('a1111111-1111-1111-1111-111111111111', 'Metronidazole', ARRAY['dog', 'cat', 'bird'], '250mg tablet', 12.00, 10.0, 15.0, 'mg/kg twice daily', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Carprofen (Rimadyl)', ARRAY['dog'], '75mg tablet', 85.00, 2.0, 4.0, 'mg/kg twice daily', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Meloxicam', ARRAY['dog', 'cat'], '1.5mg/ml oral suspension', 280.00, 0.1, 0.2, 'mg/kg once daily', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Prednisolone', ARRAY['dog', 'cat', 'bird', 'rabbit'], '5mg tablet', 8.00, 0.5, 2.0, 'mg/kg once daily', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Revolution Plus', ARRAY['cat'], 'Topical', 650.00, null, null, '1 application monthly', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Bravecto', ARRAY['dog', 'cat'], 'Chewable/Topical', 1200.00, null, null, '1 dose every 12 weeks', true, true),
  ('a2222222-2222-2222-2222-222222222222', 'Cephalexin', ARRAY['dog', 'cat'], '500mg capsule', 18.00, 15.0, 30.0, 'mg/kg twice daily', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Gabapentin', ARRAY['dog', 'cat'], '100mg capsule', 25.00, 5.0, 10.0, 'mg/kg twice daily', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Tramadol', ARRAY['dog'], '50mg tablet', 20.00, 2.0, 5.0, 'mg/kg twice daily', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Cerenia (Maropitant)', ARRAY['dog', 'cat'], '16mg tablet', 180.00, 2.0, 2.0, 'mg/kg once daily', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Simparica', ARRAY['dog'], 'Chewable', 480.00, null, null, '1 chew monthly', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Advantage Multi', ARRAY['dog', 'cat'], 'Topical', 520.00, null, null, '1 application monthly', true, true),
  ('a3333333-3333-3333-3333-333333333333', 'Enrofloxacin (Baytril)', ARRAY['dog', 'cat', 'bird', 'reptile'], '50mg tablet', 35.00, 5.0, 20.0, 'mg/kg once daily', true, true);

-- ============================================
-- 24. SEED DATA - SAMPLE VETERINARIANS
-- ============================================
insert into public.veterinarians (id, clinic_id, name, specialty, species_treated, license_number, bio, image_url, years_experience, is_available) values
  ('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Dr. Maria Santos', 'General Practice', ARRAY['dog', 'cat', 'bird', 'rabbit'], 'PH-VET-2015-0234', 'Passionate veterinarian with 9 years of experience in companion animal medicine. Special interest in preventive care and nutrition.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Santos', 9, true),
  ('d2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Dr. Juan dela Cruz', 'Surgery', ARRAY['dog', 'cat'], 'PH-VET-2010-0156', 'Board-certified veterinary surgeon specializing in orthopedic and soft tissue surgery. Over 14 years of surgical experience.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Cruz', 14, true),
  ('d3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'Dr. Ana Reyes', 'Dermatology', ARRAY['dog', 'cat'], 'PH-VET-2018-0489', 'Veterinary dermatologist focusing on allergies, skin conditions, and ear diseases in dogs and cats.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Reyes', 6, true),
  ('d4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 'Dr. Paolo Garcia', 'Exotic Animals', ARRAY['bird', 'rabbit', 'reptile', 'hamster', 'guinea pig', 'exotic'], 'PH-VET-2012-0312', 'Exotic animal specialist with extensive experience in avian, reptile, and small mammal medicine.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Garcia', 12, true),
  ('d5555555-5555-5555-5555-555555555555', 'c4444444-4444-4444-4444-444444444444', 'Dr. Lisa Tan', 'Internal Medicine', ARRAY['dog', 'cat'], 'PH-VET-2016-0378', 'Internal medicine specialist diagnosing and treating complex medical conditions including endocrine, kidney, and liver diseases.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Tan', 8, true),
  ('d6666666-6666-6666-6666-666666666666', 'c4444444-4444-4444-4444-444444444444', 'Dr. Michael Lim', 'Emergency & Critical Care', ARRAY['dog', 'cat', 'bird', 'rabbit'], 'PH-VET-2014-0267', 'Emergency veterinarian available for critical cases. Experienced in trauma, toxicology, and intensive care.', 'https://placehold.co/200x200/3b82f6/white?text=Dr.+Lim', 10, true);
