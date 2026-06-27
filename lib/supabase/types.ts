export type Category = {
  id: string
  name: string
  slug: string
  color_block: string
  sort_order: number
  created_at: string
}

export type Creature = {
  id: string
  name: string
  slug: string
  summary: string | null
  origin: string | null
  appearance: string | null
  abilities: string | null
  description: string | null
  category_id: string | null
  attribute: string | null
  image_path: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type Story = {
  id: string
  title: string
  slug: string
  content: string
  creature_id: string | null
  image_path: string | null
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CreatureWithCategory = Creature & {
  categories: Category | null
}

export type StoryWithCreature = Story & {
  creatures: { id: string; name: string; slug: string; summary: string | null; image_path: string | null; category_id: string | null } | null
}

// Shape must satisfy @supabase/postgrest-js GenericSchema
// (Tables + Views + Functions, each Table carrying Relationships),
// otherwise `from(table).insert/update` collapses to `never`.
export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category>; Relationships: [] }
      creatures: { Row: Creature; Insert: Partial<Creature>; Update: Partial<Creature>; Relationships: [] }
      stories: { Row: Story; Insert: Partial<Story>; Update: Partial<Story>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
