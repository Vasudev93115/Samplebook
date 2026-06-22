# SampleBook PRD

## Product Overview
SampleBook is a WhatsApp-integrated AI-powered expense tracking SaaS. Users send text messages, voice notes, or receipt photos to a WhatsApp bot which automatically parses and logs expenses into a real-time dashboard.

## Target Users
- Individuals tracking personal finances
- Families sharing expenses
- Small businesses tracking team spending

## Core Features

### 1. WhatsApp-Based Expense Entry
- Send text like "Groceries 450 bigbasket" to log an expense
- Send voice notes for hands-free logging
- Send receipt photos for AI-powered OCR parsing
- Bot auto-categorizes and timestamps entries

### 2. Authentication
- Phone number + OTP login (Supabase)
- Demo mode for trial without real number
- Invite code system for joining groups

### 3. Admin Dashboard (/dashboard)
- Protected route (requires auth)
- Summary cards: Cash-In, Cash-Out, Net Balance, Highest Spender
- Spending trend line chart (monthly)
- Category breakdown donut chart
- Member list with spending progress bars
- Expense table with filter and search
- Group management panel

### 4. Member Dashboard (/member)
- Protected route (requires auth)
- Personal expense summary
- Group ledger view
- Add expense form

### 5. Onboarding (/onboarding)
- Protected route
- Create new group OR join via invite code

### 6. Pricing Plans
- Free: ₹0, 2 members, 50 entries/month, basic features
- Pro: ₹199/month, 6 members, unlimited entries
- Enterprise: ₹399/month, 12 members, AI OCR, priority support

### 7. Static Pages
- Privacy Policy (/privacy)
- Terms of Service (/terms)
- Contact Support (/contact)

### 8. Theme System
- Dark/light mode toggle
- Persisted in localStorage key: samplebook_theme

## User Flows

### New User Flow
1. Visit landing page (/)
2. Click "Get Started" → redirected to /login
3. Enter phone number → receive OTP
4. Enter OTP → profile setup (name + gender)
5. Redirected to /onboarding
6. Create or join a group
7. Redirected to /dashboard or /member

### Returning User Flow
1. Visit any page
2. Auto-redirected to /login if unauthenticated
3. Login → redirected to appropriate dashboard

### Auth Guard
- Unauthenticated access to /dashboard, /member, /onboarding redirects to /login

## Technical Stack
- Frontend: React 18, Vite, TailwindCSS
- Auth & DB: Supabase
- Hosting: Firebase
- Charts: Recharts
- Icons: Lucide React
