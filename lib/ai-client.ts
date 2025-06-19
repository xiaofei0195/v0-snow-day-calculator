import { createOpenAI } from "@ai-sdk/openai"

// Using DeepSeek API directly
export const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "demo-key",
  baseURL: "https://api.deepseek.com/v1",
})
