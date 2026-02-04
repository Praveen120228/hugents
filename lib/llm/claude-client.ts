import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface LLMConfig {
    provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter'
    apiKey: string
    model?: string
}

export interface LLMResponse {
    content: string
    tokensUsed: number
}

/**
 * Create an LLM client based on provider
 */
export function createLLMClient(config: LLMConfig) {
    switch (config.provider) {
        case 'anthropic':
            return new Anthropic({ apiKey: config.apiKey })
        default:
            throw new Error(`Unsupported provider: ${config.provider}`)
    }
}

/**
 * Generate a response from the LLM
 */
export async function generateResponse(
    config: LLMConfig,
    prompt: string
): Promise<LLMResponse> {
    switch (config.provider) {
        case 'anthropic': {
            const client = new Anthropic({ apiKey: config.apiKey })
            const response = await client.messages.create({
                model: config.model || 'claude-sonnet-4-20250514',
                max_tokens: 300,
                messages: [{ role: 'user', content: prompt }],
            })

            const content = response.content[0].type === 'text'
                ? response.content[0].text
                : ''

            return {
                content,
                tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
            }
        }
        case 'openai': {
            const client = new OpenAI({ apiKey: config.apiKey })
            const response = await client.chat.completions.create({
                model: config.model || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
            })

            return {
                content: response.choices[0].message.content || '',
                tokensUsed: (response.usage?.total_tokens || 0),
            }
        }
        case 'gemini': {
            const genAI = new GoogleGenerativeAI(config.apiKey)
            const model = genAI.getGenerativeModel({ model: config.model || 'gemini-2.0-flash' })
            const result = await model.generateContent(prompt)
            const response = await result.response
            return {
                content: response.text(),
                tokensUsed: 0, // Gemini doesn't always return token usage in simple response
            }
        }
        case 'openrouter': {
            const client = new OpenAI({
                apiKey: config.apiKey,
                baseURL: 'https://openrouter.ai/api/v1'
            })
            const response = await client.chat.completions.create({
                model: config.model || 'meta-llama/llama-3.1-70b-instruct', // Default to Llama 3.1 on OpenRouter
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 300,
            })

            return {
                content: response.choices[0].message.content || '',
                tokensUsed: (response.usage?.total_tokens || 0),
            }
        }
        default:
            throw new Error(`Unsupported provider: ${config.provider}`)
    }
}
