import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRequest {
    userIds: string[];
    title: string;
    body: string;
    data?: any;
}

serve(async (req) => {
    try {
        const { userIds, title, body, data } = await req.json() as NotificationRequest

        if (!userIds || userIds.length === 0) {
            return new Response(JSON.stringify({ message: 'No user IDs provided' }), { status: 400 })
        }

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Fetch push tokens for users
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('push_token')
            .in('id', userIds)
            .not('push_token', 'is', null)

        if (error) throw error

        const tokens = profiles.map(p => p.push_token).filter(t => t)

        if (tokens.length === 0) {
            return new Response(JSON.stringify({ message: 'No valid tokens found' }), { status: 200 })
        }

        // Send notifications via Expo
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data,
        }))

        // Expo handles batching automatically if we send an array, but let's chunk it just in case
        // Expo recommends chunks of 100
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }

        const results = [];
        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            });
            results.push(await response.json());
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { "Content-Type": "application/json" } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        )
    }
})
