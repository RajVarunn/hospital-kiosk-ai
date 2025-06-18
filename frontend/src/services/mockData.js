/**
 * Mock data for development when API is not available
 */

export const mockPatients = [
  {
    user_id: "p1",
    name: "John Smith",
    nric: "S1234567A",
    dob: "1980-05-15",
    age: 43,
    gender: "Male",
    preferred_language: "English",
    medical_history: ["Hypertension", "Type 2 Diabetes"]
  },
  {
    user_id: "p2",
    name: "Mary Johnson",
    nric: "S7654321B",
    dob: "1992-08-23",
    age: 31,
    gender: "Female",
    preferred_language: "English",
    medical_history: ["Asthma"]
  },
  {
    user_id: "p3",
    name: "Ahmed Khan",
    nric: "S9876543C",
    dob: "1975-11-30",
    age: 48,
    gender: "Male",
    preferred_language: "English",
    medical_history: ["Arthritis", "High Cholesterol"]
  }
];

export const mockVisits = [
  {
    visit_id: "v1",
    patient_id: "p1",
    user_input: "I've been having headaches and dizziness for the past week",
    keyword_match: ["headache", "dizziness"],
    height: 175,
    weight: 80,
    systolic: 140,
    diastolic: 90,
    heart_rate: 85,
    current_medication: true,
    ai_pre_diagnosis: {
      summary: "Patient is experiencing headaches and dizziness for a week. Elevated blood pressure (140/90) suggests possible hypertension which may be contributing to symptoms.",
      possibleConditions: ["Hypertension", "Migraine", "Vestibular disorder", "Stress/anxiety"],
      recommendedTests: ["Blood pressure monitoring", "Complete blood count", "Head CT scan if symptoms persist"],
      followUpQuestions: ["Are headaches worse at certain times of day?", "Any visual disturbances with headaches?", "Any recent changes in medication?"],
      redFlags: ["Persistent high blood pressure", "Worsening symptoms"]
    }
  },
  {
    visit_id: "v2",
    patient_id: "p2",
    user_input: "I have a persistent cough and slight fever",
    keyword_match: ["cough", "fever"],
    height: 165,
    weight: 60,
    systolic: 120,
    diastolic: 80,
    heart_rate: 75,
    current_medication: false,
    ai_pre_diagnosis: {
      summary: "Patient presents with persistent cough and slight fever. Given history of asthma, this could be an exacerbation or a respiratory infection.",
      possibleConditions: ["Upper respiratory infection", "Asthma exacerbation", "Bronchitis", "Early pneumonia"],
      recommendedTests: ["Chest X-ray", "Rapid strep test", "COVID-19 test", "Pulmonary function test"],
      followUpQuestions: ["Duration of symptoms?", "Any shortness of breath?", "Any exposure to sick contacts?"],
      redFlags: ["Difficulty breathing", "High fever", "Chest pain"]
    }
  },
  {
    visit_id: "v3",
    patient_id: "p3",
    user_input: "My joints are painful, especially in the morning",
    keyword_match: ["joint pain", "morning stiffness"],
    height: 180,
    weight: 85,
    systolic: 135,
    diastolic: 85,
    heart_rate: 70,
    current_medication: true,
    ai_pre_diagnosis: {
      summary: "Patient with history of arthritis reporting joint pain and morning stiffness. Symptoms are consistent with rheumatoid arthritis or osteoarthritis exacerbation.",
      possibleConditions: ["Rheumatoid arthritis flare", "Osteoarthritis", "Polymyalgia rheumatica", "Gout"],
      recommendedTests: ["ESR/CRP for inflammation", "Rheumatoid factor", "Uric acid levels", "Joint X-rays"],
      followUpQuestions: ["Which joints are affected?", "Duration of morning stiffness?", "Any recent changes in medication?"],
      redFlags: ["Severe joint swelling", "Fever", "Joint redness or warmth"]
    }
  }
];

export const mockQueue = [
  {
    queue_id: "q1",
    patient_id: "p1",
    status: "waiting",
    priority: "medium",
    created_at_timestamp: "2023-06-15T09:30:00Z",
    finished_at_timestamp: null,
    time_taken: null,
    order: 0
  },
  {
    queue_id: "q2",
    patient_id: "p2",
    status: "waiting",
    priority: "high",
    created_at_timestamp: "2023-06-15T09:45:00Z",
    finished_at_timestamp: null,
    time_taken: null,
    order: 1
  },
  {
    queue_id: "q3",
    patient_id: "p3",
    status: "ready",
    priority: "low",
    created_at_timestamp: "2023-06-15T10:00:00Z",
    finished_at_timestamp: null,
    time_taken: null,
    order: 2
  }
];

export const mockDoctors = [
  {
    doctor_id: "d1",
    doctor_name: "Dr. Sarah Lee",
    doctor_specialization: ["General Medicine", "Cardiology"]
  },
  {
    doctor_id: "d2",
    doctor_name: "Dr. Michael Wong",
    doctor_specialization: ["Pediatrics"]
  },
  {
    doctor_id: "d3",
    doctor_name: "Dr. Priya Sharma",
    doctor_specialization: ["Internal Medicine", "Endocrinology"]
  }
];