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
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify user is authenticated and is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
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
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: newUser.user.id,
                name,
                role: 'admin'
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Try to delete the user if profile creation failed
            await adminClient.auth.admin.deleteUser(newUser.user.id);
            return res.status(400).json({ error: 'Failed to create admin profile' });
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
