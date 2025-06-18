// src/services/supabaseClient.js
// Mock implementation that doesn't require actual Supabase credentials

// Mock data
const mockPatients = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 34,
    gender: 'Female',
    nric: 'S1234567D',
    phone: '+65 9123 4567',
    department: 'General Medicine',
    appointment_time: '10:30 AM',
    medical_history: ['Hypertension', 'Type 2 Diabetes'],
    current_medications: ['Metformin', 'Lisinopril'],
    chief_complaint: 'Persistent headache for 3 days',
    ai_summary: 'Patient reports tension headache symptoms possibly related to stress and poor sleep. Blood pressure slightly elevated.'
  },
  {
    id: '2',
    name: 'Michael Tan',
    age: 45,
    gender: 'Male',
    nric: 'S7654321C',
    phone: '+65 8765 4321',
    department: 'Cardiology',
    appointment_time: '11:15 AM',
    medical_history: ['Coronary Artery Disease', 'Hyperlipidemia'],
    current_medications: ['Atorvastatin', 'Aspirin'],
    chief_complaint: 'Chest discomfort during exercise',
    ai_summary: 'Patient describes angina-like symptoms during moderate exertion. Recommend ECG and stress test.'
  }
];

const mockQueue = [
  {
    id: '1',
    patient_id: '1',
    status: 'waiting',
    priority: 'normal',
    order: 0,
    estimatedWait: 15
  },
  {
    id: '2',
    patient_id: '2',
    status: 'waiting',
    priority: 'urgent',
    order: 1,
    estimatedWait: 5
  }
];

const mockVitals = [
  {
    id: '1',
    patient_id: '1',
    heart_rate: 78,
    temperature: 36.8,
    bp_systolic: 135,
    bp_diastolic: 85,
    oxygen_saturation: 98
  },
  {
    id: '2',
    patient_id: '2',
    heart_rate: 82,
    temperature: 37.1,
    bp_systolic: 145,
    bp_diastolic: 90,
    oxygen_saturation: 97
  }
];

// Mock Supabase client
export const supabase = {
  from: (table) => {
    let data = [];
    
    switch (table) {
      case 'patients':
        data = [...mockPatients];
        break;
      case 'queue':
        data = [...mockQueue];
        break;
      case 'vitals':
        data = [...mockVitals];
        break;
      default:
        data = [];
    }
    
    return {
      select: (columns) => ({
        order: (column, { ascending }) => ({
          data,
          error: null
        }),
        eq: (column, value) => ({
          data: data.filter(item => item[column] === value),
          error: null
        }),
        in: (column, values) => ({
          data: data.filter(item => values.includes(item[column])),
          error: null
        }),
        select: () => ({
          data: data,
          error: null
        })
      }),
      update: (updates) => ({
        eq: (column, value) => ({
          select: () => {
            const updatedData = data.map(item => {
              if (item[column] === value) {
                return { ...item, ...updates };
              }
              return item;
            });
            return {
              data: updatedData.filter(item => item[column] === value),
              error: null,
              status: 200,
              statusText: 'OK'
            };
          },
          data: data.map(item => {
            if (item[column] === value) {
              return { ...item, ...updates };
            }
            return item;
          }),
          error: null
        })
      })
    };
  }
};

export default supabase;