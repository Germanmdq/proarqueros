import { browserbase } from "@browserbasehq/stagehand";

const apiKey = process.env.BROWSERBASE_API_KEY;
if (!apiKey) throw new Error("BROWSERBASE_API_KEY is missing");
const response = await browserbase.search({
  apiKey,
  query: "site:amazon.com Reusch Attrakt Freegel Infinity goalkeeper gloves",
  numResults: 5,
});
console.log(JSON.stringify(response.results));
