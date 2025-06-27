// js/config.js

// --- KONFIGURASI: Ganti dengan URL dan ANON KEY Anda ---
const SUPABASE_URL = 'https://eutgkrxqmebkxtvdburi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dGdrcnhxbWVia3h0dmRidXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDgxOTgsImV4cCI6MjA2NjIyNDE5OH0.RdeFRqV4sDSZpH5bcM_vpwGz4EMJU40nRl24TjtNzWU';
// ----------------------------------------------------

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);