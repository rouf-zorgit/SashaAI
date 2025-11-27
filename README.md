# SashaAI - Financial AI Assistant

> An intelligent financial companion powered by AI, helping you manage expenses, track goals, and make smarter financial decisions.

[![Deployment](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://sasha-staging.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)](https://supabase.com/)

---

## 🌟 Features

- **💬 AI Chat Assistant** - Conversational AI powered by Claude 3.5 Sonnet
- **📊 Expense Tracking** - Smart transaction categorization and analysis
- **🎯 Goal Management** - Set and track financial goals with AI insights
- **⏰ Smart Reminders** - Never miss important financial tasks
- **📈 Analytics Dashboard** - Visualize spending patterns and trends
- **🔄 Undo Functionality** - Easily reverse AI actions
- **🧠 Long-term Memory** - AI remembers your preferences and context
- **🔒 Secure Authentication** - Powered by Supabase Auth

---

## 🚀 Tech Stack

### Frontend
- **React 19.2** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Recharts** - Data visualization

### Backend
- **Supabase** - Database, Auth, and Edge Functions
- **PostgreSQL** - Relational database
- **Edge Functions** - Serverless API endpoints

### AI & APIs
- **Anthropic Claude 3.5 Sonnet** - Conversational AI
- **Gemini Pro** - Additional AI capabilities

### Deployment
- **Vercel** - Frontend hosting and auto-deployment
- **GitHub** - Version control and CI/CD

---

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Anthropic API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rouf-zorgit/SashaAI.git
   cd SashaAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Development Workflow

We use a streamlined workflow: **Antigravity → GitHub → Vercel → Supabase**

### Quick Deploy Cycle

1. **Code** in Antigravity (with AI assistance)
2. **Save** files (Ctrl+S)
3. **Commit** via GitHub Desktop
4. **Push** to `master` branch
5. **Wait** 30-60 seconds for Vercel auto-deployment
6. **Test** on staging URL

📚 **Detailed Guide:** See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)  
⚡ **Quick Reference:** See [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run deploy:staging   # Deploy to staging (PowerShell)
```

---

## 📁 Project Structure

```
SashaAI/
├── .agent/                    # Antigravity workflows
│   └── workflows/
│       └── deploy-to-staging.md
├── docs/                      # Documentation
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── QUICK_REFERENCE.md
├── src/                       # Frontend source code
│   ├── components/           # React components
│   ├── pages/                # Page components
│   ├── lib/                  # Utilities and configs
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript types
├── supabase/                  # Backend code
│   ├── functions/            # Edge Functions
│   │   ├── processChat/      # Fast AI chat processing
│   │   └── processChatDeep/  # Deep learning & memory
│   ├── migrations/           # Database migrations
│   └── utilities/            # SQL utilities
├── public/                    # Static assets
├── scripts/                   # Deployment scripts
└── [config files]            # Various config files
```

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `vite.config.ts` | Vite build configuration |
| `tailwind.config.js` | TailwindCSS configuration |
| `vercel.json` | Vercel deployment config |
| `.env.example` | Environment variables template |

---

## 🌐 Deployment

### Staging Environment

- **Platform:** Vercel
- **URL:** Check Vercel dashboard
- **Auto-deploy:** Enabled on `master` branch
- **Build command:** `npm run build`
- **Output directory:** `dist`

### Environment Variables (Vercel)

Set these in Vercel dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ANTHROPIC_API_KEY
```

### Supabase Edge Functions

Deploy functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy processChat
```

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build test (verify no errors)
npm run build

# Preview production build
npm run preview
```

---

## 📝 Key Features Explained

### AI Chat System

- **Fast Mode** (2-5s): Quick responses with LTM injection
- **Deep Mode** (10-40s): Background learning and pattern recognition
- **Hybrid Architecture**: Balances speed and intelligence

### Memory System

- **Short-term Memory (STM)**: Recent conversation context
- **Long-term Memory (LTM)**: User preferences, patterns, and history
- **Episodic Memory**: Specific events and interactions

### Transaction Brain

- Intelligent expense categorization
- Duplicate detection
- Recurring payment identification
- Smart confirmation workflows

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👥 Team

- **rouf-zorgit** - Lead Developer
- **claude** - AI Assistant

---

## 🔗 Links

- **GitHub Repository:** [rouf-zorgit/SashaAI](https://github.com/rouf-zorgit/SashaAI)
- **Staging URL:** [Check Vercel Dashboard](https://vercel.com/dashboard)
- **Supabase Dashboard:** [supabase.com/dashboard](https://supabase.com/dashboard)

---

## 📞 Support

For issues or questions:
1. Check [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
2. Review [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)
3. Open an issue on GitHub

---

**Built with ❤️ using Antigravity AI**
