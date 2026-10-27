import React, { useState, useEffect } from 'react';
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

  // Mode: 'register' (Phone -> OTP -> Set Profile/Password) vs 'signin' (Phone + Password or Phone + OTP)
  const [mode, setMode] = useState<'register' | 'signin'>('register');

  // Multi-step Registration states
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  // Timer countdown for resending SMS
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  // Step 1: Send SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSmsNotification(null);

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg(isAr ? 'يرجى كتابة رقم هاتف صحيح (11 رقم)' : 'Please enter a valid mobile number');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const data = await authService.sendOtp(phoneNumber);
      setStep('otp');
      setResendTimer(30);
      triggerHaptic('success');
      soundFX.playMatch();

      if (data.smsPreview) {
        setSmsNotification(data.smsPreview);
        if (data.otpDebug) {
          // Pre-fill or make it 1-tap fillable for smooth user experience
          setTimeout(() => {
            if (data.otpDebug) setOtpCode(data.otpDebug);
          }, 600);
        }
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'فشل إرسال رسالة التأكيد' : 'Failed to send SMS'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (otpCode.trim().length < 6) {
      setErrorMsg(isAr ? 'رمز التأكيد مكون من 6 أرقام' : 'Code must be 6 digits');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const data = await authService.verifyOtp(phoneNumber, otpCode.trim());
      if (data.user) {
        // Existing user verified! Sign in immediately
        triggerHaptic('trade');
        soundFX.playCash();
        onAuthSuccess(data.user);
      } else {
        // New user! Proceed to set name and password
        triggerHaptic('success');
        soundFX.playMatch();
        setStep('profile');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'رمز التأكيد غير صحيح' : 'Invalid code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete Registration with Name + Password
  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrorMsg(isAr ? 'يرجى كتابة اسمك أو هاندل الستريتوير' : 'Please enter your handle/name');
      triggerHaptic('error');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.phoneRegister(
        phoneNumber,
        otpCode.trim(),
        displayName.trim(),
        password
      );
      triggerHaptic('trade');
      soundFX.playCash();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'فشل إنشاء الحساب' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Login with Phone Number + Password
  const handlePhonePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setErrorMsg(isAr ? 'يرجى كتابة رقم الهاتف' : 'Please enter phone number');
      triggerHaptic('error');
      return;
    }

    if (!password) {
      setErrorMsg(isAr ? 'يرجى كتابة كلمة المرور' : 'Please enter password');
      triggerHaptic('error');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      const user = await authService.phoneLogin(phoneNumber, password);
      triggerHaptic('trade');
      soundFX.playCash();
      onAuthSuccess(user);
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'رقم الهاتف أو كلمة المرور غير صحيحة' : 'Invalid credentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#09090b]/98 backdrop-blur-2xl p-4 animate-in fade-in duration-300 font-sans">
      {/* Background Cyber-Grid Atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 25%, rgba(202,243,0,0.18), transparent 60%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#151418] border-2 border-[#caf300]/80 p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.95)] flex flex-col gap-3.5 animate-in zoom-in-95 duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-1 pt-0.5">
          <div className="flex items-baseline justify-center">
            <h1 className="font-display text-4xl font-black tracking-tight text-white lowercase">
              swap
            </h1>
            <span className="font-display text-4xl font-black text-[#caf300] leading-none">.</span>
          </div>

          <p className="font-mono text-[9.5px] uppercase tracking-widest text-[#caf300] font-bold">
            {isAr ? 'توثيق الحساب برقم الهاتف // CAIRO' : 'PHONE-VERIFIED STREETWEAR BARTER'}
          </p>
        </div>

        {/* Global Live Simulated SMS Banner (Instant verification aid) */}
        {smsNotification && (
          <div className="p-2.5 rounded-2xl bg-[#0c0b0e] border border-[#caf300] shadow-[0_0_20px_rgba(202,243,0,0.25)] flex flex-col gap-1.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#caf300] font-bold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">sms</span>
                <span>{isAr ? 'رسالة نصية جديدة من SWAP' : 'New SMS from SWAP'}</span>
              </span>
              <span className="text-white text-[9px]">الآن</span>
            </div>
            <p className="font-sans text-[11px] text-white leading-tight">
              {smsNotification}
            </p>
          </div>
        )}

        {/* Tab Switcher: Register (SMS OTP) vs Login (Password / OTP) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#0c0b0e] border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setMode('register');
              setStep('phone');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#caf300] text-[#0c0b0e] shadow-sm font-black'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            {isAr ? 'تسجيل جديد ⚡' : 'New Swapper ⚡'}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#caf300] text-[#0c0b0e] shadow-sm font-black'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            {isAr ? 'دخول برقم الهاتف' : 'Sign In'}
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE A: MULTI-STEP PHONE REGISTRATION (PHONE -> OTP -> PROFILE) */}
        {/* ========================================================= */}
        {mode === 'register' && (
          <div>
            {/* STEP 1: PHONE INPUT */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase text-[#caf300] font-bold flex items-center justify-between">
                    <span>{isAr ? 'رقم الهاتف المحمول' : 'Mobile Phone Number'}</span>
                    <span className="text-[#8f9378] text-[9.5px]">🇪🇬 مصر (+20)</span>
                  </label>
                  <div className="flex items-center bg-[#0c0b0e] border border-white/15 focus-within:border-[#caf300] rounded-2xl px-3 py-1 transition-colors">
                    <span className="font-mono text-sm font-bold text-[#caf300] px-1 select-none">
                      +20
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="010 1234 5678"
                      className="w-full bg-transparent px-2 py-2 text-sm font-mono text-white placeholder-[#8f9378] focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#8f9378] px-1">
                    {isAr
                      ? 'ستصلك رسالة SMS بها رمز تأكيد من 6 أرقام لتأكيد ملكية الرقم.'
                      : 'We will send a 6-digit confirmation code via SMS.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1 py-3.5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جاري إرسال الرسالة...' : 'Sending SMS...'}</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">sms</span>
                      <span>{isAr ? 'إرسال رمز التأكيد SMS' : 'Send SMS Confirmation Code'}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3 animate-in fade-in">
                <div className="flex flex-col gap-1.5 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#caf300]/15 border border-[#caf300]/40 text-[#caf300] flex items-center justify-center mx-auto mb-1">
                    <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                  </div>
                  <h3 className="font-mono text-xs font-bold text-white uppercase">
                    {isAr ? 'تأكيد رقم الهاتف' : 'Confirm Phone Number'}
                  </h3>
                  <p className="font-mono text-[10.5px] text-[#c5c9ac]">
                    {isAr
                      ? `أرسلنا رسالة SMS إلى ${phoneNumber}`
                      : `SMS sent to ${phoneNumber}`}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold text-center">
                    {isAr ? 'اكتب رمز التأكيد (6 أرقام)' : 'Enter 6-Digit Code'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="849201"
                    className="w-full bg-[#0c0b0e] border-2 border-[#caf300]/60 focus:border-[#caf300] rounded-2xl py-3 text-center text-xl font-mono tracking-widest text-[#caf300] font-black focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">verified</span>
                      <span>{isAr ? 'تأكيد الرقم والمتابعة' : 'Verify & Continue'}</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between font-mono text-[10.5px] pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-[#8f9378] hover:text-white cursor-pointer underline"
                  >
                    {isAr ? 'تغيير رقم الهاتف' : 'Change Phone'}
                  </button>

                  <button
                    type="button"
                    disabled={resendTimer > 0 || isSubmitting}
                    onClick={() => handleSendOtp()}
                    className={`cursor-pointer ${
                      resendTimer > 0
                        ? 'text-[#8f9378]'
                        : 'text-[#caf300] font-bold hover:underline'
                    }`}
                  >
                    {resendTimer > 0
                      ? isAr
                        ? `إعادة إرسال (${resendTimer}s)`
                        : `Resend (${resendTimer}s)`
                      : isAr
                      ? 'إعادة إرسال الرمز'
                      : 'Resend SMS'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SET PROFILE (NAME/HANDLE + PASSWORD) */}
            {step === 'profile' && (
              <form onSubmit={handleCompleteRegister} className="flex flex-col gap-3 animate-in fade-in">
                <div className="p-2.5 rounded-xl bg-[#caf300]/10 border border-[#caf300]/40 flex items-center gap-2 font-mono text-[10.5px] text-[#caf300] font-bold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{isAr ? `تم توثيق الرقم ${phoneNumber}` : `Verified: ${phoneNumber}`}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold">
                    {isAr ? 'الاسم أو هاندل الستريتوير' : 'Name / Streetwear Handle'}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={isAr ? 'مثال: زياد المعادي أو @ziad_cairo' : 'e.g. @ziad_cairo'}
                    className="w-full bg-[#0c0b0e] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none font-mono transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold">
                      {isAr ? 'كلمة المرور لتسجيل الدخول لاحقاً' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-mono text-[#8f9378] hover:text-white cursor-pointer"
                    >
                      {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0c0b0e] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none font-mono transition-colors"
                  />
                  <span className="text-[9.5px] font-mono text-[#8f9378]">
                    {isAr ? '6 أحرف على الأقل لدخول حسابك من أي جهاز' : 'At least 6 characters'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-1.5 py-3.5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جاري إنشاء الحساب...' : 'Creating Account...'}</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
                      <span>{isAr ? 'إنشاء الحساب وبدء سواب ⚡' : 'Finish & Start Swapping ⚡'}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE B: RETURNING USER LOGIN (PHONE + PASSWORD OR SMS OTP) */}
        {/* ========================================================= */}
        {mode === 'signin' && (
          <form onSubmit={handlePhonePasswordLogin} className="flex flex-col gap-3 animate-in fade-in">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase text-[#caf300] font-bold flex items-center justify-between">
                <span>{isAr ? 'رقم الهاتف المسجل' : 'Registered Phone Number'}</span>
                <span className="text-[#8f9378] text-[9.5px]">🇪🇬 (+20)</span>
              </label>
              <div className="flex items-center bg-[#0c0b0e] border border-white/15 focus-within:border-[#caf300] rounded-2xl px-3 py-1 transition-colors">
                <span className="font-mono text-sm font-bold text-[#caf300] px-1 select-none">
                  +20
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010 1234 5678"
                  className="w-full bg-transparent px-2 py-2 text-sm font-mono text-white placeholder-[#8f9378] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] font-mono text-[#8f9378] hover:text-white cursor-pointer"
                >
                  {showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0c0b0e] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none font-mono transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 py-3.5 rounded-2xl bg-[#caf300] text-[#0c0b0e] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isAr ? 'جاري التحقق...' : 'Logging in...'}</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[17px]">login</span>
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                </>
              )}
            </button>

            {/* Quick SMS Login Alternative */}
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setStep('phone');
                  if (phoneNumber) handleSendOtp();
                }}
                className="text-[11px] font-mono text-[#caf300] hover:underline cursor-pointer"
              >
                {isAr
                  ? 'نسيت كلمة المرور؟ ادخل برمز SMS سريع ✉️'
                  : 'Forgot password? Sign in with SMS code ✉️'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
