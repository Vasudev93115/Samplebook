import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Sun, Moon, Shield, Lock, Eye, Server } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('samplebook_theme') || 'light');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('samplebook_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-500 selection:bg-green/20 relative overflow-x-hidden pb-12">
      {/* Decorative glows */}
      <div className="glow-blob bg-green w-[30vw] h-[30vw] -left-[10vw] top-[5vh] opacity-10" />
      <div className="glow-blob bg-emerald-500 w-[30vw] h-[30vw] -right-[10vw] bottom-[10vh] opacity-10" />

      {/* ==========================================
         STICKY HEADER
         ========================================== */}
      <header className="sticky top-0 left-0 right-0 z-50 glass-card border-b border-border/30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-green flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">SampleBook</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/60 text-ink-muted hover:text-green hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/"
              className="px-4 py-2 border border-border hover:bg-emerald-50/20 dark:hover:bg-zinc-800/20 text-ink font-medium rounded-xl transition-all text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==========================================
         CONTENT CONTAINER
         ========================================== */}
      <main className="max-w-3xl mx-auto px-6 pt-12 relative z-10">
        
        {/* Page Title */}
        <div className="flex flex-col gap-2 mb-10 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2 text-green mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Legal documents</span>
          </div>
          <h1 className="text-3xl md:text-4.5xl font-extrabold text-ink">Privacy Policy</h1>
          <p className="text-ink-muted text-xs">Last updated: June 4, 2026</p>
        </div>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-8 text-left leading-relaxed text-ink-soft">
          
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              1. Introduction
            </h2>
            <p className="text-sm">
              At SampleBook, we are committed to protecting your privacy. This Privacy Policy details how we collect, store, process, and protect your personal and financial transaction data when you use the SampleBook WhatsApp tracking bot and dashboard interface.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              2. Information We Collect
            </h2>
            <p className="text-sm">
              We collect information that you explicitly submit to the WhatsApp chatbot or configure in the web dashboard. This includes:
            </p>
            <ul className="list-disc list-inside pl-4 text-xs flex flex-col gap-2">
              <li><strong className="text-ink">Phone Numbers</strong>: Captured automatically when you message our WhatsApp bot. Used as your primary identifier for logins and session authentications via OTP.</li>
              <li><strong className="text-ink">Chat Messages & Transaction Details</strong>: Text inputs (e.g., "150 petrol") sent to the bot, which are processed by our NLP parser.</li>
              <li><strong className="text-ink">Audio Voice Messages</strong>: Voice notes uploaded for transcription to extract expense parameters.</li>
              <li><strong className="text-ink">Receipt Images</strong>: Invoices, bills, or receipt uploads scanned via OCR parsing.</li>
              <li><strong className="text-ink">Group Configurations</strong>: Member names, emails, avatars, and custom split terms configured in the dashboard.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              3. Processing and Data Storage
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 my-2">
              <div className="glass-card p-4 rounded-xl border border-border/80 flex items-start gap-3">
                <Lock className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-ink mb-1">Encrypted Database</h4>
                  <p className="text-xxs text-ink-muted leading-relaxed">All ledger entries and user profiles are secured inside databases with restricted access layers.</p>
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl border border-border/80 flex items-start gap-3">
                <Server className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-ink mb-1">Safe Webhooks</h4>
                  <p className="text-xxs text-ink-muted leading-relaxed">WhatsApp messaging endpoints and file uploads pass securely through authorized endpoint channels.</p>
                </div>
              </div>
            </div>
            <p className="text-sm">
              We use advanced AI NLP models (like OpenAI and Gemini APIs) to transcribe voice notes and parse receipt data. These API requests do not persist data for model training purposes.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              4. Data Retention & Deletion
            </h2>
            <p className="text-sm">
              Your financial records are kept for as long as your account remains active. You maintain absolute ownership of your ledger. You can request a copy of your records or permanently delete your account, groups, and transaction ledger histories at any time through the Settings panel in the Admin Dashboard.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              5. Communications
            </h2>
            <p className="text-sm">
              We will only message you on WhatsApp to deliver ledger confirmations, split alert notifications, or invoice reminders that you have configured. We will never sell your details or send unsolicited marketing advertisements.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              6. Contact Support
            </h2>
            <p className="text-sm">
              For any questions regarding this Privacy Policy or your data protection rights, please navigate to our <Link to="/contact" className="text-green hover:underline">Contact Support</Link> page, or email us directly at <span className="font-semibold text-green">support@samplebook.web.app</span>.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
