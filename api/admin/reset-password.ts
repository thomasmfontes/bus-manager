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
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'User ID and new password are required' });
        }

        // Create admin client with service role key (secure, backend only)
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Update user password
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Error resetting password:', updateError);
            return res.status(400).json({ error: updateError.message });
        }

        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
