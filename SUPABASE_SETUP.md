# Supabase Setup Guide

This guide will help you set up Supabase for the Hospital Kiosk AI application.

## 1. Create a Supabase Account

1. Go to [https://supabase.com/](https://supabase.com/)
2. Sign up for an account using GitHub, GitLab, or email

## 2. Create a New Project

1. Click "New Project"
2. Choose an organization (create one if needed)
3. Name your project (e.g., "hospital-kiosk")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create new project"

## 3. Set Up Database Tables

### Option 1: Using the SQL Editor

1. Go to the SQL Editor in the Supabase dashboard
2. Copy and paste the contents of `supabase-setup.sql` from this repository
3. Click "Run" to execute the SQL commands

### Option 2: Using the Table Editor

1. Go to "Table Editor" in the left sidebar
2. Click "New Table"
3. Set table name: `patients`
4. Add the following columns:
   - `id` (type: text, primary key)
   - `name` (type: text, not null)
   - `nric` (type: text, not null, unique)
   - `dob` (type: date)
   - `age` (type: int2)
   - `gender` (type: text)
   - `symptoms` (type: text)
   - `created_at` (type: timestamptz, default: now())
5. Click "Save"
6. Click "New Table" again
7. Set table name: `vitals`
8. Add the following columns:
   - `id` (type: uuid, primary key, default: uuid_generate_v4())
   - `patient_id` (type: text, not null, foreign key to patients.id)
   - `temperature` (type: numeric)
   - `heart_rate` (type: int2)
   - `blood_pressure` (type: text)
   - `oxygen_level` (type: int2)
   - `created_at` (type: timestamptz, default: now())
9. Click "Save"
10. Set up the foreign key relationship:
    - Go to the `vitals` table
    - Click on the `patient_id` column
    - Under "Foreign Keys", click "Add Foreign Key"
    - Set "Referenced Table" to `patients`
    - Set "Referenced Column" to `id`
    - Click "Save"

## 4. Get Your API Credentials

1. Go to "Project Settings" (gear icon) in the left sidebar
2. Click on "API" in the submenu
3. Copy your "Project URL" (this is your `REACT_APP_SUPABASE_URL`)
4. Copy your "anon" key (this is your `REACT_APP_SUPABASE_ANON_KEY`)

## 5. Update Your .env File

1. Open your `.env` file in the root of the project
2. Add or update the following lines:
   ```
   REACT_APP_SUPABASE_URL=your_copied_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_copied_anon_key
   ```

## 6. Restart Your Application

1. Stop your frontend server if it's running
2. Run `npm start` to restart with the new environment variables

## Troubleshooting

If you encounter issues with Supabase integration:

1. Check that your Supabase URL and anon key are correctly set in the `.env` file
2. Make sure the tables are created with the correct column names and types
3. Check the browser console for any error messages
4. Verify that your Supabase project is active and running