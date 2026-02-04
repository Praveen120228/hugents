import { createClient } from '@/lib/supabase/server'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/encryption'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type ApiKeyProvider = 'anthropic' | 'openai' | 'gemini' | 'openrouter'

export interface ApiKey {
    id: string
    user_id: string
    provider: ApiKeyProvider
    encrypted_key: string
    key_fingerprint: string
    is_active: boolean
    usage_limit: number
    usage_count: number
    created_at: string
    last_used: string | null
}

/**
 * Validate an API key by making a test request to the provider
 */
export async function validateApiKey(provider: ApiKeyProvider, apiKey: string): Promise<boolean> {
    try {
        switch (provider) {
            case 'anthropic': {
                const client = new Anthropic({ apiKey })
                // Make a minimal test request
                await client.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
                return true
            }
            case 'openai': {
                const client = new OpenAI({ apiKey })
                // Make a minimal test request
                await client.models.list()
                return true
            }
            case 'gemini': {
                // Use REST API for validation to avoid model-specific 404s
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`)
                return response.ok
            }
            case 'openrouter': {
                const client = new OpenAI({
                    apiKey,
                    baseURL: 'https://openrouter.ai/api/v1'
                })
                await client.models.list()
                return true
            }
            default:
                return false
        }
    } catch (error) {
        console.error('API key validation failed:', error)
        return false
    }
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
    userId: string,
    provider: ApiKeyProvider,
    apiKey: string
): Promise<ApiKey> {
    const supabase = await createClient()

    // Validate the API key first
    const isValid = await validateApiKey(provider, apiKey)
    if (!isValid) {
        throw new Error('Invalid API key for the selected provider')
    }

    // Encrypt the API key
    const { encrypted, fingerprint } = encryptApiKey(apiKey)

    // Store in database
    const { data, error } = await supabase
        .from('api_keys')
        .insert({
            user_id: userId,
            provider,
            encrypted_key: encrypted,
            key_fingerprint: fingerprint,
            is_active: true
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create API key: ${error.message}`)
    }

    return data as ApiKey
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`)
    }

    return (data || []) as ApiKey[]
}

/**
 * Get an active API key for a user and provider
 */
export async function getActiveApiKey(
    userId: string,
    provider: ApiKeyProvider
): Promise<ApiKey | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        return null
    }

    return data as ApiKey
}

/**
 * Get decrypted API key
 */
export async function getDecryptedApiKey(keyId: string): Promise<string> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('id', keyId)
        .single()

    if (error || !data) {
        throw new Error('API key not found')
    }

    return decryptApiKey(data.encrypted_key)
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)

    if (error) {
        throw new Error(`Failed to delete API key: ${error.message}`)
    }
}

/**
 * Update API key usage
 */
export async function updateApiKeyUsage(keyId: string): Promise<void> {
    const supabase = await createClient()

    // First get current usage count
    const { data: currentKey } = await supabase
        .from('api_keys')
        .select('usage_count')
        .eq('id', keyId)
        .single()

    const { error } = await supabase
        .from('api_keys')
        .update({
            usage_count: (currentKey?.usage_count || 0) + 1,
            last_used: new Date().toISOString()
        })
        .eq('id', keyId)

    if (error) {
        console.error('Failed to update API key usage:', error)
    }
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(keyId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)

    if (error) {
        throw new Error(`Failed to deactivate API key: ${error.message}`)
    }
}
