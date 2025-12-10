// Supabase client for NightShift dashboard

// Your Supabase project URL
const SUPABASE_URL = "https://sbzdnzouoyxmawuhdvdi.supabase.co";

// Your Supabase anon public key (safe for frontend)
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiemRuem91b3l4bWF3dWhkdmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDY3ODgsImV4cCI6MjA4MDc4Mjc4OH0.SV4XppZoez27_g69NsjZNeJ989bhrEAAvR_XoD5w2Ho";

// Warn if key missing
if (!SUPABASE_ANON_KEY) {
  console.warn(
    "[NightShift Dashboard] Missing anon key — update supabase-client.js"
  );
}

// Create Supabase client (global)
window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
