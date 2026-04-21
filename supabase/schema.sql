-- ============================================================
-- PharmaTrack — Schema complet
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Table : pharmacies ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pharmacies (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  city       text,
  plan       text NOT NULL DEFAULT 'starter',
  created_at timestamptz DEFAULT now()
);

-- ── Table : profiles ─────────────────────────────────────────
-- Une ligne par utilisateur Supabase Auth.
-- Contient aussi les infos pharmacie (colonnes françaises) pour la couche sdb.
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  pharmacy_id uuid REFERENCES pharmacies(id),
  full_name   text,
  role        text NOT NULL DEFAULT 'owner',

  -- Champs pharmacie (utilisés par sdb.pharmacy)
  nom         text,
  finess      text,
  adresse     text,
  code_postal text,
  ville       text,
  telephone   text,
  email       text,
  pharmacien  text,
  plan        text NOT NULL DEFAULT 'starter',
  has_real_data boolean NOT NULL DEFAULT false,

  updated_at  timestamptz DEFAULT now()
);

-- ── Table : products ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  nom              text NOT NULL,
  cip_code         text,
  laboratoire      text,
  stock            integer NOT NULL DEFAULT 0,
  prix_unitaire    numeric(10,2) NOT NULL DEFAULT 0,
  date_expiration  date NOT NULL,
  condition_retour boolean DEFAULT false,
  tag              text CHECK (tag IN ('liquidation', 'promotion') OR tag IS NULL),
  remise_pct       numeric(5,2),
  prix_remise      numeric(10,2),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),

  UNIQUE (user_id, cip_code)
);

-- ── Table : returns ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  laboratoire       text NOT NULL,
  status            text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoye', 'valide')),
  total_valeur      numeric(10,2) NOT NULL DEFAULT 0,
  date_creation     timestamptz DEFAULT now(),
  date_envoi        timestamptz,
  date_validation   timestamptz,
  reference_retour  text
);

-- ── Table : return_items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS return_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id     uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id    uuid REFERENCES products(id) ON DELETE SET NULL,
  nom           text NOT NULL,
  cip_code      text,
  quantite      integer NOT NULL DEFAULT 1,
  prix_unitaire numeric(10,2) NOT NULL DEFAULT 0,
  valeur        numeric(10,2) NOT NULL DEFAULT 0
);

-- ── Table : alerts_config ────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts_config (
  user_id             uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  seuil_critique      integer NOT NULL DEFAULT 30,
  seuil_urgent        integer NOT NULL DEFAULT 60,
  seuil_attention     integer NOT NULL DEFAULT 90,
  email_notifications boolean NOT NULL DEFAULT false,
  email_address       text NOT NULL DEFAULT '',
  updated_at          timestamptz DEFAULT now()
);

-- ── Table : import_history ───────────────────────────────────
CREATE TABLE IF NOT EXISTS import_history (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date     timestamptz DEFAULT now(),
  filename text NOT NULL,
  count    integer NOT NULL DEFAULT 0
);

-- ============================================================
-- RLS : Row Level Security
-- ============================================================

ALTER TABLE pharmacies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history  ENABLE ROW LEVEL SECURITY;

-- pharmacies : lecture publique pour les membres qui y sont liés
CREATE POLICY "Lecture pharmacie liée" ON pharmacies
  FOR SELECT USING (
    id IN (SELECT pharmacy_id FROM profiles WHERE id = auth.uid())
  );

-- profiles : chaque utilisateur gère son propre profil
CREATE POLICY "Lecture profil propre"   ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Mise à jour profil propre" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Insertion profil propre"  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- products
CREATE POLICY "CRUD produits propres" ON products
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- returns
CREATE POLICY "CRUD retours propres" ON returns
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- return_items : via la FK sur returns
CREATE POLICY "CRUD articles retours propres" ON return_items
  FOR ALL USING (
    return_id IN (SELECT id FROM returns WHERE user_id = auth.uid())
  )
  WITH CHECK (
    return_id IN (SELECT id FROM returns WHERE user_id = auth.uid())
  );

-- alerts_config
CREATE POLICY "CRUD config alertes propres" ON alerts_config
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- import_history
CREATE POLICY "CRUD historique import propre" ON import_history
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- Trigger : créer un profil vide à chaque inscription
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'starter'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
