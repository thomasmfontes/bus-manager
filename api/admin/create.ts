import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get auth token from request
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Create Supabase client with anon key to verify user
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify user is authenticated and is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth error:', authError);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('User authenticated:', user.id, user.email);

        // Check if user is admin
        const { data: profile, error: checkProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('Profile data:', profile);
        console.log('Profile error:', checkProfileError);
        console.log('Profile role:', profile?.role);

        if (profile?.role !== 'admin') {
            console.error('User is not admin. Role:', profile?.role);
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // Get request body
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Create admin client with service role key (secure, backend only)
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Create new admin user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (createError) {
            console.error('Error creating admin:', createError);
            return res.status(400).json({ error: createError.message });
        }

        // Create profile with admin role
        console.log('Attempting to create profile for user:', newUser.user.id);
        console.log('Profile data:', { id: newUser.user.id, email, full_name: name, role: 'admin' });

        const { data: profileData, error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: newUser.user.id,
                email: email,
                full_name: name,
                role: 'admin'
            })
            .select();

        console.log('Profile creation result:', { profileData, profileError });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            console.error('Full error details:', JSON.stringify(profileError, null, 2));
            // Try to delete the user if profile creation failed
            await adminClient.auth.admin.deleteUser(newUser.user.id);
            return res.status(400).json({
                error: 'Failed to create admin profile',
                details: profileError.message
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                name
            }
        });

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
