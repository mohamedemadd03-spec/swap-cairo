import React, { useState } from 'react';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';
import { authService, AuthUser } from '../../services/authService';

interface AuthGateModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: AuthUser) => void;
}

// Convert Eastern Arabic numerals (٠-٩) to Western (0-9) seamlessly
const normalizeNumerals = (str: string) => {
  return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onAuthSuccess,
}) => {
  const { language, toggleLanguage } = useLanguage();
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

    const cleanId = normalizeNumerals(loginIdentifier.trim());
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

  // 2. Direct Real Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = registerUsername.trim().replace(/^@/, '');
    const cleanPhone = normalizeNumerals(registerPhone.trim());
    const cleanDigits = cleanPhone.replace(/\D/g, '');

    if (!cleanUser || cleanUser.length < 2) {
      setErrorMsg(isAr ? 'يرجى كتابة اسم المستخدم (حرفين على الأقل)' : 'Please choose a username of at least 2 characters');
      triggerHaptic('error');
      return;
    }

    if (!cleanPhone || cleanDigits.length < 9) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم هاتف مصري صحيح (010/011/012/015)' : 'Please enter a valid Egyptian mobile number');
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

  // 3. Reset Password with Phone Number Identity Verification
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = normalizeNumerals(forgotIdentifier.trim().replace(/^@/, ''));
    const cleanPhone = normalizeNumerals(forgotPhone.trim());

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0c]/90 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto selection:bg-[#caf300] selection:text-black"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Ambient Top Glow for Streetwear Depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-72 bg-[#caf300]/[0.08] blur-[120px] pointer-events-none rounded-full" />

      {/* Main Auth Monolith Card */}
      <div className="relative w-full max-w-[420px] rounded-3xl bg-[#141417]/95 border border-white/10 p-6 sm:p-8 flex flex-col gap-5 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(202,243,0,0.05)] backdrop-blur-3xl my-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header: Brand Identity & Language Toggle */}
        <div className="flex items-start justify-between w-full">
          {/* Brand Logo: strictly lowercase 'swap.' with electric volt dot */}
          <div className="flex flex-col select-none">
            <div className="flex items-baseline">
              <span className="font-display text-4xl sm:text-5xl font-black lowercase tracking-tighter text-white">
                swap
              </span>
              <span className="font-display text-4xl sm:text-5xl font-black text-[#caf300] leading-none animate-pulse">
                .
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#caf300]" />
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#9ba082]">
                {isAr ? 'مقايضة ستريتوير • القاهرة' : 'STREETWEAR BARTER • CAIRO'}
              </span>
            </div>
          </div>

          {/* Minimal Language Switcher */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              toggleLanguage();
            }}
            className="px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[11px] font-mono font-bold text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px] text-[#caf300]">translate</span>
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        {/* Mode Switcher Tabs (Only visible for signin & signup) */}
        {mode !== 'forgot' ? (
          <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#0c0b0e] border border-white/10 font-mono text-xs select-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`relative z-10 py-2.5 px-3 rounded-xl font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-[#caf300] text-[#0c0b0e] shadow-[0_2px_12px_rgba(202,243,0,0.3)] font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
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
              className={`relative z-10 py-2.5 px-3 rounded-xl font-bold uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#caf300] text-[#0c0b0e] shadow-[0_2px_12px_rgba(202,243,0,0.3)] font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              <span>{isAr ? 'حساب جديد' : 'New Account'}</span>
            </button>
          </div>
        ) : (
          /* Forgot Password Header Banner */
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#caf300]">lock_reset</span>
              <h2 className="font-display font-bold text-base text-white">
                {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setMode('signin');
                setErrorMsg(null);
              }}
              className="text-xs font-mono text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isAr ? 'arrow_forward' : 'arrow_back'}
              </span>
              <span>{isAr ? 'رجوع' : 'Back'}</span>
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-300 font-mono text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
            <span className="flex-1 leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* ---------------- MODE 1: SIGN IN ---------------- */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            {/* Identifier Input */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">person</span>
                <span>{isAr ? 'اسم المستخدم أو رقم الموبايل' : 'Username or Mobile'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <input
                  type="text"
                  autoFocus
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? '@ziad أو 010xxxxxxxx' : '@handle or 010xxxxxxxx'}
                  className="w-full px-4 py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock</span>
                  <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    soundFX.playClick();
                    setMode('forgot');
                    setErrorMsg(null);
                    setForgotIdentifier(loginIdentifier);
                  }}
                  className="text-[11px] font-mono text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer"
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'pr-4 pl-12' : 'pl-4 pr-12'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1.5 ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showLoginPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3.5 px-5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_24px_rgba(202,243,0,0.28)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0c0b0e] border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري التحقق...' : 'Signing in...'}</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>{isAr ? 'دخول للمنصة ⚡' : 'ENTER SWAP ⚡'}</span>
                </>
              )}
            </button>

            {/* Direct Switch to Sign Up */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5"
              >
                <span>{isAr ? 'ليس لديك حساب بعد؟' : 'No account yet?'}</span>
                <span className="text-[#caf300] font-bold underline underline-offset-4">
                  {isAr ? 'سجل حساب جديد ⚡' : 'Sign up now ⚡'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ---------------- MODE 2: SIGN UP ---------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3.5">
            {/* Handle / Username */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">alternate_email</span>
                <span>{isAr ? 'هاندل الستريتوير (اسم الحساب)' : 'Streetwear Handle'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <span className={`text-neutral-500 font-mono text-sm select-none ${isAr ? 'pr-4 pl-1' : 'pl-4 pr-1'}`}>
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={registerUsername.replace(/^@/, '')}
                  onChange={(e) => {
                    setRegisterUsername(e.target.value.replace(/^@/, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? 'ziad_cairo' : 'ziad_cairo'}
                  className="w-full py-3 pr-2 pl-4 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Egyptian Mobile Number */}
            <div className="flex flex-col gap-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#caf300]">call</span>
                  <span>{isAr ? 'رقم الموبايل المصري' : 'Egyptian Mobile Number'}</span>
                </label>
                <span className="text-[10px] text-[#9ba082]">
                  {isAr ? '010 / 011 / 012 / 015' : '010 / 011 / 012 / 015'}
                </span>
              </div>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200 overflow-hidden">
                <div
                  className={`px-3 py-3 font-mono text-xs font-bold text-[#caf300] bg-white/[0.04] flex items-center gap-1 shrink-0 select-none ${
                    isAr ? 'border-l border-white/10' : 'border-r border-white/10'
                  }`}
                >
                  <span>🇪🇬</span>
                  <span className="tracking-wider">+20</span>
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  value={registerPhone}
                  onChange={(e) => {
                    setRegisterPhone(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="01012345678"
                  className={`w-full px-4 py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock</span>
                <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? '6 أحرف أو أرقام على الأقل' : 'At least 6 characters'}
                  className={`w-full py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'pr-4 pl-12' : 'pl-4 pr-12'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1.5 ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showRegisterPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3.5 px-5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_24px_rgba(202,243,0,0.28)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0c0b0e] border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري إنشاء الحساب...' : 'Creating...'}</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>{isAr ? 'إنشاء الحساب وبدء المقايضة ⚡' : 'CREATE ACCOUNT ⚡'}</span>
                </>
              )}
            </button>

            {/* Direct Switch to Sign In */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer py-1 flex items-center gap-1.5"
              >
                <span>{isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}</span>
                <span className="text-[#caf300] font-bold underline underline-offset-4">
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ---------------- MODE 3: FORGOT PASSWORD ---------------- */}
        {mode === 'forgot' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              {isAr
                ? 'أدخل هاندل حسابك ورقم هاتفك المسجل لتأكيد هويتك وتعيين كلمة مرور جديدة فوراً.'
                : 'Enter your handle and registered phone number to verify your identity and set a new password.'}
            </p>

            {/* Handle / Username */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">alternate_email</span>
                <span>{isAr ? 'اسم المستخدم (الهاندل)' : 'Username or Handle'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <span className={`text-neutral-500 font-mono text-sm select-none ${isAr ? 'pr-4 pl-1' : 'pl-4 pr-1'}`}>
                  @
                </span>
                <input
                  type="text"
                  autoFocus
                  value={forgotIdentifier.replace(/^@/, '')}
                  onChange={(e) => {
                    setForgotIdentifier(e.target.value.replace(/^@/, ''));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? 'ziad_cairo' : 'ziad_cairo'}
                  className="w-full py-3 pr-2 pl-4 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Registered Phone */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">call</span>
                <span>{isAr ? 'رقم الهاتف المسجل بالحساب' : 'Registered Phone Number'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200 overflow-hidden">
                <div
                  className={`px-3 py-3 font-mono text-xs font-bold text-[#caf300] bg-white/[0.04] flex items-center gap-1 shrink-0 select-none ${
                    isAr ? 'border-l border-white/10' : 'border-r border-white/10'
                  }`}
                >
                  <span>🇪🇬</span>
                  <span className="tracking-wider">+20</span>
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  value={forgotPhone}
                  onChange={(e) => {
                    setForgotPhone(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="01012345678"
                  className={`w-full px-4 py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#caf300]">lock_reset</span>
                <span>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</span>
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] focus-within:ring-2 focus-within:ring-[#caf300]/20 transition-all duration-200">
                <input
                  type={showForgotNewPassword ? 'text' : 'password'}
                  value={forgotNewPassword}
                  onChange={(e) => {
                    setForgotNewPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  className={`w-full py-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'pr-4 pl-12' : 'pl-4 pr-12'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowForgotNewPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1.5 ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showForgotNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3.5 px-5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_24px_rgba(202,243,0,0.28)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0c0b0e] border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري التحقق والتحديث...' : 'Updating...'}</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>{isAr ? 'تحديث كلمة المرور والدخول ⚡' : 'SET NEW PASSWORD ⚡'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Minimal Brutalist Safety Bar */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest pt-1 border-t border-white/5 select-none">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#caf300]/80" />
            {isAr ? 'أمان تام' : 'SECURE'}
          </span>
          <span>•</span>
          <span>{isAr ? 'توثيق رقم الهاتف' : 'PHONE VERIFIED'}</span>
          <span>•</span>
          <span>{isAr ? 'بدون إيميل' : 'NO EMAIL'}</span>
        </div>

      </div>
    </div>
  );
};