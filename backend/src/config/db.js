import mongoose from "mongoose";

/**
 * A unique index on field `id` is invalid here: `id` is a Mongoose virtual
 * (alias for `_id`), not a stored field. MongoDB treats missing `id` as null,
 * so only one document can exist — every further insert throws E11000 dup key
 * { id: null }. Drop any index on `id` if present (legacy / mistaken migration).
 */
async function dropBadVirtualIdIndexes(collectionName) {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const coll = db.collection(collectionName);
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      const key = idx.key || {};
      if (Object.prototype.hasOwnProperty.call(key, "id")) {
        await coll.dropIndex(idx.name);
        console.log(
          `Dropped invalid ${collectionName} index "${idx.name}" (field "id" is virtual; use _id only)`
        );
      }
    }
    await coll.updateMany({ id: { $exists: true } }, { $unset: { id: "" } });
  } catch (e) {
    const msg = String(e.message || e);
    if (e.code === 27 || e.codeName === "IndexNotFound" || /ns not found|collection not found/i.test(msg)) {
      return;
    }
    console.warn(`dropBadVirtualIdIndexes(${collectionName}):`, msg);
  }
}

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
    await dropBadVirtualIdIndexes("resources");
    await dropBadVirtualIdIndexes("reviews");
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};