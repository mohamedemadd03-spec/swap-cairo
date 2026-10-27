import React, { useState } from 'react';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';
import { authService, AuthUser } from '../../services/authService';

interface AuthGateModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: AuthUser) => void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onAuthSuccess,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign Up state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 1. Direct Real Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMsg(isAr ? 'يرجى كتابة اسم المستخدم أو رقم الهاتف' : 'Please enter your username or phone number');
      triggerHaptic('error');
      return;
    }

    if (!loginPassword) {
      setErrorMsg(isAr ? 'يرجى كتابة كلمة المرور' : 'Please enter your password');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.login(cleanId, loginPassword);
      triggerHaptic('trade');
      soundFX.playCash();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'بيانات الدخول غير صحيحة، يرجى التأكد' : 'Invalid login credentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Reset Password with Phone Number Identity Verification
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = forgotIdentifier.trim();
    const cleanPhone = forgotPhone.trim();

    if (!cleanId) {
      setErrorMsg(isAr ? 'يرجى كتابة اسم المستخدم أو هاندل الحساب' : 'Please enter your username');
      triggerHaptic('error');
      return;
    }

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم هاتفك المسجل لتأكيد هويتك' : 'Please enter your registered phone number');
      triggerHaptic('error');
      return;
    }

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.resetPassword(cleanId, cleanPhone, forgotNewPassword);
      triggerHaptic('trade');
      soundFX.playCash();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'فشل استعادة الحساب، تأكد من صحة رقم الهاتف والاسم' : 'Failed to reset password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Direct Real Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = registerUsername.trim();
    const cleanPhone = registerPhone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '');

    if (!cleanUser || cleanUser.length < 2) {
      setErrorMsg(isAr ? 'يرجى كتابة اسم المستخدم أو هاندل الستريتوير' : 'Please choose a username of at least 2 characters');
      triggerHaptic('error');
      return;
    }

    if (!cleanPhone || cleanDigits.length < 9) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم هاتف صحيح (010/011/012/015)' : 'Please enter a valid phone number');
      triggerHaptic('error');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.register(
        cleanUser,
        registerPassword,
        cleanPhone,
        cleanUser
      );
      triggerHaptic('trade');
      soundFX.playMatch();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'فشل إنشاء الحساب، يرجى المحاولة مجدداً' : 'Failed to create account'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#131315] border-2 border-[#caf300]/40 p-6 flex flex-col gap-4 text-white shadow-[0_0_50px_rgba(202,243,0,0.18)] my-auto animate-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-[#caf300] text-[#0c0b0e] flex items-center justify-center font-display font-black text-2xl tracking-tighter shadow-[0_0_20px_rgba(202,243,0,0.4)]">
            SW
          </div>
          <h1 className="font-display font-black text-xl uppercase tracking-wider text-white mt-1">
            SWAP // CAIRO
          </h1>
          <p className="font-mono text-xs text-[#c5c9ac]">
            {isAr ? 'منصة تبادل الستريتوير في مصر' : 'Cairo Streetwear Barter Exchange'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#1c1b1f] border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-[#caf300] text-[#0c0b0e] shadow-sm font-black'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">login</span>
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-[#caf300] text-[#0c0b0e] shadow-sm font-black'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            <span>{isAr ? 'حساب جديد ⚡' : 'Sign Up ⚡'}</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* ---------------- MODE 1: SIGN IN ---------------- */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">badge</span>
                <span>{isAr ? 'اسم المستخدم أو رقم الهاتف' : 'Username or Phone Number'}</span>
              </label>
              <input
                type="text"
                autoFocus
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={isAr ? '@ziad_cairo أو 010xxxxxxxx' : '@handle or 010xxxxxxxx'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock</span>
                <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f9378] hover:text-[#caf300] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showLoginPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg(null);
                  setForgotIdentifier(loginIdentifier);
                }}
                className="font-mono text-[11px] text-[#8f9378] hover:text-[#caf300] transition-colors cursor-pointer"
              >
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-mono text-sm font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(202,243,0,0.3)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{isSubmitting ? (isAr ? 'جاري الدخول...' : 'Signing in...') : (isAr ? 'دخول ⚡' : 'SIGN IN ⚡')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className="text-center font-mono text-xs text-[#8f9378] hover:text-[#caf300] transition-colors cursor-pointer py-1"
            >
              {isAr ? 'ليس لديك حساب بعد؟ سجل حساب جديد ⚡' : 'No account yet? Create one now ⚡'}
            </button>
          </form>
        )}

        {/* ---------------- MODE 2: SIGN UP ---------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">alternate_email</span>
                <span>{isAr ? 'هاندل الستريتوير (اسم المستخدم)' : 'Streetwear Handle'}</span>
              </label>
              <input
                type="text"
                autoFocus
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                placeholder={isAr ? 'مثال: @ziad_cairo' : '@ziad_cairo'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">call</span>
                <span>{isAr ? 'رقم الموبايل' : 'Phone Number'}</span>
              </label>
              <div className="flex items-center rounded-xl bg-[#1c1b1f] border border-white/10 focus-within:border-[#caf300] overflow-hidden">
                <span className="px-3 py-2.5 font-mono text-xs font-bold text-[#caf300] bg-white/5 border-r border-white/10 shrink-0">
                  +20 🇪🇬
                </span>
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3 py-2.5 bg-transparent text-white font-mono text-sm placeholder:text-[#5f634b] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock</span>
                <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
              </label>
              <div className="relative">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f9378] hover:text-[#caf300] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showRegisterPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-mono text-sm font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(202,243,0,0.3)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>{isSubmitting ? (isAr ? 'جاري إنشاء الحساب...' : 'Creating...') : (isAr ? 'إنشاء الحساب ⚡' : 'CREATE ACCOUNT ⚡')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className="text-center font-mono text-xs text-[#8f9378] hover:text-[#caf300] transition-colors cursor-pointer py-1"
            >
              {isAr ? 'لديك حساب بالفعل؟ سجل دخولك هنا' : 'Already have an account? Sign in here'}
            </button>
          </form>
        )}

        {/* ---------------- MODE 3: FORGOT PASSWORD ---------------- */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">badge</span>
                <span>{isAr ? 'اسم المستخدم أو الهاندل' : 'Username or Handle'}</span>
              </label>
              <input
                type="text"
                autoFocus
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder={isAr ? '@ziad_cairo' : '@handle'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">call</span>
                <span>{isAr ? 'رقم هاتفك المسجل لتأكيد هويتك' : 'Registered Phone Number'}</span>
              </label>
              <div className="flex items-center rounded-xl bg-[#1c1b1f] border border-white/10 focus-within:border-[#caf300] overflow-hidden">
                <span className="px-3 py-2.5 font-mono text-xs font-bold text-[#caf300] bg-white/5 border-r border-white/10 shrink-0">
                  +20 🇪🇬
                </span>
                <input
                  type="tel"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3 py-2.5 bg-transparent text-white font-mono text-sm placeholder:text-[#5f634b] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock_reset</span>
                <span>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</span>
              </label>
              <div className="relative">
                <input
                  type={showForgotNewPassword ? 'text' : 'password'}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#1c1b1f] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-[#5f634b] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f9378] hover:text-[#caf300] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showForgotNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-mono text-sm font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(202,243,0,0.3)] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>{isSubmitting ? (isAr ? 'جاري التحقق والتحديث...' : 'Updating...') : (isAr ? 'تعيين كلمة المرور الجديدة ⚡' : 'SET NEW PASSWORD ⚡')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className="text-center font-mono text-xs text-[#8f9378] hover:text-[#caf300] transition-colors cursor-pointer py-1"
            >
              {isAr ? 'الرجوع لتسجيل الدخول' : 'Back to sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
