-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  color_block TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Creatures table
CREATE TABLE IF NOT EXISTS creatures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  summary      TEXT,
  origin       TEXT,
  appearance   TEXT,
  abilities    TEXT,
  description  TEXT,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  attribute    TEXT,
  image_path   TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  content      TEXT NOT NULL,
  creature_id  UUID REFERENCES creatures(id) ON DELETE SET NULL,
  image_path   TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: public read for published content
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read creatures" ON creatures FOR SELECT USING (is_published = true);
CREATE POLICY "Public read stories" ON stories FOR SELECT USING (is_published = true);

-- RLS Policies: admin write (authenticated users)
CREATE POLICY "Admin write categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write creatures" ON creatures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write stories" ON stories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creatures_updated_at BEFORE UPDATE ON creatures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('shanhaijing-assets', 'shanhaijing-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin write storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin update storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shanhaijing-assets');
CREATE POLICY "Admin delete storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shanhaijing-assets');
