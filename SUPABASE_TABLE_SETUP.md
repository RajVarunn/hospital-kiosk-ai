# Supabase Table Setup Guide

This guide will help you set up the necessary tables in your Supabase project for the Hospital Kiosk AI application.

## Option 1: Using the SQL Editor in Supabase

1. Log in to your Supabase dashboard
2. Select your project
3. Go to the SQL Editor (left sidebar)
4. Create a new query
5. Copy and paste the contents of `create_vitals_table.sql` into the editor
6. Click "Run" to execute the SQL commands

## Option 2: Using the Table Editor in Supabase

### Create the patients table:

1. Go to "Table Editor" in the left sidebar
2. Click "New Table"
3. Set table name: `patients`
4. Add the following columns:
   - `id` (type: text, primary key)
   - `name` (type: text, not null)
   - `nric` (type: text, not null, unique)
   - `dob` (type: date)
   - `age` (type: int4)
   - `symptoms` (type: text)
   - `created_at` (type: timestamptz, default: now())
5. Click "Save"

### Create the vitals table:

1. Click "New Table"
2. Set table name: `vitals`
3. Add the following columns:
   - `id` (type: uuid, primary key, default: uuid_generate_v4())
   - `patient_id` (type: text, not null)
   - `temperature` (type: numeric, default: 36.5)
   - `heart_rate` (type: int4)
   - `blood_pressure` (type: text)
   - `oxygen_level` (type: int4, default: 98)
   - `created_at` (type: timestamptz, default: now())
4. Click "Save"

### Set up the foreign key relationship:

1. Go to the `vitals` table
2. Click on the `patient_id` column
3. Under "Foreign Keys", click "Add Foreign Key"
4. Set "Referenced Table" to `patients`
5. Set "Referenced Column" to `id`
6. Click "Save"

## Troubleshooting

If you're still having issues with saving vitals data:

1. Check the browser console for specific error messages
2. Verify that the column names in your Supabase table match exactly what the code is trying to save
3. Make sure the foreign key constraint is set up correctly
4. Check that the data types match (e.g., heart_rate should be an integer)
5. Ensure your Supabase project has the correct permissions set up (RLS policies)