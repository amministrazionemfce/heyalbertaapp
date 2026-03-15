import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seedData } from "./utils/seed.js";

const PORT = process.env.PORT || 8000;

const start = async () => {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();