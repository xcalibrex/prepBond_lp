/**
 * RLS Verification Script
 * This script is intended to be run manually or as part of a security check
 * to ensure that Row Level Security is active and properly scoped.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qngyxbhttcmkrcjvahku.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''; // Must be provided in environment

export const verifyRLS = async () => {
    if (!SUPABASE_ANON_KEY) {
        console.error("Missing SUPABASE_ANON_KEY. Skipping RLS verification.");
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log("Checking RLS on user_progress...");

    // 1. Attempt to read without any auth
    const { data: anonData, error: anonError } = await supabase
        .from('user_progress')
        .select('*');

    if (anonError) {
        console.log("✅ Anonymous read blocked as expected.");
    } else if (anonData && anonData.length > 0) {
        console.error("❌ SECURITY ALERT: Anonymous user could read data!");
    } else {
        console.log("ℹ️ Anonymous read returned no data (correct).");
    }

    // Note: Further verification would require signing in as two different users
    // and attempting to cross-read data, which is best handled in a CI environment
    // with test accounts.
};

if (import.meta.url === `file://${process.argv[1]}`) {
    verifyRLS();
}
