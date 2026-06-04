import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Sun, Moon, Scale, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react';

export default function Terms() {
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
            <Scale className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Legal agreements</span>
          </div>
          <h1 className="text-3xl md:text-4.5xl font-extrabold text-ink">Terms of Service</h1>
          <p className="text-ink-muted text-xs">Last updated: June 4, 2026</p>
        </div>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-8 text-left leading-relaxed text-ink-soft">
          
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              1. Acceptance of Terms
            </h2>
            <p className="text-sm">
              By registering an account with SampleBook, sending messages to the SampleBook WhatsApp bot, or using our dashboard features, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please discontinue using the service immediately.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              2. Description of SaaS Service
            </h2>
            <p className="text-sm">
              SampleBook is a Software-as-a-Service (SaaS) platform that translates natural conversational messages, voice inputs, and image documents sent via WhatsApp into structured financial ledger logs. The parsed metrics are displayed dynamically inside our secure web dashboard.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              3. Subscription Plans & Billing Conditions
            </h2>
            <p className="text-sm">
              The service is billed on a subscription basis under three plans:
            </p>
            <div className="flex flex-col gap-4 my-2">
              
              {/* Free details */}
              <div className="glass-card p-5 rounded-xl border border-border/80 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-ink mb-1">Starter Free Plan (₹0 / month)</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Provides personal finance tracking and access to exactly **1 group ledger with up to 2 members** (e.g., you and a partner). Includes **50 free parsed messages per month** and basic AI categorizations.
                  </p>
                </div>
              </div>

              {/* Pro details */}
              <div className="glass-card p-5 rounded-xl border border-border/80 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-ink mb-1">Premium Pro Plan (₹199 / month)</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Supports exactly **1 group ledger with up to 6 members** (e.g., roommates or close family) at one active subscription. Includes **unlimited expense entries**, advanced AI models, and real-time settle-up charts.
                  </p>
                </div>
              </div>

              {/* Enterprise details */}
              <div className="glass-card p-5 rounded-xl border-2 border-green/60 flex gap-3 shadow-md">
                <CheckCircle className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-ink mb-1">Enterprise Plan (₹399 / month)</h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Supports ledger groups containing **up to 12 members** (e.g., small business staff, flatmates, clubs). Includes **unlimited entries**, receipt OCR uploads, custom split equations, monthly PDF statement emails, and priority 24/7 support.
                  </p>
                </div>
              </div>

            </div>
            <p className="text-sm">
              All paid subscriptions auto-renew monthly until cancelled. Subscriptions can be cancelled at any time under the dashboard settings, and your account will remain active until the end of the current billing cycle.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              4. WhatsApp API Fair Usage & Anti-Abuse Policies
            </h2>
            <p className="text-sm">
              We leverage official/approved API channels to power the SampleBook bot. To protect system load:
            </p>
            <ul className="list-disc list-inside pl-4 text-xs flex flex-col gap-1.5">
              <li>You may not use automated scripts or scraper bots to spam the WhatsApp receiver.</li>
              <li>You may not submit graphic, illicit, or malicious data payloads inside chat messages.</li>
              <li>We enforce a temporary rate limit on OTP login codes to secure accounts against force attacks.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              5. Account Suspension
            </h2>
            <p className="text-sm">
              SampleBook reserves the right to temporarily suspend or permanently terminate access to paid or free accounts that violate fair usage terms or fail to settle billing dues.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              6. Limitation of Liability
            </h2>
            <p className="text-sm">
              While our AI parser achieves over 99% accuracy, SampleBook does not verify bank statements or execute payments. We are not responsible for split balance miscalculations or financial actions made based on the ledger charts. Ledger balances are provided for tracking reference only.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green rounded-full" />
              7. Contact Support
            </h2>
            <p className="text-sm">
              For any questions regarding billing disputes or terms of service clarification, please visit the <Link to="/contact" className="text-green hover:underline">Contact Support</Link> form, or write to us at <span className="font-semibold text-green">support@samplebook.web.app</span>.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
