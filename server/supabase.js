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

let lastSupabaseSnapshotTime = 0;
const SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes between cloud snapshots

export async function createSupabaseSnapshot(stateData, tag = 'Automático') {
  try {
    if (!stateData) return false;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    const counts = {
      leads: stateData.leads?.length || 0,
      clients: stateData.clients?.length || 0,
      projects: stateData.projects?.length || 0,
      invoices: stateData.invoices?.length || 0,
      expenses: stateData.expenses?.length || 0
    };

    const { error } = await supabase
      .from('prime_state')
      .upsert({
        id: backupId,
        data: {
          ...stateData,
          _backupEnvelope: {
            backupId,
            tag,
            counts,
            createdAt: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (!error) {
      console.log(`[Supabase Backup Engine] ✅ Snapshot criado na nuvem: ${backupId} (${tag})`);
      lastSupabaseSnapshotTime = Date.now();
      rotateSupabaseSnapshots(40).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Snapshot Erro]:', err.message);
  }
  return false;
}

export async function rotateSupabaseSnapshots(maxKeep = 40) {
  try {
    const { data } = await supabase
      .from('prime_state')
      .select('id, updated_at')
      .neq('id', 'current')
      .order('updated_at', { ascending: false });

    if (data && data.length > maxKeep) {
      const toDelete = data.slice(maxKeep).map(r => r.id);
      for (const id of toDelete) {
        await supabase.from('prime_state').delete().eq('id', id);
      }
    }
  } catch (err) {}
}

export async function saveStateToSupabase(stateData, forceSnapshot = false, tag = 'Auto') {
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

    console.log('[Supabase] ✅ Estado live guardado com sucesso na nuvem Supabase!');

    // Cria snapshot na nuvem se o intervalo passou ou se foi forçado por ação crítica
    const timeSinceLast = Date.now() - lastSupabaseSnapshotTime;
    if (forceSnapshot || timeSinceLast > SNAPSHOT_INTERVAL_MS) {
      createSupabaseSnapshot(stateData, tag).catch(() => {});
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Erro de rede na gravação:', err.message);
    return false;
  }
}

