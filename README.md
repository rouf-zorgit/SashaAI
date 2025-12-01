# FinAI - MVP

AI-powered personal finance tracker built with Next.js 15, Supabase, and Claude 3.5 Sonnet.

## 🚀 Features

- **Smart Chat Interface**: Talk to Sasha (AI) to track expenses naturally
- **Transaction Extraction**: Automatically detects and logs transactions from chat
- **Profile Hub**: Central dashboard for financial overview
- **Goals Tracking**: Set and track financial goals
- **Reports**: Monthly and yearly financial insights
- **Reminders**: Bill tracking and notifications
- **History**: Searchable transaction history and notifications
- **Secure**: Row Level Security (RLS) and server-side API protection

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude 3.5 Sonnet
- **State Management**: Zustand

## 🏃‍♂️ Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔒 Security

- API keys are protected in `.env.local`
- Claude API calls are server-side only
- Database access is secured via RLS policies

## 📱 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── custom/       # App-specific components
│   ├── ui/           # Shadcn UI components
│   └── ...
├── lib/              # Utilities and helpers
│   ├── db/           # Database helpers
│   ├── queries/      # Supabase queries
│   └── supabase/     # Supabase client setup
├── store/            # Zustand stores
└── types/            # TypeScript definitions
```
