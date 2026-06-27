import { createServerClient } from "@/lib/supabase/server";
import { ColorBlockSection } from "@/components/public/ColorBlockSection";
import { CreatureCard } from "@/components/public/CreatureCard";
import { StoryCard } from "@/components/public/StoryCard";
import type {
  CreatureWithCategory,
  StoryWithCreature,
  Category,
} from "@/lib/supabase/types";

export const revalidate = 3600; // ISR: revalidate every hour

const marqueeQuotes = [
  "见则天下安宁",
  "能食人",
  "食者不蛊",
  "见则天下大旱",
  "佩之宜子孙",
  "见则其国大穰",
];

export default async function HomePage() {
  const supabase = await createServerClient();

  const [{ data: creatures }, { data: stories }, { data: categories }] =
    await Promise.all([
      supabase
        .from("creatures")
        .select("*, categories(*)")
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("stories")
        .select("*, creatures(id, name, slug, summary, image_path, category_id)")
        .eq("is_published", true)
        .order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

  const typedCreatures = (creatures || []) as unknown as CreatureWithCategory[];
  const typedStories = (stories || []) as unknown as StoryWithCreature[];
  const typedCategories = (categories || []) as unknown as Category[];

  return (
    <div className="max-w-[1280px] mx-auto px-lg md:px-xl">
      {/* Hero */}
      <section className="py-section text-center">
        <h1 className="text-display-xl font-normal mb-lg">山海图鉴</h1>
        <p className="text-body-lg max-w-2xl mx-auto">
          探索《山海经》奇珍异兽的视觉百科
        </p>
      </section>

      {/* Marquee Strip */}
      <div className="bg-inverse-canvas text-inverse-ink py-sm overflow-hidden">
        <div className="flex gap-xl whitespace-nowrap text-body-sm font-mono uppercase tracking-wider">
          {marqueeQuotes.map((quote, i) => (
            <span key={i}>{quote} · </span>
          ))}
        </div>
      </div>

      {/* Featured Creatures */}
      <section className="py-section">
        <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">
          精选异兽
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {typedCreatures.map((creature) => (
            <CreatureCard key={creature.id} creature={creature} />
          ))}
        </div>
      </section>

      {/* Category Color Blocks */}
      {typedCategories.map((category) => (
        <ColorBlockSection
          key={category.id}
          block={category.color_block as "block-lime"}
          eyebrow={category.name}
          title={getCategoryTitle(category.name)}
          linkHref={`/creatures?category=${category.slug}`}
          linkText={`查看全部${category.name}`}
        >
          <p>{getCategoryDescription(category.name)}</p>
        </ColorBlockSection>
      ))}

      {/* Story Entries */}
      <section className="py-section">
        <p className="font-mono uppercase tracking-wider text-eyebrow mb-md opacity-70">
          神话故事
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {typedStories.slice(0, 4).map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>
    </div>
  );
}

function getCategoryTitle(name: string): string {
  const titles: Record<string, string> = {
    鸟类: "天空之翼",
    兽类: "大地之灵",
    "鱼类/水生类": "深渊之鳞",
    "神灵/半神": "混沌之主",
    "异族/国度": "八荒之民",
    "蛇/爬虫类": "幽暗之蟒",
  };
  return titles[name] || name;
}

function getCategoryDescription(name: string): string {
  const descriptions: Record<string, string> = {
    鸟类: "45种，占全书26%。凤凰、毕方、精卫……翱翔于山海之间的神鸟。",
    兽类: "42种，占全书25%。九尾狐、穷奇、饕餮……行走于大地之上的异兽。",
    "鱼类/水生类":
      "30种，占全书18%。赤鱬、文鳐鱼、巴蛇……潜游于深渊之中的生灵。",
    "神灵/半神":
      "22种，占全书13%。西王母、烛龙、应龙……掌控天地法则的神灵。",
    "异族/国度":
      "17种，占全书10%。夸父、刑天、不死民……散居八荒的异族之民。",
    "蛇/爬虫类":
      "15种，占全书9%。肥遗、相柳、鸣蛇……蜿蜒于幽暗之中的爬虫。",
  };
  return descriptions[name] || "";
}
