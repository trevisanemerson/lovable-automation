import { drizzle } from "drizzle-orm/mysql2";
import { creditPlans } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const plans = [
  {
    name: "Iniciante",
    description: "Perfeito para começar",
    credits: 10,
    price: "29.90",
    priceInCents: 2990,
    isActive: true,
    displayOrder: 1,
  },
  {
    name: "Profissional",
    description: "Mais popular",
    credits: 50,
    price: "129.90",
    priceInCents: 12990,
    isActive: true,
    displayOrder: 2,
  },
  {
    name: "Empresarial",
    description: "Para grandes volumes",
    credits: 500,
    price: "999.90",
    priceInCents: 99990,
    isActive: true,
    displayOrder: 3,
  },
];

async function seedPlans() {
  try {
    console.log("🌱 Seeding credit plans...");
    
    for (const plan of plans) {
      await db.insert(creditPlans).values(plan);
      console.log(`✅ Created plan: ${plan.name}`);
    }
    
    console.log("✨ All plans seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
    process.exit(1);
  }
}

seedPlans();
