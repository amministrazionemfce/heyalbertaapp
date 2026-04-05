import NewsSubscriber from "../models/NewsSubscriber.js";
import { sendMarketingBatch } from "./mail.js";

/**
 * Email all news subscribers when a new article is published (admin POST /resources).
 */
export async function notifyNewsSubscribersForArticle(article) {
  const title = String(article?.title || "").trim() || "New article";
  const excerpt = String(article?.excerpt || "").trim().slice(0, 400);
  const link = String(article?.linkUrl || "").trim();
  const front = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const readUrl = /^https?:\/\//i.test(link) ? link : `${front}/news`;

  let subs = [];
  try {
    subs = await NewsSubscriber.find({}).select("email").lean();
  } catch (e) {
    console.error("notifyNewsSubscribersForArticle: list subscribers", e?.message || e);
    return { sent: 0, skipped: true };
  }

  const emails = [...new Set(subs.map((s) => String(s.email || "").trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) return { sent: 0, skipped: false };

  const subject = `New on Hey Alberta: ${title}`;
  const text = [
    "Hi,",
    "",
    `We just published: ${title}`,
    excerpt ? `\n${excerpt}\n` : "",
    `Read more: ${readUrl}`,
    "",
    "— Hey Alberta",
  ].join("\n");

  try {
    const r = await sendMarketingBatch({ to: emails, subject, text });
    return { sent: r.sent, failed: r.failed };
  } catch (e) {
    console.error("notifyNewsSubscribersForArticle: send", e?.message || e);
    return { sent: 0, error: true };
  }
}
