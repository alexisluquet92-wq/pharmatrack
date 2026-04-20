'use client';
import { createClient } from '@/lib/supabase';
import type { Product, Return, ReturnItem, AlertsConfig, ImportHistory, Pharmacy } from '@/lib/data';

async function getUid(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

const DEFAULT_ALERTS: AlertsConfig = {
  seuil_critique: 30, seuil_urgent: 60, seuil_attention: 90,
  email_notifications: false, email_address: '',
};

export const sdb = {
  pharmacy: {
    get: async (): Promise<Pharmacy | null> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!data) return null;
      return { ...data, id: user.id, has_real_data: true, plan: (data.plan || 'starter') } as Pharmacy;
    },
    upsert: async (partial: Partial<Omit<Pharmacy, 'id'>>): Promise<void> => {
      const supabase = createClient();
      const uid = await getUid();
      await supabase.from('profiles').upsert({ id: uid, ...partial, updated_at: new Date().toISOString() });
    },
  },

  products: {
    getAll: async (): Promise<Product[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products').select('*').order('date_expiration', { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []) as Product[];
    },
    upsert: async (items: Partial<Product>[]): Promise<{ imported: number }> => {
      const supabase = createClient();
      const uid = await getUid();
      const now = new Date().toISOString();
      const withCip = items.filter(i => i.cip_code);
      const withoutCip = items.filter(i => !i.cip_code);
      if (withCip.length > 0) {
        await supabase.from('products').upsert(
          withCip.map(i => ({ ...i, user_id: uid, created_at: now, updated_at: now })),
          { onConflict: 'user_id,cip_code' }
        );
      }
      if (withoutCip.length > 0) {
        await supabase.from('products').insert(
          withoutCip.map(i => ({ ...i, user_id: uid, created_at: now, updated_at: now }))
        );
      }
      return { imported: items.length };
    },
    update: async (id: string, partial: Partial<Product>): Promise<void> => {
      const supabase = createClient();
      await supabase.from('products').update({ ...partial, updated_at: new Date().toISOString() }).eq('id', id);
    },
    delete: async (id: string): Promise<void> => {
      const supabase = createClient();
      await supabase.from('products').delete().eq('id', id);
    },
    deleteAll: async (): Promise<void> => {
      const supabase = createClient();
      const uid = await getUid();
      await supabase.from('products').delete().eq('user_id', uid);
    },
  },

  returns: {
    getAll: async (): Promise<Return[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('returns').select('*').order('date_creation', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []) as Return[];
    },
    insert: async (data: Partial<Return>): Promise<Return> => {
      const supabase = createClient();
      const uid = await getUid();
      const now = new Date().toISOString();
      const { data: row, error } = await supabase.from('returns').insert({
        ...data, user_id: uid, date_creation: now,
        date_envoi: null, date_validation: null, reference_retour: null,
      }).select().single();
      if (error) throw error;
      return row as Return;
    },
    update: async (id: string, partial: Partial<Return>): Promise<void> => {
      const supabase = createClient();
      await supabase.from('returns').update(partial).eq('id', id);
    },
    delete: async (id: string): Promise<void> => {
      const supabase = createClient();
      await supabase.from('returns').delete().eq('id', id);
    },
  },

  returnItems: {
    getByReturn: async (returnId: string): Promise<ReturnItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('return_items').select('*').eq('return_id', returnId);
      if (error) { console.error(error); return []; }
      return (data || []) as ReturnItem[];
    },
    insert: async (item: Partial<ReturnItem>): Promise<ReturnItem> => {
      const supabase = createClient();
      const { data, error } = await supabase.from('return_items').insert(item).select().single();
      if (error) throw error;
      return data as ReturnItem;
    },
    delete: async (id: string): Promise<void> => {
      const supabase = createClient();
      await supabase.from('return_items').delete().eq('id', id);
    },
  },

  alertsConfig: {
    get: async (): Promise<AlertsConfig> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ...DEFAULT_ALERTS };
      const { data } = await supabase.from('alerts_config').select('*').eq('user_id', user.id).single();
      return (data as AlertsConfig) || { ...DEFAULT_ALERTS };
    },
    update: async (partial: Partial<AlertsConfig>): Promise<void> => {
      const supabase = createClient();
      const uid = await getUid();
      await supabase.from('alerts_config').upsert({ user_id: uid, ...partial, updated_at: new Date().toISOString() });
    },
  },

  importHistory: {
    getAll: async (): Promise<ImportHistory[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('import_history').select('*').order('date', { ascending: false }).limit(50);
      if (error) { console.error(error); return []; }
      return (data || []) as ImportHistory[];
    },
    insert: async (data: Omit<ImportHistory, 'id'>): Promise<ImportHistory> => {
      const supabase = createClient();
      const uid = await getUid();
      const { data: row, error } = await supabase.from('import_history').insert({ ...data, user_id: uid }).select().single();
      if (error) throw error;
      return row as ImportHistory;
    },
  },
};
