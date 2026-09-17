// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xyz.supabase.co'
const supabaseKey = 'PUBLIC_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase