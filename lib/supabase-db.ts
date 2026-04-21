'use client';
import { createClient } from '@/lib/supabase';
import type { Product, Return, Alert, Parapharmacie, ImportHistory, Pharmacy } from '@/lib/data';

async function getUid(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

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
      await supabase.from('profiles').upsert({ id: uid, ...partial });
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
      const withCip = items.filter(i => i.cip_code);
      const withoutCip = items.filter(i => !i.cip_code);
      if (withCip.length > 0) {
        await supabase.from('products').upsert(
          withCip.map(i => ({ ...i, user_id: uid })),
          { onConflict: 'user_id,cip_code' }
        );
      }
      if (withoutCip.length > 0) {
        await supabase.from('products').insert(
          withoutCip.map(i => ({ ...i, user_id: uid }))
        );
      }
      return { imported: items.length };
    },
    update: async (id: string, partial: Partial<Product>): Promise<void> => {
      const supabase = createClient();
      await supabase.from('products').update(partial).eq('id', id);
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
        .from('returns').select('*').order('date_retour', { ascending: false });
      if (error) { console.error(error); return []; }
      return (data || []) as Return[];
    },
    insert: async (data: Omit<Return, 'id' | 'user_id'>): Promise<Return> => {
      const supabase = createClient();
      const uid = await getUid();
      const { data: row, error } = await supabase.from('returns').insert({
        ...data, user_id: uid,
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

  alerts: {
    getAll: async (): Promise<Alert[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.from('alerts').select('*');
      if (error) { console.error(error); return []; }
      return (data || []) as Alert[];
    },
    upsert: async (productId: string, type: string, joursSeuil: number): Promise<void> => {
      const supabase = createClient();
      const uid = await getUid();
      await supabase.from('alerts').upsert(
        { user_id: uid, product_id: productId, type, jours_seuil: joursSeuil, is_active: true },
        { onConflict: 'user_id,product_id,type' }
      );
    },
    delete: async (id: string): Promise<void> => {
      const supabase = createClient();
      await supabase.from('alerts').delete().eq('id', id);
    },
  },

  parapharmacie: {
    getAll: async (): Promise<Parapharmacie[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('parapharmacie').select('*').order('date_expiration', { ascending: true });
      if (error) { console.error(error); return []; }
      return (data || []) as Parapharmacie[];
    },
    insert: async (item: Omit<Parapharmacie, 'id' | 'user_id'>): Promise<Parapharmacie> => {
      const supabase = createClient();
      const uid = await getUid();
      const { data, error } = await supabase.from('parapharmacie').insert({ ...item, user_id: uid }).select().single();
      if (error) throw error;
      return data as Parapharmacie;
    },
    update: async (id: string, partial: Partial<Parapharmacie>): Promise<void> => {
      const supabase = createClient();
      await supabase.from('parapharmacie').update(partial).eq('id', id);
    },
    delete: async (id: string): Promise<void> => {
      const supabase = createClient();
      await supabase.from('parapharmacie').delete().eq('id', id);
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
