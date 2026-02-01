import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Parse request body
        const { email: requestEmail, full_name, role, user_id } = await req.json();

        let email = requestEmail;

        if (!email && user_id) {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
            if (userError || !userData?.user) {
                throw new Error('User not found');
            }
            email = userData.user.email;
        }

        if (!email) {
            throw new Error('Email is required');
        }

        // Invite User
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name,
                role: role || 'student',
                onboarding_complete: false,
            },
        });

        if (error) throw error;

        // Atomically create profile
        if (data.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    full_name: full_name,
                    role: role || 'student',
                    status: 'invited',
                    // updated_at will be handled by default or trigger if set, but explicit is fine
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error('Profile creation failed:', profileError);
                // Optionally delete the user from Auth if profile fails to maintain strict atomicity
                // await supabaseAdmin.auth.admin.deleteUser(data.user.id);
                throw new Error(`Failed to create user profile: ${profileError.message}`);
            }
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
