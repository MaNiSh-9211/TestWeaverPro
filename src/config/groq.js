const logger = require('../utils/logger');

class GroqConfig {
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1';
        this.model = 'mixtral-8x7b-32768';
        this.temperature = 0.1; // Deterministic generation
        this.maxTokens = 32768;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        
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
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(config)
                });
                
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Groq API error: ${response.status} - ${error}`);
                }
                
                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid response structure from Groq API');
                }
                
                return data.choices[0].message.content;
            } catch (error) {
                logger.error(`Groq API request failed (attempt ${attempt}/${this.retryAttempts}):`, error);
                
                if (attempt === this.retryAttempts) {
                    throw error;
                }
                
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1)));
            }
        }
    }
}

module.exports = new GroqConfig();
