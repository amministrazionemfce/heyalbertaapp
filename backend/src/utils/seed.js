import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import { CATEGORIES } from "../constants/categories.js";
import User from "../models/User.js";
import Listing from "../models/Listing.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const backendRoot = path.join(path.dirname(__filename), "..", "..");

// Match app.js: backend/.env then .local.env (Stripe, MONGO_URL, etc.)
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".local.env"), override: true });
const isSeedRunDirectly = process.argv[1] === __filename;

/** Cover URLs for seed listings (https only; matches frontend slugs). */
const DEMO_IMAGE_BY_SLUG = {
  "real-estate": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  "moving-services": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80",
  "home-services": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
  insurance: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  "banking-financial": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  "legal-services": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  healthcare: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  education: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
  childcare: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
  "pet-services": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  automotive: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80",
  "utilities-telecom": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  employment: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80",
  immigration: "https://images.unsplash.com/photo-1529243856184-fd5465488984?w=800&q=80",
  recreation: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  shopping: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
};

const DEMO_SELLER_EMAIL = "seed-seller@heyalberta.ca";
const DEMO_CITIES = ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat"];

const defaultDemoImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

export const seedData = async () => {
  const categoriesCount = await Category.countDocuments();
  if (categoriesCount === 0) {
    await Category.insertMany(CATEGORIES);
  }

  const adminExists = await User.findOne({
    email: "admin@heyalberta.ca",
  });

  if (!adminExists) {
    await User.create({
      email: "admin@heyalberta.ca",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Admin",
      role: "admin",
    });

    await User.create({
      email: "dario.melappioni@gmail.com",
      passwordHash: await bcrypt.hash("123123", 10),
      name: "Vendor",
      role: "vendor",
    });

    await User.create({
      email: "amministrazionemfce@gmail.com",
      passwordHash: await bcrypt.hash("123123", 10),
      name: "User",
      role: "vendor",
    });
  }

  let demoSeller = await User.findOne({ email: DEMO_SELLER_EMAIL });
  if (!demoSeller) {
    demoSeller = await User.create({
      email: DEMO_SELLER_EMAIL,
      passwordHash: await bcrypt.hash("demo123", 10),
      name: "Demo Seller",
      role: "vendor",
    });
  }

  const sellerId = demoSeller._id.toString();

  let cityIdx = 0;
  for (const cat of CATEGORIES) {
    const slug = cat.slug;
    const existing = await Listing.findOne({ categoryId: slug });
    if (existing) continue;

    const image = DEMO_IMAGE_BY_SLUG[slug] || defaultDemoImage;
    const city = DEMO_CITIES[cityIdx % DEMO_CITIES.length];
    cityIdx += 1;

    await Listing.create({
      userId: sellerId,
      categoryId: slug,
      title: `Demo — ${cat.name}`,
      description: `Sample ${cat.name} listing for Alberta (seed data). Replace with your own business details.`,
      status: "published",
      sellerStatus: "approved",
      featured: false,
      tier: "free",
      images: [image],
      city,
      neighborhood: "",
      phone: "(403) 555-0100",
      email: DEMO_SELLER_EMAIL,
      website: "https://heyalberta.ca",
    });
  }
};

const run = async () => {
  try {
    await connectDB();
    await seedData();
    console.log("Seed completed successfully.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Only run seed CLI when this file is executed directly (e.g. npm run seed),
// not when imported by server.js (which calls seedData() itself and must keep running).
if (isSeedRunDirectly) {
  run();
}
