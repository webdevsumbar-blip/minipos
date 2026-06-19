import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eazqoafabkfpdfviopds.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Lny0WsHLWJKOTW8hoEmiSA_QYXuggQV'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)