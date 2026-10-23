import { browserbase } from "@browserbasehq/stagehand";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) throw new Error("BROWSERBASE_API_KEY is missing");
const response = await browserbase.fetch({
  apiKey,
  url: "https://www.amazon.com/Reusch-Attrakt-Freegel-Infinity-Goalkeeper/dp/B0DS3YCL4Z",
  format: "markdown",
});
console.log(response.content.slice(0, 6000));
