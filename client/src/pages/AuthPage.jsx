import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Shield,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Building2,
  User,
  Mail,
  RefreshCw,
  Send,
  Sparkles
} from 'lucide-react';
import {
  isSupabaseConfigured,
  sendEmailOtp,
  verifyEmailOtp
} from '../supabase';

export default function AuthPage() {
  const { t, signIn, showToast } = useApp();
  const navigate = useNavigate();

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  // Auth Method: 'email_otp' | 'password'
  const [authMethod, setAuthMethod] = useState('password');
  const [role, setRole] = useState('customer'); // 'customer' | 'gov_admin'

  // Standard Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Bengaluru',
    govDesignation: '',
    password: ''
  });

  // OTP State
  const [otpStep, setOtpStep] = useState(1); // 1: Enter email/phone, 2: Enter 6-digit OTP
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [displayOtp, setDisplayOtp] = useState('');

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Email OTP Send
  const handleSendEmailOtp = async () => {
    setError('');
    setSuccessMsg('');
    setDisplayOtp('');

    if (!form.email || !form.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          role: role === 'gov_admin' ? 'admin' : 'customer',
          city: form.city
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send Email OTP');

      if (data.devOtp) {
        setDisplayOtp(data.devOtp);
        setOtpCode(data.devOtp); // Auto-populate for seamless immediate verification
      }

      setOtpStep(2);
      setCooldown(60);
      setSuccessMsg(data.devOtp 
        ? `Your 6-digit OTP code is: ${data.devOtp} (valid for 10 minutes).` 
        : `6-digit OTP code dispatched to ${form.email}! Please enter it below.`);
      showToast('OTP generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to send Email OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email OTP Verify
  const handleVerifyEmailOtp = async () => {
    setError('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      let authenticated = false;

      // 1. Attempt Supabase verify if configured
      if (isSupabaseConfigured) {
        try {
          const data = await verifyEmailOtp(form.email, otpCode.trim());
          if (data?.session) {
            authenticated = true;
            const u = data.session.user;
            const appUser = {
              id: u.id,
              name: u.user_metadata?.full_name || form.name.trim() || u.email.split('@')[0],
              email: u.email,
              phone: u.phone || form.phone,
              role: u.user_metadata?.role || (role === 'gov_admin' ? 'admin' : 'customer'),
              city: u.user_metadata?.city || form.city,
              isEmailVerified: true
            };
            signIn(appUser, data.session.access_token);
            showToast('Authenticated via Supabase Email OTP!');
            navigate(appUser.role === 'admin' ? '/admin' : '/profile');
            return;
          }
        } catch (sbErr) {
          // Fall through to dedicated server verification
        }
      }

      // 2. Direct server OTP verification
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: otpCode.trim(),
          name: form.name,
          role: role === 'gov_admin' ? 'admin' : 'customer'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid or expired OTP code');

      signIn(data.user, data.token);
      showToast('Authenticated successfully with Email OTP!');
      navigate(data.user.role === 'admin' ? '/admin' : '/profile');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Mobile OTP Send (+91)
  // Handle Traditional Password Sign In or Sign Up
  const handlePasswordSubmit = async () => {
    setError('');
    setSuccessMsg('');

    if (!form.email || !form.password) {
      setError('Please provide both email address and password.');
      return;
    }

    if (mode === 'signup') {
      if (!form.name.trim()) {
        setError('Full legal or official name is required.');
        return;
      }
    }

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        // 1. First attempt Supabase sign in if configured
        let supabaseSuccess = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
              email: form.email.trim(),
              password: form.password
            });
            if (!sbError && sbData?.session) {
              supabaseSuccess = true;
              const u = sbData.session.user;
              const isAdmin = u.user_metadata?.role === 'admin' || 
                ['admin@pravasa.ai', 'veerrr0505@gmail.com', 'sveeresh.in@gmail.com', 'sveerrr0505@gmail.com'].includes(u.email?.toLowerCase());

              const appUser = {
                id: u.id,
                name: u.user_metadata?.full_name || u.email.split('@')[0],
                email: u.email,
                phone: u.phone || form.phone,
                role: isAdmin ? 'admin' : (u.user_metadata?.role || 'customer'),
                city: u.user_metadata?.city || form.city,
                isEmailVerified: Boolean(u.email_confirmed_at)
              };
              signIn(appUser, sbData.session.access_token);
              showToast(`Signed in successfully via Supabase as ${appUser.role === 'admin' ? 'Gov Tourism Admin' : 'Traveller'}.`);
              navigate(appUser.role === 'admin' ? '/admin' : '/profile');
              return;
            } else if (sbError && sbError.message.includes('Email not confirmed')) {
              setError('Email verification required. Please click the confirmation link sent to your email inbox, or sign in using your admin credentials.');
              return;
            }
          } catch (sbEx) {
            // Fallback to server auth
          }
        }

        // 2. Local / Server DB Authentication fallback
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to authenticate');

        signIn(data.user, data.token);
        showToast(`Signed in successfully as ${data.user.role === 'admin' ? 'Gov Tourism Admin' : 'Traveller'}.`);
        navigate(data.user.role === 'admin' ? '/admin' : '/profile');
      } else {
        // Sign Up with Supabase
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: sbData, error: sbError } = await supabase.auth.signUp({
              email: form.email.trim(),
              password: form.password,
              options: {
                data: {
                  full_name: form.name.trim(),
                  role: role === 'gov_admin' ? 'admin' : 'customer',
                  city: form.city || 'Bengaluru',
                  govDesignation: role === 'gov_admin' ? (form.govDesignation || 'Dept of Tourism Official') : null
                }
              }
            });
            if (sbError) {
              if (sbError.message.includes('already registered')) {
                throw new Error('An account with this email already exists in Supabase. Please sign in.');
              }
            } else if (sbData?.user && !sbData?.session) {
              setSuccessMsg(`Verification email sent to ${form.email}! Please check your email inbox and click the confirmation link to complete registration.`);
              showToast('Verification email sent to your inbox!');
              return;
            }
          } catch (sbEx) {
            if (sbEx.message && sbEx.message.includes('already exists')) {
              throw sbEx;
            }
          }
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            city: form.city,
            password: form.password,
            role: role === 'gov_admin' ? 'admin' : 'customer',
            govDesignation: role === 'gov_admin' ? (form.govDesignation || 'Dept of Tourism Official') : null
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        signIn(data.user, data.token);
        showToast('Registered and saved successfully!');
        navigate(data.user.role === 'admin' ? '/admin' : '/profile');
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  // Request Reset Code
  const handleRequestResetCode = async () => {
    setError('');
    setSuccessMsg('');
    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not find account');

      setResetCode(data.resetCode);
      setResetStep(2);
      setSuccessMsg(`Reset code generated for ${data.userRole === 'admin' ? 'Gov Admin' : 'Customer'}.`);
      showToast('Reset code ready!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Both the 6-digit reset code and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          resetCode,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      setSuccessMsg('Password updated! You can now sign in.');
      showToast('Password reset complete!');
      setForm(f => ({ ...f, email: resetEmail, password: newPassword }));
      setMode('signin');
      setAuthMethod('password');
      setResetStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ background: '#ffffff', borderRadius: 12, padding: '36px 32px', width: '100%', maxWidth: 500, border: '1px solid #e2e2e0', boxShadow: '0 12px 40px rgba(0,0,0,0.07)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: '#1a5c4c',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 22,
              margin: '0 auto 12px',
              boxShadow: '0 4px 12px rgba(26,92,76,0.3)'
            }}
          >
            P
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', margin: '0 0 6px', fontSize: '1.5rem', color: '#1c1c1c' }}>
            {mode === 'signin' && 'Sign In to Pravasa AI'}
            {mode === 'signup' && 'Create Pravasa Account'}
            {mode === 'forgot' && 'Password Recovery'}
          </h2>
          <div style={{ fontSize: '0.84rem', color: '#6b7280' }}>
            {mode === 'signin' && 'Access curated journeys, saved destinations, and official tourism portal'}
            {mode === 'signup' && 'Real-time database integration with Pravasa AI'}
            {mode === 'forgot' && 'Instant password recovery for travellers and government officers'}
          </div>
        </div>

        {/* Supabase Status Banner */}
        <div style={{ background: isSupabaseConfigured ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isSupabaseConfigured ? '#bbf7d0' : '#fef08a'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 18, fontSize: '0.78rem', color: isSupabaseConfigured ? '#15803d' : '#854d0e', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} className={isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'} />
          <span>
            {isSupabaseConfigured 
              ? '⚡ Supabase Central Backend Connected (OTP & PostgreSQL Live)' 
              : 'ℹ️ Supabase credentials pending in .env. Password auth active.'}
          </span>
        </div>

        {/* Mode Tabs */}
        <div style={{ display: 'flex', background: '#f4f4f2', borderRadius: 8, padding: 3, marginBottom: 18 }}>
          {[
            { id: 'signin', label: 'Sign In' },
            { id: 'signup', label: 'Create Account' },
            { id: 'forgot', label: 'Reset Password' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setOtpStep(1);
                setError('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: 'none',
                background: mode === m.id ? '#ffffff' : 'transparent',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                color: mode === m.id ? '#1a5c4c' : '#5a5a5a',
                boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Auth Method Selector for Sign In & Sign Up */}
        {(mode === 'signin' || mode === 'signup') && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[
              { id: 'email_otp', label: '📧 Email OTP (Supabase)', disabled: !isSupabaseConfigured },
              { id: 'password', label: '🔑 Password / Admin', disabled: false }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                disabled={m.disabled}
                onClick={() => {
                  setAuthMethod(m.id);
                  setOtpStep(1);
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '9px 8px',
                  borderRadius: 6,
                  border: authMethod === m.id ? '1.5px solid #1a5c4c' : '1px solid #e5e7eb',
                  background: authMethod === m.id ? '#e8f5f0' : (m.disabled ? '#f9fafb' : '#ffffff'),
                  color: authMethod === m.id ? '#1a5c4c' : (m.disabled ? '#9ca3af' : '#4b5563'),
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: m.disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION 1: EMAIL OTP (PASSWORDLESS VIA SUPABASE) */}
        {/* ======================================================== */}
        {(mode === 'signin' || mode === 'signup') && authMethod === 'email_otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && otpStep === 1 && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Anand Gowda"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type="email"
                  disabled={otpStep === 2}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%', paddingLeft: 34 }}
                />
                <Mail size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              </div>
            </div>

            {otpStep === 2 && (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Enter 6-Digit Email OTP *
                </label>

                {displayOtp && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 600 }}>Your Verification Code:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: 6, color: '#00473F', margin: '4px 0' }}>{displayOtp}</div>
                    <div style={{ fontSize: '0.72rem', color: '#047857' }}>Valid for 10 minutes. Automatically populated below.</div>
                  </div>
                )}

                <input
                  className="input"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ width: '100%', letterSpacing: 8, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setOtpCode(''); }}
                    style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={handleSendEmailOtp}
                    style={{ background: 'none', border: 'none', color: cooldown > 0 ? '#9ca3af' : '#1a5c4c', fontWeight: 600, fontSize: '0.78rem', cursor: cooldown > 0 ? 'default' : 'pointer' }}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={otpStep === 1 ? handleSendEmailOtp : handleVerifyEmailOtp}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 14px', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : otpStep === 1 ? (
                <>
                  <Send size={15} />
                  <span>Send 6-Digit Email OTP</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify OTP &amp; Enter Pravasa AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION 2: PASSWORD LOGIN & SIGNUP (EXISTING / ADMIN) */}
        {/* ======================================================== */}
        {(mode === 'signin' || mode === 'signup') && authMethod === 'password' && (
          <form onSubmit={e => { e.preventDefault(); handlePasswordSubmit(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Account Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1.5px solid ${role === 'customer' ? '#1a5c4c' : '#e2e2e0'}`,
                        background: role === 'customer' ? '#e8f5f0' : '#ffffff',
                        color: role === 'customer' ? '#1a5c4c' : '#4b5563',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <User size={13} style={{ display: 'inline', marginRight: 4 }} /> Traveller
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('gov_admin')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        border: `1.5px solid ${role === 'gov_admin' ? '#1a5c4c' : '#e2e2e0'}`,
                        background: role === 'gov_admin' ? '#e8f5f0' : '#ffffff',
                        color: role === 'gov_admin' ? '#1a5c4c' : '#4b5563',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} /> Gov Official
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Name *</label>
                  <input
                    className="input"
                    required
                    placeholder="e.g. Suresh Kumar"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Email Address *</label>
              <input
                className="input"
                type="email"
                required
                placeholder="name@karnatakatourism.gov.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Password *</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    style={{ background: 'none', border: 'none', color: '#1a5c4c', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ width: '100%', paddingRight: 36 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 14px', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn size={15} />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* FORGOT PASSWORD FLOW */}
        {/* ======================================================== */}
        {mode === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {resetStep === 1 ? (
              <>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Registered Email Address *
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="Enter your registered email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRequestResetCode}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 14px' }}
                >
                  {loading ? 'Generating Reset Code...' : 'Request 6-Digit Reset Code'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    6-Digit Verification Code *
                  </label>
                  <input
                    className="input"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    style={{ width: '100%', letterSpacing: 4, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    New Password (Min 6 Characters) *
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResetPassword}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px 14px' }}
                >
                  {loading ? 'Saving New Password...' : 'Save Password & Sign In'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Error and Success Notifications */}
        {error && (
          <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: 6, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 12px', borderRadius: 6, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

      </div>
    </div>
  );
}
