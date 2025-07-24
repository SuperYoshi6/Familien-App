import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjkmfodzhradtkeiyele.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqa21mb2R6aHJhZHRrZWl5ZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0ODIwNjEsImV4cCI6MjA2ODA1ODA2MX0.2cfezsLcT6x3KI9VqzrHntP80O-cy0JQUb7UK3Mnai8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
