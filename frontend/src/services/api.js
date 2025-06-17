// src/services/patientAPI.js
import { supabase } from './supabaseClient';

export const patientAPI = {
  register: async (patientData) => {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (error) throw error;
    return { data: { patient: data } };
  },

  updateVitals: async (patientId, vitalsData) => {
    const { error } = await supabase
      .from('patients')
      .update({ ...vitalsData })
      .eq('id', patientId);

    if (error) throw error;
    return { success: true };
  },

  getPatient: async (id) => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  addToQueue: async (entryData) => {
    // Get current max order
    const { data: existingQueue, error: fetchError } = await supabase
      .from('queue')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    const nextOrder = existingQueue?.[0]?.order + 1 || 0;

    const { data, error } = await supabase.from('queue').insert([
      {
        ...entryData,
        order: nextOrder, // ✅ Include calculated order
      },
    ]);

    if (error) throw error;
    return data;
  }
};