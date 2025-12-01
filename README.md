# PawPulse - Expert Care for Best Friends
PawPulse is a full-stack web application that helps pet owners access veterinary support from home. The app was developed during the (C)old (ST)art Hackathon 2025 organized by Old St. Labs on November 9, 2025. 

**Achievement**
* 1st Runner Up 
* People's Choice Award

---

## Hackathon Theme
The organizers provided the theme ahead of the competition. The assigned theme was:

>"A reliable, trustworthy, secure, efficient, and user-friendly digital medical services app that helps customers access healthcare from home. Users should be able to book online consultations with licensed professionals, order prescribed medicine for delivery, add reminders for follow-up checkups or prescription refills, and store important medical history or prescriptions in one place"

However on the day of the hackathon, the organizers revealed the surprise twist that we need to incorporate into our application:

>"The entire app is actually for pets, not humans"

---

## Key Features
Users can register under three roles: 
1. Pet Owner
2. Veterinarian
3. Pharmacist

**Pet owners can:**
* Book online vet consultations
* Receive prescriptions from veterinarians
* Order prescribed pet medicine for delivery
* Store and view pet medical records
* Get AI traige for quick veterinary consultation
* Receive reminders for checkups and medication refills

**Veterinarians can:**
* Prescribe medicine for pets
* Manage consultations queue
* Add consultation notes
* Set reminders for pet owners
* Review pet consultation history

**Pharmacists can:**
* Add, edit, delete prescription in inventory
* Manage prescription orders and delivery
* Set order and delivery status for tracking

---

## Teck Stack
* Next.js 
* TailwindCSS 
* Supabase 
* Gemini Live
* Cloudflare Turnstile
* Vercel

---

## 🛠️ Running the Project Locally

Follow the steps below to set up and run PawPulse on your local environment.

### 1. Clone the Repository
```
git clone https://github.com/dlsl-animodev/PawPulse.git
cd PawPulse
```

### 2. Install Dependencies
```
npm install
```

### 3. Set Up Environment Variables
Create a ```.env.local``` file in the root directory and add:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
GEMINI_API_KEY=
```

### 4. Run the Development Server
```
npm run dev
```
The app should now be live at: ```http://localhost:3000```

---

## Help Us Build What's Next
This is only the beginning. PawPulse is open to improvements, ideas, and contributions from anyone passionate about advancing veterinary healthcare. Help us take this project further and create a better, smarter future for pets everywhere!

