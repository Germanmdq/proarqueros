import { browserbase, Stagehand } from "@browserbasehq/stagehand";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) throw new Error("BROWSERBASE_API_KEY is missing");

const browser = await browserbase.launch({ apiKey });
try {
  const stagehand = await Stagehand.create({ browser });
  try {
    const [page] = await browser.context.pages();
    await page.goto("https://www.amazon.com/s?k=Reusch+Attrakt+Freegel+Infinity", { waitUntil: "domcontentloaded" });
    const content = await page.content();
    const matches = [...content.matchAll(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+>/g)];
    console.log(JSON.stringify({ amazonResultImageTags: matches.length, pageLength: content.length }));
  } finally {
    await stagehand.close();
  }
} finally {
  await browser.close();
}
