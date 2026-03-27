# TestWeaver - AI Test Automation System

A complete AI-powered test automation system with a stunning glassmorphism frontend and robust backend API.

## 🚀 Quick Start

### Option 1: Single Command (Recommended)
```bash
npm run dev
```

### Option 2: Windows Batch File
```bash
start.bat
```

### Option 3: Linux/Mac Shell Script
```bash
chmod +x start.sh
./start.sh
```

### Option 4: Manual Start
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## ✨ Features

### Frontend
- 🎨 **Stunning Glassmorphism UI** - Premium dark theme with glass effects
- 🔐 **JWT Authentication** - Complete auth system with login/register
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Real-time Validation** - Form validation with instant feedback
- 🎭 **Smooth Animations** - Framer Motion powered transitions
- 🧪 **Test Form** - User-friendly test creation interface

### Backend
- 🤖 **AI-Powered Testing** - Groq LLM integration for intelligent test generation
- 🌐 **Browser Automation** - Playwright for real browser testing
- 📊 **HTML Reports** - Comprehensive test reports with screenshots
- 🔄 **LangGraph Workflow** - State-based test execution
- 📝 **API Endpoints** - RESTful API for all operations
- 🔒 **Mock Authentication** - Ready for production auth integration

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Framer Motion
- React Hook Form + Zod
- Axios
- React Router

### Backend
- Node.js + Express
- Playwright
- LangGraph
- Groq LLM
- JSDOM
- Zod Validation

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Test Management
- `POST /api/tests/execute` - Execute test
- `GET /api/tests/:testId` - Get test results
- `GET /api/tests/:testId/report/html` - View HTML report
- `GET /api/tests` - List all tests

## 🎯 Usage

1. **Start the application** using any of the methods above
2. **Open** http://localhost:3000 in your browser
3. **Register/Login** to access the dashboard
4. **Create a test** by entering:
   - Target URL (e.g., https://example.com)
   - User story (e.g., "As a user I want to login with username: test@example.com and password: 123456")
5. **Execute the test** and view results
6. **View detailed reports** with screenshots and step-by-step execution

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
npm start
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend
npm start
```

## 📁 Project Structure

```
TestWeaver-Pro/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/          # Page components
│   │   └── main.jsx        # Entry point
│   └── package.json
├── src/                     # Backend source
│   ├── services/           # Core services
│   ├── controllers/        # API controllers
│   ├── models/            # Data models
│   └── utils/             # Utilities
├── server.js              # Main server file
├── package.json           # Backend dependencies
└── README.md             # This file
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change ports in `vite.config.js` (frontend) or `server.js` (backend)

2. **Playwright browser not found**
   - Run: `npx playwright install chromium`

3. **CSS build errors**
   - Ensure Tailwind CSS is properly configured

4. **API connection issues**
   - Check that backend is running on port 5000
   - Verify CORS settings in `server.js`

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**TestWeaver** - The future of test automation is here! 🚀
