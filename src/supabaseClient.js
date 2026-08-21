import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_CHAVE } from './constants/supabase.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE);
