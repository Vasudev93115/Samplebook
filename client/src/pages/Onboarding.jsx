import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Users, Wallet, ArrowRight, Check, Copy, MessageCircle, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { currencySymbol } from '../lib/formatCurrency';

const GROUP_TYPES = [
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'business', label: 'Business', icon: '💼' }
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { group, role, loading: groupLoading, createGroup, joinGroup } = useGroup();

  // Redirect if already has a group
  useEffect(() => {
    if (group && !groupLoading) {
      navigate(role === 'admin' ? '/dashboard' : '/member', { replace: true });
    }
  }, [group, role, groupLoading, navigate]);

  const [activeCard, setActiveCard] = useState(null); // 'create' | 'join' | null
  const [step, setStep] = useState('choice'); // 'choice' | 'form' | 'success'

  // Create form state
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('family');
  const [currency, setCurrency] = useState('INR');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdGroup, setCreatedGroup] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Join form state
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinedGroup, setJoinedGroup] = useState(null);

  // Auto-fill invite code from session storage if available
  useEffect(() => {
    const savedCode = sessionStorage.getItem('samplebook_invite_code');
    if (savedCode) {
      setActiveCard('join');
      setStep('form');
      setInviteCode(savedCode);
      // Remove it so it doesn't trigger again on reload
      sessionStorage.removeItem('samplebook_invite_code');
    }
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setCreateError('Please enter a group name');
      return;
    }
    setCreateError('');
    setCreateLoading(true);

    const { data, error } = await createGroup(groupName.trim(), groupType, currency);

    if (error) {
      setCreateError(error.message || 'Failed to create group');
    } else {
      setCreatedGroup(data);
      setStep('success');
    }
    setCreateLoading(false);
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (code.length < 4) {
      setJoinError('Please enter a valid invite code');
      return;
    }
    setJoinError('');
    setJoinLoading(true);

    const { data, error } = await joinGroup(code);

    if (error) {
      setJoinError(error.message || 'Failed to join group');
    } else {
      setJoinedGroup(data);
      setStep('success');
    }
    setJoinLoading(false);
  };

  const copyInviteCode = () => {
    if (createdGroup?.invite_code) {
      navigator.clipboard.writeText(createdGroup.invite_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (createdGroup) {
      const dashboardLink = `https://samplebook-b2c8b.web.app/?invite=${createdGroup.invite_code}`;
      const text = `🎉 Join my SampleBook group "*${createdGroup.name}*"!\n\n` +
        `📋 *Invite Code:* ${createdGroup.invite_code}\n\n` +
        `👉 *Click here to join:*\n${dashboardLink}\n\n` +
        `Track expenses effortlessly via WhatsApp 💰`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const goToDashboard = () => {
    if (activeCard === 'create') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/member', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-950 border-b border-border dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-green-light flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green" />
          </div>
          <span className="text-lg font-bold text-ink dark:text-white">SampleBook</span>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-white font-medium transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[760px]">
          {/* Heading */}
          <div className="text-center mb-10 fade-in">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-ink dark:text-white mb-3">
              Let&apos;s get you set up
            </h1>
            <p className="text-ink-muted dark:text-slate-400 text-[15px] max-w-md mx-auto">
              Create a new group or join an existing one to start tracking expenses
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* CREATE GROUP CARD */}
            <div
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                activeCard === 'join' ? 'opacity-40 pointer-events-none scale-[0.97]' : ''
              }`}
            >
              {activeCard !== 'create' ? (
                /* Choice View */
                <div className="bg-gradient-to-br from-[#1a6b47] via-[#1d7a50] to-[#0d4a2f] p-7 rounded-2xl h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 border border-white/20">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Create a Group</h3>
                  <p className="text-white/70 text-sm mb-6 flex-1">
                    For family heads and business owners who want to track expenses
                  </p>
                  <button
                    onClick={() => { setActiveCard('create'); setStep('form'); }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-green font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span>Create Group</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : step === 'form' ? (
                /* Create Form */
                <div className="bg-white dark:bg-slate-900 border-2 border-green/20 p-7 rounded-2xl fade-in">
                  <button
                    onClick={() => { setActiveCard(null); setStep('choice'); setCreateError(''); }}
                    className="mb-4 flex items-center gap-1 text-ink-muted dark:text-slate-400 text-sm font-medium hover:text-ink dark:hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                  </button>

                  <h3 className="text-xl font-bold text-ink dark:text-white mb-5">Create your group</h3>

                  <form onSubmit={handleCreateGroup} className="space-y-5">
                    {/* Group Name */}
                    <div>
                      <label className="block text-sm font-semibold text-ink-soft dark:text-slate-300 mb-1.5">Group Name</label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Sharma Family"
                        className="w-full px-4 py-3 border-2 border-border dark:border-slate-700 rounded-xl text-ink dark:text-white font-medium outline-none focus:border-green transition-colors placeholder:text-ink-muted/50 dark:bg-slate-900"
                        autoFocus
                      />
                    </div>

                    {/* Group Type Toggle */}
                    <div>
                      <label className="block text-sm font-semibold text-ink-soft dark:text-slate-300 mb-1.5">Group Type</label>
                      <div className="flex gap-2">
                        {GROUP_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setGroupType(t.value)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                              groupType === t.value
                                ? 'border-green bg-green-light text-green'
                                : 'border-border text-ink-muted hover:border-ink-muted/30'
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency Dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-ink-soft dark:text-slate-300 mb-1.5">Currency</label>
                      <button
                        type="button"
                        onClick={() => setCurrencyOpen(!currencyOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-border dark:border-slate-700 rounded-xl text-ink dark:text-white font-medium hover:border-ink-muted/30 transition-colors dark:bg-slate-900"
                      >
                        <span>
                          {currencySymbol[currency] || currency} — {CURRENCIES.find(c => c.code === currency)?.label}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {currencyOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                          {CURRENCIES.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                                currency === c.code ? 'bg-green-light text-green' : 'text-ink dark:text-slate-300'
                              }`}
                            >
                              <span className="text-base w-8 text-center font-semibold">{c.symbol}</span>
                              <span>{c.label}</span>
                              {currency === c.code && <Check className="w-4 h-4 ml-auto text-green" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {createError && (
                      <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-medium">{createError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={createLoading || !groupName.trim()}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-green hover:bg-[#15573b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200"
                    >
                      {createLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5" />
                          <span>Create Group</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Create Success */
                <div className="bg-white dark:bg-slate-900 border-2 border-green/20 p-7 rounded-2xl text-center fade-in">
                  {/* Success animation */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-light flex items-center justify-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-ink dark:text-white mb-1">Group created! 🎉</h3>
                  <p className="text-ink-muted dark:text-slate-400 text-sm mb-6">Share this invite code with your members</p>

                  {/* Invite Code */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-light rounded-xl mb-4">
                    <span className="text-2xl font-extrabold text-green tracking-[0.2em] font-mono">
                      {createdGroup?.invite_code}
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-green/20"
                    >
                      {codeCopied ? (
                        <Check className="w-4 h-4 text-green" />
                      ) : (
                        <Copy className="w-4 h-4 text-green" />
                      )}
                    </button>
                  </div>

                  {codeCopied && (
                    <p className="text-green text-xs font-medium mb-4">Copied to clipboard!</p>
                  )}

                  {/* Share on WhatsApp */}
                  <button
                    onClick={shareOnWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-xl transition-colors mb-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    onClick={goToDashboard}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green hover:bg-[#15573b] text-white font-semibold rounded-xl transition-colors"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* JOIN GROUP CARD */}
            <div
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                activeCard === 'create' ? 'opacity-40 pointer-events-none scale-[0.97]' : ''
              }`}
            >
              {activeCard !== 'join' ? (
                /* Choice View */
                <div className="bg-white dark:bg-slate-900 border-2 border-green/20 p-7 rounded-2xl h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl bg-green-light flex items-center justify-center mb-5">
                    <Users className="w-7 h-7 text-green" />
                  </div>
                  <h3 className="text-ink dark:text-white text-xl font-bold mb-2">Join a Group</h3>
                  <p className="text-ink-muted dark:text-slate-400 text-sm mb-6 flex-1">
                    Enter the invite code shared by your family head or business admin
                  </p>
                  <button
                    onClick={() => { setActiveCard('join'); setStep('form'); }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 border-2 border-green text-green font-semibold rounded-xl hover:bg-green-light transition-colors"
                  >
                    <span>Join with Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : step === 'form' ? (
                /* Join Form */
                <div className="bg-white dark:bg-slate-900 border-2 border-green/20 p-7 rounded-2xl fade-in">
                  <button
                    onClick={() => { setActiveCard(null); setStep('choice'); setJoinError(''); }}
                    className="mb-4 flex items-center gap-1 text-ink-muted dark:text-slate-400 text-sm font-medium hover:text-ink dark:hover:text-white transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span>Back</span>
                  </button>

                  <h3 className="text-xl font-bold text-ink dark:text-white mb-5">Enter invite code</h3>

                  <form onSubmit={handleJoinGroup} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-ink-soft dark:text-slate-300 mb-1.5">Invite Code</label>
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                        placeholder="e.g. ABC123"
                        className="w-full px-4 py-3 border-2 border-border dark:border-slate-700 rounded-xl text-ink dark:text-white font-bold text-lg tracking-[0.15em] text-center outline-none focus:border-green transition-colors placeholder:text-ink-muted/50 placeholder:font-medium placeholder:text-base placeholder:tracking-normal uppercase font-mono dark:bg-slate-900"
                        maxLength={8}
                        autoFocus
                      />
                    </div>

                    {joinError && (
                      <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-medium">{joinError}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={joinLoading || inviteCode.length < 4}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-green hover:bg-[#15573b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200"
                    >
                      {joinLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          <span>Join Group</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* Join Success */
                <div className="bg-white dark:bg-slate-900 border-2 border-green/20 p-7 rounded-2xl text-center fade-in">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-light flex items-center justify-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-ink dark:text-white mb-1">You&apos;re in! 🎉</h3>
                  <p className="text-ink-muted dark:text-slate-400 text-sm mb-6">
                    Welcome to <span className="font-semibold text-ink dark:text-white">{joinedGroup?.name || 'the group'}</span>
                  </p>

                  <button
                    onClick={goToDashboard}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green hover:bg-[#15573b] text-white font-semibold rounded-xl transition-colors"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-ink-muted dark:text-slate-500 text-xs mt-8">
            You can always change your group settings later from the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
