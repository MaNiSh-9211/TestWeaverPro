const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.levels[process.env.LOG_LEVEL || 'INFO'];
        this.logDir = path.join(__dirname, '../../logs');
        this.logFile = path.join(this.logDir, 'testweaver.log');
        
        this.initializeLogDirectory();
    }
    
    initializeLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to initialize log directory:', error);
        }
    }
    
    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;
        
        const logEntry = {
            timestamp,
            level,
            pid,
            message,
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        };
        
        return JSON.stringify(logEntry);
    }
    
    writeToFile(formattedMessage) {
        try {
            fs.appendFileSync(this.logFile, formattedMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    
    writeToConsole(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const colorCode = this.getColorCode(level);
        const resetCode = '\x1b[0m';
        
        let consoleMessage = `${colorCode}[${timestamp}] ${level}: ${message}${resetCode}`;
        
        if (Object.keys(metadata).length > 0) {
            consoleMessage += `\n${colorCode}Metadata: ${JSON.stringify(metadata, null, 2)}${resetCode}`;
        }
        
        console.log(consoleMessage);
    }
    
    getColorCode(level) {
        const colors = {
            ERROR: '\x1b[31m', // Red
            WARN: '\x1b[33m',  // Yellow
            INFO: '\x1b[36m',  // Cyan
            DEBUG: '\x1b[37m'  // White
        };
        
        return colors[level] || '\x1b[37m';
    }
    
    // Enhanced colored logging for LLM interactions
    logLLMRequest(prompt, metadata = {}) {
        const cyan = '\x1b[36m';
        const yellow = '\x1b[33m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        
        console.log(`\n${cyan}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${cyan}${bold}║           🤖 LLM REQUEST - Sending to API                    ║${reset}`);
        console.log(`${cyan}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
        
        if (metadata.testcaseId) {
            console.log(`${yellow}📋 Testcase ID:${reset} ${metadata.testcaseId}`);
        }
        if (metadata.model) {
            console.log(`${yellow}🤖 Model:${reset} ${metadata.model}`);
        }
        
        console.log(`\n${cyan}${bold}📤 PROMPT SENT TO LLM:${reset}`);
        console.log(`${cyan}─────────────────────────────────────────────────────────${reset}`);
        
        // Try to format JSON if present in prompt
        let formattedPrompt = prompt;
        try {
            // Check if prompt contains JSON
            const jsonMatch = prompt.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1];
                const parsed = JSON.parse(jsonStr);
                const beautified = JSON.stringify(parsed, null, 2);
                formattedPrompt = prompt.replace(jsonMatch[0], `\`\`\`json\n${beautified}\n\`\`\``);
            }
        } catch (e) {
            // If JSON parsing fails, use original prompt
        }
        
        // Show complete prompt without truncation
        console.log(`${cyan}${formattedPrompt}${reset}`);
        console.log(`${cyan}─────────────────────────────────────────────────────────${reset}\n`);
        
        // Also log to file with full prompt
        this.log('INFO', 'LLM Request', { prompt, ...metadata });
    }
    
    logLLMResponse(response, metadata = {}) {
        const green = '\x1b[32m';
        const yellow = '\x1b[33m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        
        console.log(`\n${green}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${green}${bold}║           ✅ LLM RESPONSE - Received from API                 ║${reset}`);
        console.log(`${green}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
        
        if (metadata.responseTime) {
            console.log(`${yellow}⏱️  Response Time:${reset} ${metadata.responseTime}ms`);
        }
        
        console.log(`\n${green}${bold}📥 RAW RESPONSE FROM LLM:${reset}`);
        console.log(`${green}─────────────────────────────────────────────────────────${reset}`);
        
        // Try to extract and beautify JSON from response
        let formattedResponse = response;
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*```/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1];
                const parsed = JSON.parse(jsonStr);
                const beautified = JSON.stringify(parsed, null, 2);
                formattedResponse = response.replace(jsonMatch[0], `\`\`\`json\n${beautified}\n\`\`\``);
            } else {
                // Try parsing entire response as JSON
                const parsed = JSON.parse(response);
                formattedResponse = JSON.stringify(parsed, null, 2);
            }
        } catch (e) {
            // If JSON parsing fails, use original response
        }
        
        // Show complete response without truncation
        console.log(`${green}${formattedResponse}${reset}`);
        console.log(`${green}─────────────────────────────────────────────────────────${reset}\n`);
        
        // Also log to file with full response
        this.log('INFO', 'LLM Response', { response, ...metadata });
    }
    
    logTestcaseValidation(testcase, selectors, isValid) {
        const blue = '\x1b[34m';
        const green = '\x1b[32m';
        const red = '\x1b[31m';
        const yellow = '\x1b[33m';
        const cyan = '\x1b[36m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        
        const statusColor = isValid ? green : red;
        const statusIcon = isValid ? '✅' : '❌';
        
        console.log(`\n${blue}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${blue}${bold}║           🧪 TESTCASE VALIDATION                              ║${reset}`);
        console.log(`${blue}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
        
        console.log(`${yellow}📋 Testcase ID:${reset} ${testcase.id || 'N/A'}`);
        console.log(`${yellow}📝 Description:${reset} ${testcase.description || 'N/A'}`);
        console.log(`${yellow}🔢 Selectors Generated:${reset} ${selectors?.length || 0}`);
        
        console.log(`\n${statusColor}${bold}${statusIcon} VALIDATION RESULT: ${isValid ? 'VALID' : 'INVALID'}${reset}\n`);
        
        if (selectors && selectors.length > 0) {
            console.log(`${blue}${bold}📌 GENERATED SELECTORS (BEAUTIFIED JSON):${reset}`);
            console.log(`${cyan}─────────────────────────────────────────────────────────${reset}`);
            
            // Print beautified JSON for all selectors
            try {
                const beautified = JSON.stringify(selectors, null, 2);
                console.log(`${cyan}${beautified}${reset}`);
            } catch (e) {
                // Fallback to individual printing
                selectors.forEach((selector, index) => {
                    console.log(`\n${yellow}  Selector ${index + 1}/3:${reset}`);
                    try {
                        const beautified = JSON.stringify(selector, null, 2);
                        console.log(`${cyan}${beautified}${reset}`);
                    } catch (e2) {
                        console.log(`    ${blue}Element:${reset} ${selector.element || 'N/A'}`);
                        console.log(`    ${blue}Selector:${reset} ${selector.selector || 'N/A'}`);
                        console.log(`    ${blue}Type:${reset} ${selector.interaction_type || 'N/A'}`);
                        if (selector.confidence) {
                            console.log(`    ${blue}Confidence:${reset} ${(selector.confidence * 100).toFixed(1)}%`);
                        }
                        if (selector.reasoning) {
                            console.log(`    ${blue}Reasoning:${reset} ${selector.reasoning}`);
                        }
                    }
                });
            }
            
            console.log(`${cyan}─────────────────────────────────────────────────────────${reset}\n`);
        }
        
        this.log('INFO', 'Testcase Validation', { 
            testcaseId: testcase.id, 
            isValid, 
            selectorCount: selectors?.length || 0 
        });
    }
    
    logSelectorExecution(selector, testcaseId, attempt, success, error = null) {
        const cyan = '\x1b[36m';
        const green = '\x1b[32m';
        const red = '\x1b[31m';
        const yellow = '\x1b[33m';
        const reset = '\x1b[0m';
        
        const statusColor = success ? green : red;
        const statusIcon = success ? '✅' : '❌';
        
        // Only show detailed log if not successful (to reduce noise)
        if (!success) {
            console.log(`\n${cyan}╔════════════════════════════════════════════════════════════════╗${reset}`);
            console.log(`${cyan}║           🎯 SELECTOR EXECUTION ATTEMPT                        ║${reset}`);
            console.log(`${cyan}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
            
            console.log(`${yellow}📋 Testcase:${reset} ${testcaseId}`);
            console.log(`${yellow}🔢 Attempt:${reset} ${attempt}/3`);
            console.log(`${yellow}🎯 Selector:${reset} ${selector.selector || selector}`);
            console.log(`${yellow}📝 Element:${reset} ${selector.element || 'N/A'}`);
            console.log(`${yellow}⚡ Action:${reset} ${selector.interaction_type || 'N/A'}`);
            
            console.log(`\n${statusColor}${statusIcon} RESULT: FAILED${reset}`);
            
            if (error) {
                console.log(`${red}❌ Error:${reset} ${error.message || error}`);
            }
            
            console.log(`${cyan}─────────────────────────────────────────────────────────${reset}\n`);
        }
        
        this.log(success ? 'INFO' : 'ERROR', 'Selector Execution', {
            testcaseId,
            attempt,
            selector: selector.selector || selector,
            success,
            error: error?.message
        });
    }
    
    // Log testcase completion status in real-time (yellow color)
    logTestcaseStatus(testcaseNumber, totalTestcases, testcaseId, status, selector = null, error = null) {
        const yellow = '\x1b[33m';
        const green = '\x1b[32m';
        const red = '\x1b[31m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        
        const statusColor = status === 'passed' ? green : red;
        const statusIcon = status === 'passed' ? '✅' : '❌';
        const statusText = status === 'passed' ? 'PASSED' : 'FAILED';
        
        console.log(`\n${yellow}${bold}╔════════════════════════════════════════════════════════════════╗${reset}`);
        console.log(`${yellow}${bold}║                    🧪 TESTCASE STATUS                         ║${reset}`);
        console.log(`${yellow}${bold}╚════════════════════════════════════════════════════════════════╝${reset}\n`);
        
        console.log(`${yellow}📋 Testcase:${reset} ${testcaseNumber}/${totalTestcases} - ${testcaseId}`);
        console.log(`${statusColor}${statusIcon} Status: ${statusText}${reset}`);
        
        if (status === 'passed' && selector) {
            console.log(`${green}✅ Successful Selector:${reset} ${selector}`);
        } else if (status === 'failed' && error) {
            console.log(`${red}❌ Error:${reset} ${error}`);
        }
        
        console.log(`${yellow}─────────────────────────────────────────────────────────${reset}\n`);
        
        this.log(status === 'passed' ? 'INFO' : 'ERROR', 'Testcase Status', {
            testcaseNumber,
            totalTestcases,
            testcaseId,
            status,
            selector,
            error: error?.message || error
        });
    }
    
    log(level, message, metadata = {}) {
        if (this.levels[level] <= this.currentLevel) {
            const formattedMessage = this.formatMessage(level, message, metadata);
            
            // Write to console
            this.writeToConsole(level, message, metadata);
            
            // Write to file
            this.writeToFile(formattedMessage);
        }
    }
    
    error(message, metadata = {}) {
        this.log('ERROR', message, metadata);
    }
    
    warn(message, metadata = {}) {
        this.log('WARN', message, metadata);
    }
    
    info(message, metadata = {}) {
        this.log('INFO', message, metadata);
    }
    
    debug(message, metadata = {}) {
        this.log('DEBUG', message, metadata);
    }
    
    // Utility methods for structured logging
    logRequest(req, res, next) {
        const startTime = Date.now();
        
        this.info('Request received', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.id || this.generateRequestId()
        });
        
        const originalSend = res.send;
        res.send = function(body) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            logger.info('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                responseSize: body ? body.length : 0
            });
            
            return originalSend.call(this, body);
        };
        
        if (next) next();
    }
    
    logError(error, context = {}) {
        this.error('Error occurred', {
            message: error.message,
            stack: error.stack,
            context
        });
    }
    
    logPerformance(operation, duration, metadata = {}) {
        this.info('Performance metric', {
            operation,
            duration: `${duration}ms`,
            ...metadata
        });
    }
    
    logDatabaseOperation(operation, query, duration, metadata = {}) {
        this.debug('Database operation', {
            operation,
            query,
            duration: `${duration}ms`,
            ...metadata
        });
    }
    
    logExternalAPI(url, method, statusCode, duration, metadata = {}) {
        this.info('External API call', {
            url,
            method,
            statusCode,
            duration: `${duration}ms`,
            ...metadata
        });
    }
    
    logTestExecution(testId, action, metadata = {}) {
        this.info('Test execution', {
            testId,
            action,
            ...metadata
        });
    }
    
    logWorkflowStep(testId, step, status, metadata = {}) {
        this.info('Workflow step', {
            testId,
            step,
            status,
            ...metadata
        });
    }
    
    generateRequestId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    // Log file management
    rotateLogs() {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const archivedLogFile = path.join(this.logDir, `testweaver-${timestamp}.log`);
            
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, archivedLogFile);
            }
            
            this.info('Log file rotated', { archivedFile: archivedLogFile });
        } catch (error) {
            this.error('Failed to rotate log file', { error: error.message });
        }
    }
    
    clearOldLogs(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const logFiles = fs.readdirSync(this.logDir);
            let deletedCount = 0;
            
            logFiles.forEach(file => {
                const filePath = path.join(this.logDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < cutoffDate && file.endsWith('.log')) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            });
            
            this.info('Old logs cleared', { deletedCount });
        } catch (error) {
            this.error('Failed to clear old logs', { error: error.message });
        }
    }
    
    getLogLevel() {
        return Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
    }
    
    setLogLevel(level) {
        if (this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
            this.info('Log level changed', { newLevel: level });
        } else {
            this.warn('Invalid log level', { level });
        }
    }
    
    // Health check for logging system
    healthCheck() {
        try {
            const testMessage = 'Logger health check';
            this.info(testMessage);
            
            // Check if log file is writable
            const testLogFile = path.join(this.logDir, 'test.log');
            fs.writeFileSync(testLogFile, testMessage);
            fs.unlinkSync(testLogFile);
            
            return {
                status: 'healthy',
                logDir: this.logDir,
                logFile: this.logFile,
                currentLevel: this.getLogLevel()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
