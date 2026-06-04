import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Sun, Moon, HelpCircle, Mail, MessageSquare, Send, Check } from 'lucide-react';
import { useToast } from '../components/ToastNotification';

export default function Contact() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('samplebook_theme') || 'light');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  let toast = { addToast: () => {} };
  try { toast = useToast(); } catch (e) { /* toast hook optional */ }

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      try {
        toast.addToast('Please fill in all required fields.', 'error');
      } catch (err) {
        alert('Please fill in all required fields.');
      }
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      try {
        toast.addToast('📨 Support request submitted successfully! We will email you shortly.', 'success');
      } catch (err) {
        // Fallback if toast not active
      }
    }, 1500);
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
      <main className="max-w-4xl mx-auto px-6 pt-12 relative z-10">
        
        {/* Title */}
        <div className="flex flex-col gap-2 mb-10 border-b border-border/40 pb-6">
          <div className="flex items-center gap-2 text-green mb-1">
            <HelpCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Help desk</span>
          </div>
          <h1 className="text-3xl md:text-4.5xl font-extrabold text-ink">Contact Support</h1>
          <p className="text-ink-muted text-sm">Have billing questions or need bot configuration assistance? Drop us a line.</p>
        </div>

        {/* Contact Split Grid */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column info */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Box 1 */}
            <div className="glass-card p-6 rounded-2xl border border-border/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green/10 text-green flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="font-bold text-sm text-ink mb-0.5">Email Support</h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-1.5">For account deletions, manual settlements, or SaaS billing invoices.</p>
                <span className="text-xs font-semibold text-green select-all">support@samplebook.web.app</span>
              </div>
            </div>

            {/* Box 2 */}
            <div className="glass-card p-6 rounded-2xl border border-border/80 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green/10 text-green flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <h3 className="font-bold text-sm text-ink mb-0.5">WhatsApp Bot Help</h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-1.5">For parsing feedback or to verify active session commands.</p>
                <a href="https://wa.me/91811629883" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-green hover:underline">
                  Message bot support &rarr;
                </a>
              </div>
            </div>

          </div>

          {/* Right Column Form */}
          <div className="md:col-span-7">
            <div className="glass-card p-8 rounded-2xl border border-border/80 flex flex-col gap-6 text-left relative overflow-hidden">
              
              {submitted ? (
                // Success State View
                <div className="py-8 flex flex-col items-center justify-center text-center gap-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-green/15 text-green flex items-center justify-center shadow-inner">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-ink">Request Submitted!</h3>
                  <p className="text-ink-muted text-xs leading-relaxed max-w-sm">
                    Thank you for reaching out to SampleBook support. A copy of this ticket has been sent to your email. Our team will review your query and respond shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-semibold text-green hover:underline"
                  >
                    Send another query
                  </button>
                </div>
              ) : (
                // Contact Form View
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="name" className="text-xs font-semibold text-ink">Name <span className="text-red">*</span></label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="px-3.5 py-2 text-sm rounded-xl border border-border/80 bg-paper/50"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-ink">Email <span className="text-red">*</span></label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="px-3.5 py-2 text-sm rounded-xl border border-border/80 bg-paper/50"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subject" className="text-xs font-semibold text-ink">Subject</label>
                    <select
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="px-3.5 py-2 text-sm rounded-xl border border-border/80 bg-paper/50"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Billing Issue">Billing & Upgrades</option>
                      <option value="Bot Bug Report">WhatsApp Bot Bug</option>
                      <option value="Account Settings">Account Settings</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="message" className="text-xs font-semibold text-ink">Message <span className="text-red">*</span></label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type details of your request here..."
                      className="px-3.5 py-2 text-sm rounded-xl border border-border/80 bg-paper/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full py-3 bg-green hover:bg-green-mid disabled:bg-green/45 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green/10 hover:shadow-green/20 active:scale-98 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Sending Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Support Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
