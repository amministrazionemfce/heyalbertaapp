import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactBody(body) {
  const inquiryType = body?.inquiryType === "business" ? "business" : "newcomer";
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const businessName = String(body?.businessName ?? "").trim();
  const businessAddress = String(body?.businessAddress ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (!subject) return { error: "Subject is required." };
  if (!message) return { error: "Message is required." };

  if (inquiryType === "business") {
    if (!businessName) return { error: "Business name is required." };
    if (!businessAddress) return { error: "Business address is required." };
  }

  return {
    value: {
      inquiryType,
      name,
      email,
      subject,
      message,
      businessName: inquiryType === "business" ? businessName : "",
      businessAddress: inquiryType === "business" ? businessAddress : "",
    },
  };
}

/**
 * Public: submit contact form (no auth).
 */
router.post("/", async (req, res) => {
  try {
    const parsed = validateContactBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    const doc = await ContactMessage.create(parsed.value);
    res.status(201).json({
      ok: true,
      id: doc._id.toString(),
      message: "Thanks — we received your message.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to save message." });
  }
});

export default router;
