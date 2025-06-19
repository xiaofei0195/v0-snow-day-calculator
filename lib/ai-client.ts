import { createOpenAI } from "@ai-sdk/openai"

// Using DeepInfra integration for DeepSeek models
export const deepinfra = createOpenAI({
  apiKey: process.env.DEEPINFRA_API_KEY || "demo-key",
  baseURL: "https://api.deepinfra.com/v1/openai",
})
