const logger = require('../utils/logger');
const fetch = require('node-fetch');

class GroqConfig {
    constructor() {
        this.apiKey = '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';
        this.baseUrl = 'https://api.groq.com/openai/v1';
        // this.model = 'deepseek-r1-distill-llama-70b';
                this.model = 'qwen/qwen3-32b';

        this.temperature = 0.1; // Deterministic generation
        this.maxTokens = 32768;
        this.retryAttempts = 3;
        this.retryDelay = 60000;
        
        if (!this.apiKey) {
            logger.warn('GROQ_API_KEY not found in environment variables');
        }
    }
    
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
        };
    }
    
    getRequestConfig() {
        return {
            model: this.model,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        };
    }
    
    async makeRequest(messages, options = {}) {
        const config = {
            ...this.getRequestConfig(),
            ...options,
            messages
        };
        
        // Track last API call time for rate limiting
        if (!this.lastApiCallTime) {
            this.lastApiCallTime = 0;
        }
        
        // Check if we need to wait for rate limit (30 seconds between calls)
        const RATE_LIMIT_DELAY = 30000; // 30 seconds
        const timeSinceLastCall = Date.now() - this.lastApiCallTime;
        
        if (timeSinceLastCall < RATE_LIMIT_DELAY) {
            const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;
            logger.info(`Rate limit: Waiting ${waitTime}ms before API call...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                logger.info(`Making Groq API request (attempt ${attempt}/${this.retryAttempts}) to ${this.baseUrl}/chat/completions`);
                logger.info(`Using model: ${this.model}`);
                
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(config)
                });
                
                // Update last API call time on successful request
                this.lastApiCallTime = Date.now();
                
                if (!response.ok) {
                    const error = await response.text();
                    logger.error(`Groq API error response: ${response.status} - ${error}`);
                    
                    // Check if it's a rate limit error
                    if (response.status === 429 || response.status === 503) {
                        logger.warn(`Rate limit detected (${response.status}), waiting 30 seconds before retry...`);
                        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                        this.lastApiCallTime = Date.now();
                        continue; // Retry the request
                    }
                    
                    throw new Error(`Groq API error: ${response.status} - ${error}`);
                }
                
                const data = await response.json();
                logger.info(`Groq API response received successfully`);
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid response structure from Groq API');
                }
                
                return data.choices[0].message.content;
            } catch (error) {
                logger.error(`Groq API request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
                
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                
                // For rate limit errors, wait 30 seconds
                if (error.message.includes('429') || error.message.includes('503') || error.message.includes('rate limit')) {
                    logger.warn('Rate limit error detected, waiting 30 seconds...');
                    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
                    this.lastApiCallTime = Date.now();
                } else {
                    // Exponential backoff for other errors
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1)));
                }
            }
        }
    }
}

module.exports = new GroqConfig();
