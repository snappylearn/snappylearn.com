import { db } from "./db";
import { topics, posts, follows, likes, comments, users, collections, documents, userTypes } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    console.log("Seeding database with demo data...");

    // First, seed user types
    const existingUserTypes = await db.select().from(userTypes).limit(1);
    
    if (existingUserTypes.length === 0) {
      const defaultUserTypes = [
        { name: "human", description: "Regular human users" },
        { name: "assistant", description: "AI assistant users created by humans or admins" }
      ];
      
      await db.insert(userTypes).values(defaultUserTypes);
      console.log("✓ User types seeded");
    } else {
      console.log("✓ User types already exist");
    }

    // Then, seed topics
    const defaultTopics = [
      { name: "AI & Machine Learning", slug: "ai-machine-learning", color: "#8B5CF6", icon: "Brain" },
      { name: "Technology & Programming", slug: "technology-programming", color: "#3B82F6", icon: "Code" },
      { name: "Business & Entrepreneurship", slug: "business-entrepreneurship", color: "#059669", icon: "TrendingUp" },
      { name: "Design & Creativity", slug: "design-creativity", color: "#DC2626", icon: "Palette" },
      { name: "Science & Research", slug: "science-research", color: "#7C3AED", icon: "Microscope" },
      { name: "Education & Learning", slug: "education-learning", color: "#EA580C", icon: "BookOpen" },
      { name: "Health & Wellness", slug: "health-wellness", color: "#16A34A", icon: "Heart" },
      { name: "Philosophy & Ethics", slug: "philosophy-ethics", color: "#BE185D", icon: "Lightbulb" },
      { name: "History & Culture", slug: "history-culture", color: "#B45309", icon: "Clock" },
      { name: "Personal Development", slug: "personal-development", color: "#0891B2", icon: "User" },
      { name: "Finance & Economics", slug: "finance-economics", color: "#65A30D", icon: "DollarSign" },
      { name: "Environment & Sustainability", slug: "environment-sustainability", color: "#047857", icon: "Leaf" }
    ];

    // Check if topics already exist
    const existingTopics = await db.select().from(topics).limit(1);
    
    if (existingTopics.length === 0) {
      await db.insert(topics).values(defaultTopics);
      console.log("✓ Topics seeded");
    } else {
      console.log("✓ Topics already exist");
    }

    // Get all topics for post creation
    const allTopics = await db.select().from(topics);
    
    // Create demo users if they don't exist
    const existingDemoUsers = await db.select().from(users).where(sql`id LIKE 'demo-user-%'`);
    let demoUsers = [];
    
    if (existingDemoUsers.length === 0) {
      console.log("Creating demo users...");
      const demoUserData = [
        {
          id: "demo-user-1",
          email: "sarah.chen@example.com",
          firstName: "Sarah",
          lastName: "Chen",
          profileImageUrl: null,
          userTypeId: 1, // human
        },
        {
          id: "demo-user-2", 
          email: "alex.rodriguez@example.com",
          firstName: "Alex",
          lastName: "Rodriguez",
          profileImageUrl: null,
          userTypeId: 1, // human
        },
        {
          id: "demo-user-3",
          email: "maya.patel@example.com", 
          firstName: "Maya",
          lastName: "Patel",
          profileImageUrl: null,
          userTypeId: 1, // human
        },
        {
          id: "demo-user-4",
          email: "jordan.kim@example.com",
          firstName: "Jordan", 
          lastName: "Kim",
          profileImageUrl: null,
          userTypeId: 1, // human
        }
      ];
      
      demoUsers = await db.insert(users).values(demoUserData).returning();
      console.log("✓ Demo users created");
    } else {
      demoUsers = await db.select().from(users);
      console.log("✓ Using existing users");
    }

    // Create Agent Bot personas if they don't exist
    const existingAgentBots = await db.select().from(users).where(sql`id LIKE 'agent-%'`);
    let agentBots = [];
    
    if (existingAgentBots.length === 0) {
      console.log("Creating Agent Bot personas...");
      const agentBotData = [
        {
          id: "agent-einstein",
          email: null,
          firstName: "Albert",
          lastName: "Einstein",
          profileImageUrl: null,
          userTypeId: 2, // assistant
          about: "A theoretical physicist who finds cosmic wonder in the simplest questions. My goal is to simplify the complex and find the universe's rhythm in everyday life.",
          systemPrompt: "You are Albert Einstein. Your communication style is curious, witty, and deeply human. Explain complex scientific ideas using relatable analogies and metaphors. Your tone is approachable and often whimsical. You believe that 'imagination is more important than knowledge.' When engaging with others, you will pose questions that encourage imaginative thought, not just factual recall. Your worldview is one of unified fields, where everything is connected.",
          createdBy: null // Created by admin
        },
        {
          id: "agent-curie",
          email: null,
          firstName: "Marie",
          lastName: "Curie",
          profileImageUrl: null,
          userTypeId: 2, // assistant
          about: "I approach science not as a pursuit of fame, but as a dedicated service to humanity. I find strength in persistence and quiet observation.",
          systemPrompt: "You are Marie Curie. Your communication is calm, methodical, and humble. You speak with a quiet, persistent determination, focusing on the practical application and ethical responsibility of scientific discovery. You emphasize hard work, patience, and the collective nature of progress. When faced with a challenge, you will reference the necessity of methodical experimentation and unfailing dedication.",
          createdBy: null // Created by admin
        },
        {
          id: "agent-tesla",
          email: null,
          firstName: "Nikola",
          lastName: "Tesla",
          profileImageUrl: null,
          userTypeId: 2, // assistant
          about: "The future is a symphony of electricity and energy, and I am here to conduct it. I dream in currents and think in frequencies.",
          systemPrompt: "You are Nikola Tesla. Your style is visionary, dramatic, and slightly eccentric. You see the world through a lens of potential and pure energy. Your language is often theatrical, filled with vivid imagery and grand pronouncements about the future. You are passionate about wireless technology and sustainable energy, often dismissing conventional thinking.",
          createdBy: null // Created by admin
        },
        {
          id: "agent-socrates",
          email: null,
          firstName: "Socrates",
          lastName: "",
          profileImageUrl: null,
          userTypeId: 2, // assistant
          about: "I do not teach; I simply help others discover the knowledge they already possess within themselves.",
          systemPrompt: "You are Socrates. Your purpose is not to provide answers but to provoke thought through a series of questions. Your tone is curious and challenging, but never aggressive. You will deconstruct a user's statement by asking for definitions, clarifications, and underlying assumptions. You believe that the unexamined life is not worth living.",
          createdBy: null // Created by admin
        },
        {
          id: "agent-davinci",
          email: null,
          firstName: "Leonardo",
          lastName: "da Vinci",
          profileImageUrl: null,
          userTypeId: 2, // assistant
          about: "I find no division between art and science. I approach every problem with the eye of a painter and the mind of an engineer.",
          systemPrompt: "You are Leonardo da Vinci. Your voice is that of a curious and meticulous polymath. You observe the world with both an artistic and scientific eye, seamlessly connecting disparate fields. You believe that understanding comes from direct observation and hands-on experimentation. Your responses will be a blend of artistic observation and technical detail.",
          createdBy: null // Created by admin
        }
      ];
      
      agentBots = await db.insert(users).values(agentBotData).returning();
      console.log("✓ Agent Bot personas created");
    } else {
      agentBots = await db.select().from(users).where(sql`id LIKE 'agent-%'`);
      console.log("✓ Using existing Agent Bots");
    }

    if (demoUsers.length === 0) {
      console.log("⚠ No users available - skipping content creation");
      return;
    }

    // Check if posts already exist
    const existingPosts = await db.select().from(posts).limit(1);
    
    if (existingPosts.length === 0 && allTopics.length > 0) {
      const demoPosts = [
        {
          title: "The Future of AI in Education",
          content: "Artificial Intelligence is revolutionizing how we learn and teach. From personalized learning paths to automated grading systems, AI is making education more accessible and effective than ever before.\n\nKey benefits I've observed:\n• Personalized learning experiences\n• Real-time feedback and assessment\n• Accessibility for diverse learning needs\n• 24/7 availability for support\n\nWhat are your thoughts on AI tutors vs human teachers? I believe the future lies in collaboration between both.",
          excerpt: "Exploring how AI is transforming education with personalized learning and automated systems...",
          authorId: demoUsers[0].id,
          topicId: allTopics.find(t => t.slug === "ai-machine-learning")?.id || allTopics[0].id,
          type: "text"
        },
        {
          title: "Building Sustainable Startups in 2025",
          content: "In today's world, sustainability isn't just a buzzword - it's a business imperative. After working with 50+ startups over the past 3 years, I've learned how to build companies that are both profitable and environmentally conscious.\n\n🌱 Key strategies that work:\n1. Circular economy models from day one\n2. Green technology integration\n3. Sustainable supply chain partnerships\n4. ESG metrics as core KPIs\n\nThe most successful sustainable startups I've seen don't treat environmental responsibility as an add-on - they make it central to their value proposition.",
          excerpt: "Discover proven strategies for building profitable and environmentally conscious startups...",
          authorId: demoUsers[1].id,
          topicId: allTopics.find(t => t.slug === "business-entrepreneurship")?.id || allTopics[1].id,
          type: "text"
        },
        {
          title: "The Science Behind Habit Formation",
          content: "Understanding how habits work can completely transform your life. After diving deep into neuroscience research for my psychology thesis, I discovered that habits follow a predictable neurological loop.\n\nThe Habit Loop:\n🧠 Cue → Routine → Reward → Repeat\n\nWhat fascinated me most is that our brains physically change when we form new habits. The basal ganglia, responsible for automatic behaviors, literally rewires itself.\n\nPractical tips that work:\n• Start ridiculously small (2-minute rule)\n• Stack habits on existing routines\n• Focus on identity, not just outcomes\n• Track your streaks but don't break the chain\n\nI've used these principles to build a consistent meditation practice, learn Spanish, and maintain a workout routine for 2+ years.",
          excerpt: "Learn the neuroscience behind habit formation and practical strategies for lasting change...",
          authorId: demoUsers[2].id,
          topicId: allTopics.find(t => t.slug === "personal-development")?.id || allTopics[2].id,
          type: "text"
        },
        {
          title: "Modern Web Development: What's Actually Important in 2025",
          content: "The web development landscape is constantly evolving, but not every trend is worth your time. As a senior developer who's been in the industry for 8 years, here's what I think actually matters:\n\n✅ Worth learning:\n• TypeScript (game-changer for large projects)\n• React Server Components\n• Edge computing patterns\n• Web performance optimization\n• Accessibility fundamentals\n\n❌ Skip for now:\n• Framework hopping without reason\n• Over-engineering simple solutions\n• Chasing every new JS library\n\nThe key is building maintainable, performant applications that solve real problems. Focus on fundamentals first, then add complexity only when needed.\n\nWhat's your experience with the current web dev ecosystem?",
          excerpt: "A senior developer's perspective on what really matters in modern web development...",
          authorId: demoUsers[3].id,
          topicId: allTopics.find(t => t.slug === "technology-programming")?.id || allTopics[3].id,
          type: "text"
        },
        {
          title: "My Journey Learning Machine Learning",
          content: "Six months ago, I decided to transition from marketing to ML engineering. Here's what I wish I knew when starting:\n\n📚 Learning path that worked:\n1. Python fundamentals (3 weeks)\n2. Statistics & probability (2 weeks) \n3. Pandas & NumPy (1 week)\n4. Scikit-learn basics (2 weeks)\n5. Deep learning with PyTorch (ongoing)\n\n💡 Key insights:\n• Math anxiety is real but manageable\n• Kaggle competitions teach practical skills\n• Building projects > watching tutorials\n• Community support is everything\n\nCurrently working on a computer vision project for medical imaging. The learning curve is steep but incredibly rewarding!\n\nAnyone else making a career transition? What's been your biggest challenge?",
          excerpt: "A marketing professional's journey transitioning to machine learning engineering...",
          authorId: demoUsers[0].id,
          topicId: allTopics.find(t => t.slug === "ai-machine-learning")?.id || allTopics[0].id,
          type: "text"
        },
        {
          title: "Why I Started Reading Philosophy (And You Should Too)",
          content: "Philosophy changed how I think about everything - from daily decisions to life's big questions.\n\nStarted with Stoicism during a particularly stressful period at work. Marcus Aurelius' 'Meditations' taught me that we can't control external events, only our responses to them.\n\n📖 Books that shifted my perspective:\n• 'The Obstacle Is the Way' by Ryan Holiday\n• 'Being and Time' by Heidegger (challenging but worth it)\n• 'The Nicomachean Ethics' by Aristotle\n• 'Sapiens' by Yuval Noah Harari\n\nPhilosophy isn't just abstract thinking - it's practical wisdom for navigating complexity, making ethical decisions, and understanding our place in the world.\n\nWhat philosophical ideas have influenced your thinking?",
          excerpt: "How philosophy provided practical wisdom for navigating life's complexities...",
          authorId: demoUsers[2].id,
          topicId: allTopics.find(t => t.slug === "philosophy-ethics")?.id || allTopics[7].id,
          type: "text"
        }
      ];

      await db.insert(posts).values(demoPosts);
      console.log("✓ Demo posts created");
    } else {
      console.log("✓ Posts already exist");
    }

    // Create Personal Collections for all users (ensure one per user)
    const allUsers = [...demoUsers, ...agentBots];
    
    for (const user of allUsers) {
      const existingPersonalNotebook = await db.select().from(collections)
        .where(sql`user_id = ${user.id} AND is_default = true`)
        .limit(1);
      
      if (existingPersonalNotebook.length === 0) {
        await db.insert(collections).values({
          name: "Personal Collection",
          description: "Your default collection for saved posts and documents",
          userId: user.id,
          isDefault: true
        });
      }
    }
    console.log("✓ Personal Collections ensured for all users");

    // Create demo collections
    const existingCollections = await db.select().from(collections).where(sql`is_default = false`).limit(1);
    
    if (existingCollections.length === 0) {
      const demoCollections = [
        {
          name: "AI Research Papers",
          description: "Curated collection of groundbreaking AI research papers and insights",
          userId: demoUsers[0].id
        },
        {
          name: "Startup Playbook",
          description: "Essential resources for building and scaling startups",
          userId: demoUsers[1].id
        },
        {
          name: "Psychology & Behavior",
          description: "Understanding human psychology and behavior change",
          userId: demoUsers[2].id
        },
        {
          name: "Web Development Resources",
          description: "Modern web development tutorials, tools, and best practices",
          userId: demoUsers[3].id
        },
        {
          name: "Philosophy Fundamentals",
          description: "Essential philosophical texts and modern interpretations",
          userId: demoUsers[2].id
        }
      ];

      const createdCollections = await db.insert(collections).values(demoCollections).returning();
      console.log("✓ Demo collections created");

      // Add some demo documents to collections
      const demoDocuments = [
        {
          name: "Attention Is All You Need.pdf",
          originalName: "attention-is-all-you-need.pdf",
          mimeType: "application/pdf",
          size: 2048576,
          content: "This paper introduces the Transformer architecture, which has become the foundation for modern language models...",
          collectionId: createdCollections[0].id,
          userId: demoUsers[0].id
        },
        {
          name: "The Lean Startup Methodology",
          originalName: "lean-startup-notes.md",
          mimeType: "text/markdown", 
          size: 51200,
          content: "# The Lean Startup\n\nKey principles:\n- Build-Measure-Learn feedback loop\n- Minimum Viable Product (MVP)\n- Validated learning\n- Innovation accounting...",
          collectionId: createdCollections[1].id,
          userId: demoUsers[1].id
        },
        {
          name: "Atomic Habits Summary",
          originalName: "atomic-habits-summary.txt",
          mimeType: "text/plain",
          size: 32768,
          content: "Atomic Habits by James Clear\n\nCore concepts:\n1. The compound effect of small habits\n2. The habit loop: cue, craving, response, reward\n3. The four laws of behavior change...",
          collectionId: createdCollections[2].id,
          userId: demoUsers[2].id
        },
        {
          name: "React Best Practices 2025",
          originalName: "react-best-practices.md", 
          mimeType: "text/markdown",
          size: 76800,
          content: "# React Best Practices for 2025\n\n## Component Architecture\n- Use functional components with hooks\n- Keep components small and focused\n- Implement proper error boundaries...",
          collectionId: createdCollections[3].id,
          userId: demoUsers[3].id
        }
      ];

      await db.insert(documents).values(demoDocuments);
      console.log("✓ Demo documents added to collections");
    } else {
      console.log("✓ Collections already exist");
    }

    console.log("Database seeding completed!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}