import React, { useState } from 'react';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';
import { authService, AuthUser } from '../../services/authService';

interface AuthGateModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: AuthUser) => void;
}

// Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
const normalizeNumerals = (str: string) => {
  return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};

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

  // Forgot Password state (Logical 2-step flow)
  // Step 1: verify phone -> Step 2: enter new password
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [verifiedHandle, setVerifiedHandle] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Feedback state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 1. Direct Real Login
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = normalizeNumerals(loginIdentifier.trim());
    if (!cleanId) {
      setErrorMsg(isAr ? 'أدخل رقم الموبايل أو اسم المستخدم' : 'Enter phone or username');
      triggerHaptic('error');
      return;
    }

    if (!loginPassword) {
      setErrorMsg(isAr ? 'أدخل كلمة المرور' : 'Enter password');
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
      setErrorMsg(err?.message || (isAr ? 'بيانات الدخول غير صحيحة، تأكد من الرقم وكلمة المرور' : 'Invalid credentials'));
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
      setErrorMsg(isAr ? 'اسم المستخدم يجب أن يكون حرفين على الأقل' : 'Username must be at least 2 characters');
      triggerHaptic('error');
      return;
    }

    if (!cleanPhone || cleanDigits.length < 9) {
      setErrorMsg(isAr ? 'أدخل رقم موبايل مصري صحيح (010/011/012/015)' : 'Enter valid Egyptian mobile');
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
      setErrorMsg(err?.message || (isAr ? 'فشل إنشاء الحساب، يرجى المحاولة ثانية' : 'Failed to create account'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Step 1: Verify Phone Number for Password Reset
  const handleVerifyPhoneStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = normalizeNumerals(forgotPhone.trim());
    const cleanDigits = cleanPhone.replace(/\D/g, '');

    if (!cleanPhone || cleanDigits.length < 9) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم هاتفك المسجل (010/011/012/015)' : 'Enter your registered phone number');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const result = await authService.verifyResetPhone(cleanPhone);
      setVerifiedHandle(result.handle);
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }
      setForgotStep(2);
      triggerHaptic('light');
      soundFX.playMatch();
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'رقم الهاتف هذا غير مسجل لدينا في SWAP' : 'Phone number not registered'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Step 2: Set New Password & Direct Login
  const handleSaveNewPasswordStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = normalizeNumerals(forgotPhone.trim());
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.resetPassword(cleanPhone, forgotNewPassword, resetToken);
      triggerHaptic('trade');
      soundFX.playCash();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'فشل تحديث كلمة المرور، يرجى المحاولة ثانية' : 'Failed to update password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto selection:bg-[#caf300] selection:text-black"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Sleek, Minimal Brutalist Monolith Card */}
      <div className="relative w-full max-w-[380px] rounded-3xl bg-[#131315] border border-white/10 p-6 sm:p-7 flex flex-col gap-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] my-auto animate-in zoom-in-95 duration-150">
        
        {/* Clean, Confident Logo Header */}
        <div className="flex flex-col items-center justify-center text-center select-none pt-1">
          <div className="flex items-baseline">
            <span className="font-display text-4xl sm:text-5xl font-black lowercase tracking-tighter text-white">
              swap
            </span>
            <span className="font-display text-4xl sm:text-5xl font-black text-[#caf300] leading-none">.</span>
          </div>
          <p className="font-mono text-[11px] text-[#8f9378] tracking-widest uppercase mt-1">
            {isAr ? 'تبادل ستريتوير حقيقي • القاهرة' : 'CAIRO STREETWEAR BARTER'}
          </p>
        </div>

        {/* Minimal Tab Switcher (Only in signin & signup) */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0c0b0e] border border-white/10 font-mono text-xs select-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl font-bold uppercase transition-all duration-150 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#caf300] text-[#0c0b0e] font-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-xl font-bold uppercase transition-all duration-150 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#caf300] text-[#0c0b0e] font-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {isAr ? 'حساب جديد' : 'Sign Up'}
            </button>
          </div>
        ) : (
          /* Forgot Password Header */
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <span className="material-symbols-outlined text-base text-[#caf300]">lock_reset</span>
              <span>{isAr ? 'استعادة كلمة المرور' : 'Reset Password'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                soundFX.playClick();
                setMode('signin');
                setForgotStep(1);
                setErrorMsg(null);
              }}
              className="text-xs font-mono text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء والرجوع' : 'Cancel'}
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[16px] text-red-400 shrink-0">error</span>
            <span className="flex-1 leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* ---------------- MODE 1: SIGN IN ---------------- */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            {/* Identifier Field */}
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                {isAr ? 'رقم الموبايل أو اسم المستخدم' : 'Phone or Username'}
              </label>
              <input
                type="text"
                autoFocus
                value={loginIdentifier}
                onChange={(e) => {
                  setLoginIdentifier(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={isAr ? '@ziad أو 010xxxxxxxx' : '@handle or 010xxxxxxxx'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0b0e] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-neutral-600 outline-none transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    soundFX.playClick();
                    setMode('forgot');
                    setForgotStep(1);
                    setErrorMsg(null);
                    // Pre-fill phone if user already typed a phone number in login
                    if (/^01[0125]\d{8}$/.test(normalizeNumerals(loginIdentifier.trim()))) {
                      setForgotPhone(normalizeNumerals(loginIdentifier.trim()));
                    }
                  }}
                  className="text-[11px] font-mono text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer"
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot?'}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full py-2.5 rounded-xl bg-[#0c0b0e] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-neutral-600 outline-none transition-colors ${
                    isAr ? 'pr-3.5 pl-10' : 'pl-3.5 pr-10'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1 ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showLoginPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_16px_rgba(202,243,0,0.25)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري الدخول...' : 'Signing in...'}</span>
                </div>
              ) : (
                <span>{isAr ? 'دخول ⚡' : 'ENTER SWAP ⚡'}</span>
              )}
            </button>

            {/* Switch to Sign Up */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {isAr ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                <span className="text-[#caf300] font-bold underline underline-offset-4">
                  {isAr ? 'سجل حسابك الآن' : 'Sign up now'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ---------------- MODE 2: SIGN UP ---------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            {/* Username / Handle */}
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                {isAr ? 'اسم المستخدم (الهاندل)' : 'Streetwear Handle'}
              </label>
              <div className="relative flex items-center rounded-xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] transition-colors">
                <span className={`text-neutral-500 font-mono text-sm select-none ${isAr ? 'pr-3 pl-1' : 'pl-3 pr-1'}`}>
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
                  placeholder="ziad_cairo"
                  className="w-full py-2.5 pr-2 pl-3 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                {isAr ? 'رقم الموبايل المصري' : 'Egyptian Mobile Number'}
              </label>
              <div className="relative flex items-center rounded-xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] transition-colors overflow-hidden">
                <div
                  className={`px-3 py-2.5 font-mono text-xs font-bold text-[#caf300] bg-white/[0.04] flex items-center gap-1 shrink-0 select-none ${
                    isAr ? 'border-l border-white/10' : 'border-r border-white/10'
                  }`}
                >
                  <span>🇪🇬</span>
                  <span>+20</span>
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
                  className={`w-full px-3 py-2.5 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                    isAr ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 font-mono">
              <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  className={`w-full py-2.5 rounded-xl bg-[#0c0b0e] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-neutral-600 outline-none transition-colors ${
                    isAr ? 'pr-3.5 pl-10' : 'pl-3.5 pr-10'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1 ${
                    isAr ? 'left-2.5' : 'right-2.5'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showRegisterPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_16px_rgba(202,243,0,0.25)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'جاري الإنشاء...' : 'Creating...'}</span>
                </div>
              ) : (
                <span>{isAr ? 'إنشاء الحساب ⚡' : 'CREATE ACCOUNT ⚡'}</span>
              )}
            </button>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  soundFX.playClick();
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className="text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                <span className="text-[#caf300] font-bold underline underline-offset-4">
                  {isAr ? 'تسجيل الدخول' : 'Sign in'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ---------------- MODE 3: FORGOT PASSWORD (LOGICAL 2-STEP) ---------------- */}
        {mode === 'forgot' && (
          <div className="flex flex-col gap-3">
            {/* STEP 1: Enter & Verify Phone Number */}
            {forgotStep === 1 && (
              <form onSubmit={handleVerifyPhoneStep} className="flex flex-col gap-3">
                <p className="font-mono text-xs text-neutral-400 leading-relaxed">
                  {isAr
                    ? 'أدخل رقم هاتفك المسجل لتأكيد هويتك ومتابعة تعيين كلمة المرور.'
                    : 'Enter your registered phone number to verify your identity.'}
                </p>

                <div className="flex flex-col gap-1 font-mono">
                  <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                    {isAr ? 'رقم الهاتف المسجل' : 'Registered Phone Number'}
                  </label>
                  <div className="relative flex items-center rounded-xl bg-[#0c0b0e] border border-white/10 focus-within:border-[#caf300] transition-colors overflow-hidden">
                    <div
                      className={`px-3 py-2.5 font-mono text-xs font-bold text-[#caf300] bg-white/[0.04] flex items-center gap-1 shrink-0 select-none ${
                        isAr ? 'border-l border-white/10' : 'border-r border-white/10'
                      }`}
                    >
                      <span>🇪🇬</span>
                      <span>+20</span>
                    </div>
                    <input
                      type="tel"
                      dir="ltr"
                      autoFocus
                      value={forgotPhone}
                      onChange={(e) => {
                        setForgotPhone(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="01012345678"
                      className={`w-full px-3 py-2.5 bg-transparent text-white font-mono text-sm placeholder:text-neutral-600 outline-none ${
                        isAr ? 'text-right' : 'text-left'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_16px_rgba(202,243,0,0.25)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{isAr ? 'جاري التحقق من الرقم...' : 'Verifying phone...'}</span>
                    </div>
                  ) : (
                    <span>{isAr ? 'تأكيد رقم الهاتف ←' : 'Verify Phone →'}</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Phone Verified! Now Enter New Password Only */}
            {forgotStep === 2 && (
              <form onSubmit={handleSaveNewPasswordStep} className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                {/* Verified Account Badge */}
                <div className="p-2.5 rounded-xl bg-[#caf300]/10 border border-[#caf300]/25 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[#caf300]">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="font-bold">{isAr ? 'تم التحقق من الحساب' : 'Account Verified'}</span>
                  </div>
                  <span className="text-white font-bold">@{verifiedHandle}</span>
                </div>

                <p className="font-mono text-xs text-neutral-400">
                  {isAr ? 'أدخل كلمة المرور الجديدة لحسابك:' : 'Enter your new password:'}
                </p>

                <div className="flex flex-col gap-1 font-mono">
                  <label className="text-[11px] font-bold text-[#c5c9ac] uppercase">
                    {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      autoFocus
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                      className={`w-full py-2.5 rounded-xl bg-[#0c0b0e] border border-white/10 focus:border-[#caf300] text-white font-mono text-sm placeholder:text-neutral-600 outline-none transition-colors ${
                        isAr ? 'pr-3.5 pl-10' : 'pl-3.5 pr-10'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowForgotNewPassword((prev) => !prev)}
                      className={`absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#caf300] transition-colors cursor-pointer p-1 ${
                        isAr ? 'left-2.5' : 'right-2.5'
                      }`}
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
                  className="mt-1 w-full py-3 px-4 rounded-xl bg-[#caf300] text-[#0c0b0e] font-display font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_2px_16px_rgba(202,243,0,0.25)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{isAr ? 'جاري الحفظ والدخول...' : 'Saving...'}</span>
                    </div>
                  ) : (
                    <span>{isAr ? 'حفظ كلمة المرور والدخول ⚡' : 'SAVE & SIGN IN ⚡'}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};