import Category from "../models/Category.js";       
import { CATEGORIES } from "../constants/categories.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const seedData = async () => {

  const categoriesCount = await Category.countDocuments();

  if (categoriesCount === 0) {
    await Category.insertMany(CATEGORIES);
  }

  const adminExists = await User.findOne({
    email: "admin@heyalberta.ca"
  });

  if (!adminExists) {
    await User.create({
      email: "admin@heyalberta.ca",
      passwordHash: await bcrypt.hash("admin", 10),
      name: "Admin",
      role: "admin"
    });

    await User.create({
      email: "dario.melappio@gmail.com",
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

seedData();