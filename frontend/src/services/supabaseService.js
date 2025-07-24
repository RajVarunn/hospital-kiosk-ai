import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Hardcoded values for development - REPLACE WITH YOUR ACTUAL VALUES
const supabaseUrl = 'https://szdqpddrjjfhtsfgapdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZHFwZGRyampmaHRzZmdhcGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODUzMTIsImV4cCI6MjA2ODg2MTMxMn0.z6hj25tmUyfjT_tyeoBIlUn1dLMh0ARo3rOzwkMuosc';

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key available:', supabaseKey ? 'Yes' : 'No');

// Create client with the hardcoded values
let supabase;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
} else {
  console.error('Supabase URL or key is missing or using default values');
}

// Test function to check if Supabase is working
const testSupabaseConnection = async () => {
  if (!supabase) {
    console.error('Cannot test connection: Supabase client not initialized');
    return false;
  }
  
  try {
    const { data, error } = await supabase.from('patients').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful:', data);
    return true;
  } catch (err) {
    console.error('Supabase connection test exception:', err);
    return false;
  }
};

// Function to check if tables exist
const checkTablesExist = async () => {
  if (!supabase) {
    console.error('Cannot check tables: Supabase client not initialized');
    return;
  }
  
  try {
    // Check if patients table exists
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
      
    if (patientsError) {
      console.error('Error checking patients table:', patientsError);
      console.log('Patients table may not exist');
    } else {
      console.log('Patients table exists');
    }
    
    // Check if vitals table exists
    const { data: vitalsData, error: vitalsError } = await supabase
      .from('vitals')
      .select('id')
      .limit(1);
      
    if (vitalsError) {
      console.error('Error checking vitals table:', vitalsError);
      console.log('Vitals table may not exist');
    } else {
      console.log('Vitals table exists');
    }
  } catch (err) {
    console.error('Error checking tables:', err);
  }
};

// Run the tests
testSupabaseConnection();
checkTablesExist();

const supabaseService = {
  // Save patient data to Supabase
  savePatient: async (patientData) => {
    try {
      // Check if Supabase is initialized
      if (!supabase) {
        console.warn('Supabase not initialized, skipping savePatient');
        return null;
      }
      
      // Format the date correctly for PostgreSQL (YYYY-MM-DD)
      let formattedDob = null;
      if (patientData.dob) {
        try {
          // Handle date in DD-MM-YYYY format
          if (patientData.dob.includes('-')) {
            const [day, month, year] = patientData.dob.split('-');
            formattedDob = `${year}-${month}-${day}`;
          } else {
            // Just pass it through if it's already in the right format
            formattedDob = patientData.dob;
          }
          console.log('Formatted DOB:', formattedDob);
        } catch (dateErr) {
          console.error('Error formatting date:', dateErr);
          // If date formatting fails, don't include DOB
          formattedDob = null;
        }
      }
      
      const { data, error } = await supabase
        .from('patients')
        .upsert({
          id: patientData.nric,
          name: patientData.name,
          nric: patientData.nric,
          dob: formattedDob,
          age: patientData.age,
          symptoms: patientData.symptoms,
          created_at: new Date().toISOString()
        }, { onConflict: 'nric' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving patient to Supabase:', error);
      return null; // Don't throw error to prevent app from crashing
    }
  },

  // Save vitals data to Supabase
  saveVitals: async (patientId, vitalsData) => {
    try {
      console.log('Attempting to save vitals to Supabase:', { patientId, vitalsData });
      
      // Check if Supabase is initialized
      if (!supabase) {
        console.warn('Supabase not initialized, skipping saveVitals');
        return null;
      }
      
      // Use a default ID if none provided
      const safePatientId = patientId || 'unknown-patient';
      
      // First, ensure the patient exists in the patients table
      try {
        // Check if patient already exists
        const { data: existingPatient, error: fetchError } = await supabase
          .from('patients')
          .select('id')
          .eq('id', safePatientId)
          .maybeSingle();
          
        if (fetchError) {
          console.error('Error checking if patient exists:', fetchError);
        }
        
        // Only create if patient doesn't exist
        if (!existingPatient) {
          console.log('Patient does not exist, creating new record');
          const { data: patientData, error: patientError } = await supabase
            .from('patients')
            .upsert({
              id: safePatientId,
              name: 'Unknown Patient',
              nric: safePatientId,
              created_at: new Date().toISOString()
            }, { onConflict: 'id' });
            
          if (patientError) {
            console.error('Error creating patient record:', patientError);
          } else {
            console.log('Patient record created successfully');
          }
        } else {
          console.log('Patient already exists, skipping creation');
        }
      } catch (patientErr) {
        console.error('Failed to create patient record:', patientErr);
      }
      
      // Format blood pressure from systolic and diastolic if available
      let blood_pressure = vitalsData.blood_pressure || vitalsData.blood_pressure || '120/80';
      if (vitalsData.systolic && vitalsData.diastolic) {
        blood_pressure = `${vitalsData.systolic}/${vitalsData.diastolic}`;
        console.log('Combined BP from systolic/diastolic in saveVitals:', blood_pressure);
      }
      
      // Debug log to show all available vitals data
      console.log('Full vitals data received:', {
        systolic: vitalsData.systolic,
        diastolic: vitalsData.diastolic,
        heartRate: vitalsData.heartRate,
        blood_pressure: vitalsData.blood_pressure,
        combined: blood_pressure
      });
      
      // Format the vitals data for insertion
      const vitalsRecord = {
        patient_id: safePatientId,
        heart_rate: vitalsData.heartRate || vitalsData.heart_rate || 70,
        blood_pressure: blood_pressure,
        created_at: new Date().toISOString()
      };
      
      console.log('Inserting vitals record:', vitalsRecord);
      
      // Use a single method to insert vitals
      console.log('Inserting vitals with a single method');
      try {
        const { data, error } = await supabase
          .from('vitals')
          .insert(vitalsRecord);
          
        if (error) {
          console.error('Error inserting vitals:', error);
          throw error;
        }
        
        console.log('Vitals inserted successfully:', data);
        return data;
      } catch (insertError) {
        console.error('Failed to insert vitals:', insertError);
        throw insertError;
      }

      // This code is unreachable due to the try/catch structure above
      // Removing it to fix the undefined variables error
    } catch (error) {
      console.error('Exception saving vitals to Supabase:', error);
      return null; // Don't throw error to prevent app from crashing
    }
  },

  // Get patient by NRIC
  getPatientByNric: async (nric) => {
    try {
      // Check if Supabase is initialized
      if (!supabase) {
        console.warn('Supabase not initialized, skipping getPatientByNric');
        return null;
      }
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('nric', nric)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching patient from Supabase:', error);
      return null; // Don't throw error to prevent app from crashing
    }
  },

  // Get all patients with their vitals
  getAllPatientsWithVitals: async () => {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, skipping getAllPatientsWithVitals');
        return [];
      }
      
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          vitals (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patients with vitals:', error);
      return [];
    }
  },

  // Get vitals by patient ID
  getVitalsByPatientId: async (patientId) => {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, skipping getVitalsByPatientId');
        return [];
      }
      
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vitals:', error);
      return [];
    }
  },

  // Save pre-diagnosis to patient record
  savePreDiagnosis: async (patientId, preDiagnosis) => {
    try {
      if (!supabase) {
        console.warn('Supabase not initialized, skipping savePreDiagnosis');
        return null;
      }
      
      const { data, error } = await supabase
        .from('patients')
        .update({ 
          ai_pre_diagnosis: preDiagnosis,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving pre-diagnosis:', error);
      return null;
    }
  },


};

// No longer needed - using a single method in saveVitals

// Function to create tables if they don't exist
supabaseService.createTables = async () => {
  if (!supabase) return null;
  
  try {
    console.log('Attempting to create tables...');
    
    // Create patients table
    const { error: patientsError } = await supabase.rpc('create_patients_table', {});
    if (patientsError) {
      console.error('Error creating patients table:', patientsError);
      
      // Try direct SQL approach
      const { error: sqlError } = await supabase.from('patients').insert({
        id: 'test-patient',
        name: 'Test Patient',
        nric: 'TEST12345',
        created_at: new Date().toISOString()
      }).select();
      
      if (sqlError && sqlError.code === '42P01') {
        console.error('Patients table does not exist and cannot be created via API');
        alert('Please create the tables manually using the SQL script');
      }
    } else {
      console.log('Patients table created or already exists');
    }
    
    return true;
  } catch (err) {
    console.error('Error creating tables:', err);
    return null;
  }
};

export default supabaseService;

// Test functions that can be called after supabaseService is defined
export const testSaveVitals = async () => {
  try {
    const testVitals = {
      heartRate: 75,
      systolic: 120,
      diastolic: 80,
      temperature: 36.5,
      oxygenLevel: 98
    };
    
    console.log('Testing vitals save');
    const result = await supabaseService.saveVitals('TEST12345', testVitals);
    console.log('Test vitals save result:', result);
    return result;
  } catch (err) {
    console.error('Error saving test vitals:', err);
    return null;
  }
};

export const testSavePatient = async () => {
  try {
    const testPatient = {
      nric: 'TEST12345',
      name: 'Test Patient',
      dob: '29-11-2002', // Test the date format conversion
      age: 21,
      symptoms: 'Test symptoms'
    };
    
    console.log('Saving test patient:', testPatient);
    const result = await supabaseService.savePatient(testPatient);
    console.log('Test patient save result:', result);
    return result;
  } catch (err) {
    console.error('Error saving test patient:', err);
    return null;
  }
};