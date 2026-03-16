import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Category from "../models/Category.js";
import { CATEGORIES } from "../constants/categories.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
console.log('__filename', __filename);
const isSeedRunDirectly = process.argv[1] === __filename;
console.log('process.argv', process.argv  );

export const seedData = async () => {
  const categoriesCount = await Category.countDocuments();
 console.log('seedData');
  if (categoriesCount === 0) {
    await Category.insertMany(CATEGORIES);
  }

  const adminExists = await User.findOne({
    email: "admin@heyalberta.ca"
  });

  if (!adminExists) {
    await User.create({
      email: "admin@heyalberta.ca",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Admin",
      role: "admin"
    });

    await User.create({
      email: "dario.melappioni@gmail.com",
      passwordHash: await bcrypt.hash("123123", 10),
      name: "Vendor",
      role: "vendor"
    });

    await User.create({
      email: "amministrazionemfce@gmail.com",
      passwordHash: await bcrypt.hash("123123", 10),
      name: "User",
      role: "vendor"
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