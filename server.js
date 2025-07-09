const express = require('express');
const cors = require('cors');
const path = require('path');
// const { connectDB } = require('./src/config/database');
// const testRoutes = require('./src/routes/testRoutes');
// const logger = require('./src/utils/logger');

// Set the GROQ API key
process.env.GROQ_API_KEY = "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";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for report viewing
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Routes
// app.use('/api/tests', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'TestWeaver AI Test Automation System'
    });
});

// Jira webhook simulation endpoint
app.post('/webhook/jira', (req, res) => {
    console.log('Received Jira webhook:', req.body);
    
    // Extract user story from webhook payload
    const userStory = req.body.issue?.fields?.summary || req.body.userStory;
    
    if (!userStory) {
        return res.status(400).json({ error: 'User story not found in webhook payload' });
    }
    
    // Trigger test generation and execution
    // const testController = require('./src/controllers/testController');
    // testController.handleJiraWebhook(req, res);
    res.json({ success: true, message: 'Webhook received', userStory });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Start server
async function startServer() {
    try {
        // await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`TestWeaver server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/health`);
            // console.log(`API endpoints: http://localhost:${PORT}/api/tests`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();
