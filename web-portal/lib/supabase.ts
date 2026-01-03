import { createClient } from '@supabase/supabase-js';

// Same credentials as mobile app - connects to same backend
const supabaseUrl = 'https://lqmampbkhwvrfcwkecsg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbWFtcGJraHd2cmZjd2tlY3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTU5OTcsImV4cCI6MjA4MDIzMTk5N30.ufTsgqXHCLkivGXks3ZXc9-833DchfrO-iBfz7iuHPY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
