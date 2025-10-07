import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ozvjmkvmpxxviveniuwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dmpta3ZtcHh4dml2ZW5pdXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MzYzMjQsImV4cCI6MjA3MjAxMjMyNH0.1bk9TEf-K14xQ2i-Wq5xD8ejZeGZ7t5VhXzxFOuBhbA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);