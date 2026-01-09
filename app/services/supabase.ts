import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qngyxbhttcmkrcjvahku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZ3l4Ymh0dGNta3JjanZhaGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NzE4OTksImV4cCI6MjA4MTM0Nzg5OX0.Hv4SpVtgA5DSu8rf63tBOSu7xX94PYilmsdNecGDmuM';

export const supabase = createClient(supabaseUrl, supabaseKey);