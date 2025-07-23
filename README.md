# Hospital Kiosk AI with AKOOL Talking Avatar

This project implements a hospital kiosk system with an AI-powered talking avatar using AKOOL's technology.

## AKOOL Integration

The project has been updated to use AKOOL's talking avatar technology instead of Ready Player Me. The key changes include:

1. Created a new `AkoolAvatarViewer` component that displays video-based avatars
2. Updated the `PatientForm` component to use AKOOL for speech synthesis
3. Implemented backend proxy for AKOOL API calls

## Setup

1. Make sure you have the required API keys in your `.env` file:

```
AKOOL_CLIENT_ID=your_akool_api_key
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Install dependencies:

```
npm install
```

3. Start the backend server:

```
cd backend
npm start
```

4. Start the frontend:

```
cd frontend
npm start
```

## How It Works

1. The system uses AKOOL's API to generate talking avatar videos
2. The backend proxies requests to AKOOL to keep API keys secure
3. The frontend displays the videos in the `AkoolAvatarViewer` component

## Key Components

- `AkoolAvatarViewer.jsx`: Displays the AKOOL avatar videos
- `PatientForm.jsx`: Handles patient registration with AKOOL avatar integration
- `VitalsCollection.jsx`: Collects and stores patient vitals
- `akool.js` (frontend service): Provides functions to interact with AKOOL
- `akool.js` (backend route): Proxies requests to AKOOL API
- `supabaseService.js`: Handles database operations with Supabase

## Supabase Integration

The application uses Supabase as the primary database for storing patient information and vitals:

1. Patient registration data is stored in the `patients` table
2. Vitals collection data is stored in the `vitals` table
3. Each vitals record is linked to a patient via the `patient_id` field

To set up the Supabase database:

1. Create a new project in Supabase
2. Create the following tables:
   - `patients` table with fields: id, name, nric, dob, age, gender, symptoms, created_at
   - `vitals` table with fields: id, patient_id, temperature, heart_rate, blood_pressure, oxygen_level, created_at
3. Add your Supabase URL and anon key to the `.env` file