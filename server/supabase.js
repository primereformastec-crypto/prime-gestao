import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lposxkrxopxyjsfmtrno.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_vsf9rd2Wqto-zzalKj-YXQ_E4BZxyMw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchStateFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('prime_state')
      .select('data')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Leitura:', error.message);
      return null;
    }
    return data?.data || null;
  } catch (err) {
    console.warn('[Supabase] Erro de rede na leitura:', err.message);
    return null;
  }
}

export async function saveStateToSupabase(stateData) {
  try {
    const { error } = await supabase
      .from('prime_state')
      .upsert({
        id: 'current',
        data: stateData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Gravação:', error.message);
      return false;
    }
    console.log('[Supabase] ✅ Estado guardado com sucesso na nuvem Supabase!');
    return true;
  } catch (err) {
    console.warn('[Supabase] Erro de rede na gravação:', err.message);
    return false;
  }
}
