import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const categoryData = [
  {
    id: 1,
    name: "Science & Technology",
    description: "AI assistants specializing in scientific research, technological innovation, and discovery",
    slug: "science-technology",
    color: "#3b82f6" // Blue
  },
  {
    id: 2,
    name: "Philosophy & Ethics",
    description: "AI assistants focused on philosophical thinking, ethical reasoning, and wisdom",
    slug: "philosophy-ethics",
    color: "#8b5cf6" // Purple
  },
  {
    id: 3,
    name: "Arts & Literature", 
    description: "AI assistants specializing in creative expression, literature, and artistic endeavors",
    slug: "arts-literature",
    color: "#f59e0b" // Amber
  },
  {
    id: 4,
    name: "Medicine & Healthcare",
    description: "AI assistants focused on medical knowledge, healthcare practices, and patient care",
    slug: "medicine-healthcare", 
    color: "#ef4444" // Red
  },
  {
    id: 5,
    name: "Computing & Mathematics",
    description: "AI assistants specializing in computational thinking, programming, and mathematical concepts",
    slug: "computing-mathematics",
    color: "#06b6d4" // Cyan
  },
  {
    id: 6,
    name: "Social Sciences",
    description: "AI assistants focused on economics, psychology, and understanding human behavior",
    slug: "social-sciences",
    color: "#ec4899" // Pink
  },
  {
    id: 7,
    name: "Leadership & Social Justice",
    description: "AI assistants specializing in leadership principles, civil rights, and social change",
    slug: "leadership-social-justice",
    color: "#10b981" // Green
  },
  {
    id: 8,
    name: "Conservation & Environment",
    description: "AI assistants focused on environmental protection, wildlife conservation, and sustainability",
    slug: "conservation-environment",
    color: "#22c55e" // Green (different shade)
  },
  {
    id: 9,
    name: "Lifestyle & Personal Development",
    description: "AI assistants specializing in personal growth, organization, and life improvement",
    slug: "lifestyle-personal-development",
    color: "#f472b6" // Pink (different shade)
  }
];

export async function seedCategories() {
  console.log("📚 Starting Categories seeding...");
  
  try {
    for (const category of categoryData) {
      try {
        // Check if category already exists
        const [existingCategory] = await db.select().from(categories).where(eq(categories.id, category.id));
        
        if (existingCategory) {
          // Update existing category
          await db
            .update(categories)
            .set({
              name: category.name,
              description: category.description,
              slug: category.slug,
              color: category.color,
            })
            .where(eq(categories.id, category.id));
          console.log(`✅ Updated ${category.name}`);
        } else {
          // Create new category
          await db.insert(categories).values({
            id: category.id,
            name: category.name,
            description: category.description,
            slug: category.slug,
            color: category.color,
          });
          console.log(`✅ Created ${category.name}`);
        }
      } catch (error) {
        console.error(`❌ Error seeding ${category.name}:`, error);
      }
    }
    
    console.log("🎉 Categories seeding completed!");
    return true;
  } catch (error) {
    console.error("❌ Error during Categories seeding:", error);
    return false;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}