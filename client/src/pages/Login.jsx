import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CheckCircle, ArrowRight, Phone, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import supabase from '../lib/supabase';
import { useToast } from '../components/ToastNotification';

export default function Login() {
  const navigate = useNavigate();
  const { user, signInWithOtp, verifyOtp, demoMode } = useAuth();
  const { group, role, loading: groupLoading } = useGroup();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const [profileSetupStep, setProfileSetupStep] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileGender, setProfileGender] = useState('Male');

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  let toast = { addToast: () => {} };
  try { toast = useToast(); } catch (e) { /* toast not available */ }

  // Parse invite code from URL parameters and save to session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite') || params.get('code');
    if (code) {
      sessionStorage.setItem('samplebook_invite_code', code.toUpperCase());
    }
  }, []);

  // Redirect if already logged in (blocked during profile setup)
  useEffect(() => {
    if (user && !groupLoading && !profileSetupStep) {
      if (group) {
        navigate(role === 'admin' ? '/dashboard' : '/member', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, group, role, groupLoading, navigate, profileSetupStep]);

  // Fetch current user details if setup is active
  useEffect(() => {
    if (user && profileSetupStep) {
      if (demoMode) {
        setProfileName(user.user_metadata?.name || 'Demo User');
        setProfileGender('Male');
      } else {
        const fetchProfile = async () => {
          try {
            const { data, error: profileErr } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            if (data) {
              setProfileName(data.name && data.name !== 'Friend' ? data.name : '');
              try {
                const metadata = JSON.parse(data.avatar_url);
                setProfileGender(metadata?.gender || 'Male');
              } catch (e) {
                setProfileGender('Male');
              }
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        };
        fetchProfile();
      }
    }
  }, [user, profileSetupStep, demoMode]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    const fullPhone = '+91' + cleanPhone.replace(/^\+91/, '');
    const { error: otpError } = await signInWithOtp(fullPhone);

    if (otpError) {
      setError(otpError.message || 'Failed to send OTP. Please try again.');
    } else {
      setOtpSent(true);
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = digits[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs[nextIndex]?.current?.focus();

      // Auto-submit if all filled
      if (newOtp.every(d => d !== '')) {
        handleVerifyOtp(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs[index + 1]?.current?.focus();
    }

    // Auto-submit when 6th digit entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1]?.current?.focus();
    }
  };

  const handleVerifyOtp = useCallback(async (otpCode) => {
    setError('');
    setOtpVerifying(true);

    const cleanPhone = phone.replace(/\s/g, '');
    const fullPhone = '+91' + cleanPhone.replace(/^\+91/, '');

    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      setOtpVerifying(false);
      return;
    }

    const { data: verifyData, error: verifyError } = await verifyOtp(fullPhone, code);

    if (verifyError) {
      setError(verifyError.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs[0]?.current?.focus();
    } else {
      const loggedUser = verifyData?.user;
      if (loggedUser && !demoMode) {
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('name')
            .eq('id', loggedUser.id)
            .maybeSingle();

          if (dbUser && dbUser.name && dbUser.name !== 'Friend') {
            // User already exists and has a set profile name, skip profile setup!
            setProfileSetupStep(false);
          } else {
            setProfileSetupStep(true);
          }
        } catch (err) {
          console.error('Error checking user profile:', err);
          setProfileSetupStep(true);
        }
      } else {
        setProfileSetupStep(true);
      }
    }
    setOtpVerifying(false);
  }, [phone, otp, verifyOtp]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    if (demoMode) {
      const updatedDemoUser = {
        ...user,
        user_metadata: { ...user.user_metadata, name: profileName.trim() }
      };
      localStorage.setItem('samplebook_demo_user', JSON.stringify(updatedDemoUser));
      toast.addToast('Welcome to SampleBook!');
      setProfileSetupStep(false);
    } else {
      try {
        const { error: updateError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            phone: user.phone || user.user_metadata?.phone || '',
            name: profileName.trim(),
            avatar_url: JSON.stringify({ gender: profileGender })
          });

        if (updateError) {
          setError(updateError.message || 'Failed to update profile. Please try again.');
        } else {
          // Sync name to Supabase Auth metadata so future queries match
          await supabase.auth.updateUser({
            data: { name: profileName.trim() }
          }).catch(err => console.error('Error syncing auth metadata:', err));

          toast.addToast('Profile saved successfully! Welcome to SampleBook.');
          
          // Trigger welcome WhatsApp message through the bot!
          const getBackendUrl = () => {
            const envUrl = import.meta.env.VITE_APP_URL;
            if (envUrl && !envUrl.includes('5173')) {
              return envUrl;
            }
            const host = window.location.hostname;
            const protocol = window.location.protocol;
            return `${protocol}//${host}:3000`;
          };
          const backendUrl = getBackendUrl();
          fetch(`${backendUrl}/api/welcome-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone: user.phone || user.user_metadata?.phone, 
              name: profileName.trim() 
            })
          }).catch(err => console.error('Error triggering welcome message:', err));

          setProfileSetupStep(false);
        }
      } catch (err) {
        console.error('Error updating profile:', err);
        setError('Connection error. Please try again.');
      }
    }
    setLoading(false);
  };

  const features = [
    { text: 'Track expenses via WhatsApp messages' },
    { text: 'AI-powered receipt scanning' },
    { text: 'Real-time family & business dashboards' }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel — Brand */}
      <div className="relative lg:w-[40%] w-full bg-gradient-to-br from-[#1a6b47] via-[#15573b] to-[#0d4a2f] px-8 py-12 lg:py-0 lg:px-12 flex flex-col justify-center overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full bg-white/[0.04]"></div>
        <div className="absolute bottom-[-80px] left-[-40px] w-[260px] h-[260px] rounded-full bg-white/[0.03]"></div>
        <div className="absolute top-[40%] right-[10%] w-[100px] h-[100px] rounded-full bg-white/[0.05]"></div>
        <div className="absolute bottom-[20%] right-[30%] w-[60px] h-[60px] rounded-full bg-white/[0.04]"></div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white text-3xl lg:text-4xl font-extrabold tracking-tight">SampleBook</h1>
            </div>
          </div>

          <p className="text-white/70 text-lg italic mb-10 font-medium">
            &ldquo;Har rupaye ka hisaab&rdquo;
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 fade-in"
                style={{ animationDelay: `${i * 150}ms`, opacity: 0 }}
              >
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-white/90 text-[15px] font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Stats ribbon */}
          <div className="mt-12 flex gap-8">
            <div>
              <div className="text-white text-2xl font-bold">10K+</div>
              <div className="text-white/50 text-xs font-medium">Active Users</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-white text-2xl font-bold">₹2Cr+</div>
              <div className="text-white/50 text-xs font-medium">Tracked Monthly</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <div className="text-white text-2xl font-bold">4.8★</div>
              <div className="text-white/50 text-xs font-medium">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="lg:w-[60%] w-full bg-white flex items-center justify-center px-6 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">
          {/* Demo mode badge */}
          {demoMode && (
            <div className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-[10px]">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-amber-700 text-sm font-medium">Demo Mode — No real SMS will be sent</span>
            </div>
          )}

          {profileSetupStep ? (
            /* Profile Setup Step */
            <div className="fade-in">
              <h2 className="text-3xl font-bold text-ink mb-2">Set Up Your Profile</h2>
              <p className="text-ink-muted text-[15px] mb-8">
                Tell us a bit about yourself before we open your dashboard
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="E.g., Karan Sharma"
                    className="w-full px-4 py-3 text-sm border-2 border-border rounded-xl outline-none focus:border-green focus:ring-2 focus:ring-green-light transition-all bg-white font-semibold text-gray-900"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-2.5">
                    Gender
                  </label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map((genderOption) => (
                      <label
                        key={genderOption}
                        className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-350"
                      >
                        <input
                          type="radio"
                          name="profileGender"
                          value={genderOption}
                          checked={profileGender === genderOption}
                          onChange={() => setProfileGender(genderOption)}
                          className="w-4 h-4 text-green focus:ring-green border-border"
                        />
                        {genderOption}
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green hover:bg-[#15573b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : !otpSent ? (
            /* Phone Number Step */
            <div className="fade-in">
              <h2 className="text-3xl font-bold text-ink mb-2">Welcome back</h2>
              <p className="text-ink-muted text-[15px] mb-8">
                Enter your phone number to continue
              </p>

              <form onSubmit={handleSendOtp}>
                <label className="block text-sm font-semibold text-ink-soft mb-2">
                  Phone Number
                </label>
                <div className="flex items-center border-2 border-border rounded-xl overflow-hidden focus-within:border-green transition-colors bg-white">
                  <div className="flex items-center gap-1.5 px-4 py-3.5 bg-gray-50 border-r border-border">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-ink-soft font-semibold text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="flex-1 px-4 py-3.5 text-ink text-[16px] font-medium outline-none bg-transparent placeholder:text-ink-muted/50"
                    maxLength={10}
                    autoFocus
                  />
                  {phone.length === 10 && (
                    <div className="pr-3">
                      <CheckCircle className="w-5 h-5 text-green" />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={phone.length < 10 || loading}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green hover:bg-[#15573b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      <span>Get OTP</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-ink-muted text-xs leading-relaxed">
                New here? Your account is created automatically on first login.
              </p>

              {/* Trust badges */}
              <div className="mt-8 flex items-center justify-center gap-6 text-ink-muted/60">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">256-bit SSL</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-ink-muted/30"></div>
                <span className="text-xs font-medium">No spam, ever</span>
                <div className="w-1 h-1 rounded-full bg-ink-muted/30"></div>
                <span className="text-xs font-medium">Free forever</span>
              </div>
            </div>
          ) : (
            /* OTP Verification Step */
            <div className="fade-in">
              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
                className="mb-6 flex items-center gap-1 text-ink-muted text-sm font-medium hover:text-ink transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Change number</span>
              </button>

              <h2 className="text-3xl font-bold text-ink mb-2">Verify OTP</h2>
              <p className="text-ink-muted text-[15px] mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-ink font-semibold text-[15px] mb-8">
                +91 {phone.slice(0, 5)} {phone.slice(5)}
              </p>

              {/* OTP Input Boxes */}
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={index === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-14 text-center text-xl font-bold text-ink border-2 border-border rounded-xl outline-none focus:border-green focus:ring-2 focus:ring-green-light transition-all duration-150 bg-white"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                onClick={() => handleVerifyOtp()}
                disabled={otp.join('').length !== 6 || otpVerifying}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green hover:bg-[#15573b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {otpVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-ink-muted text-sm">
                  Didn&apos;t receive the code?{' '}
                  <button
                    onClick={handleSendOtp}
                    className="text-green font-semibold hover:underline"
                    type="button"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>

              {demoMode && (
                <div className="mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-700 text-sm font-medium text-center">
                    💡 Demo mode: Enter any 6 digits to login
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
