import React, { useState } from 'react';
import { soundFX, triggerHaptic } from '../../hooks/useSoundFX';
import { useLanguage } from '../../i18n/LanguageContext';
import { authService, AuthUser } from '../../services/authService';

interface AuthGateModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: AuthUser) => void;
  onGoogleSignIn?: () => Promise<void> | void;
  onPhoneSignIn?: (phoneNumber: string, method: 'call' | 'sms') => Promise<void> | void;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onAuthSuccess,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    triggerHaptic('medium');
    soundFX.playClick();

    try {
      if (mode === 'signin') {
        if (!emailOrPhone.trim() || !password) {
          setErrorMsg(isAr ? 'يرجى كتابة البريد وكلمة المرور' : 'Please provide email and password');
          setIsSubmitting(false);
          return;
        }
        const user = await authService.login(emailOrPhone.trim(), password);
        soundFX.playMatch();
        triggerHaptic('trade');
        onAuthSuccess(user);
      } else {
        if (!displayName.trim()) {
          setErrorMsg(isAr ? 'يرجى كتابة اسمك أو الهاندل' : 'Please enter your name or handle');
          setIsSubmitting(false);
          return;
        }
        if (!emailOrPhone.trim() || !emailOrPhone.includes('@')) {
          setErrorMsg(isAr ? 'يرجى كتابة بريد إلكتروني صحيح' : 'Please enter a valid email');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg(isAr ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
          setIsSubmitting(false);
          return;
        }
        const user = await authService.register(
          emailOrPhone.trim(),
          password,
          displayName.trim(),
          phoneNumber.trim() || undefined
        );
        soundFX.playMatch();
        triggerHaptic('trade');
        onAuthSuccess(user);
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMsg(err?.message || (isAr ? 'حدث خطأ في التسجيل، يرجى المحاولة ثانية' : 'Authentication error, please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestTrial = async () => {
    setIsSubmitting(true);
    triggerHaptic('light');
    soundFX.playClick();
    try {
      const user = await authService.loginAsGuest('Cairo Swapper');
      onAuthSuccess(user);
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0d0e12]/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      {/* Subtle Brutalist Ambient Glow & Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 25%, rgba(202,243,0,0.16), transparent 55%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#18181b] border-2 border-[#caf300]/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.9)] flex flex-col gap-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 font-sans"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Brand Identity */}
        <div className="flex flex-col items-center text-center gap-1 pt-1">
          <div className="flex items-baseline justify-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white lowercase">
              swap
            </h1>
            <span className="font-display text-4xl font-bold text-[#caf300] leading-none">.</span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c5c9ac]">
            {isAr ? 'منصة مقايضة الستريتوير الحقيقية بالقاهرة' : 'Cairo Brutalist Streetwear Barter'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#131315] border border-white/10 font-mono text-xs">
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
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              soundFX.playClick();
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#caf300] text-[#171e00] shadow-sm'
                : 'text-[#8f9378] hover:text-white'
            }`}
          >
            {isAr ? 'حساب جديد' : 'New Account'}
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-base text-red-400 shrink-0">error</span>
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold">
                {isAr ? 'الاسم أو هاندل الستريتوير' : 'Name / Streetwear Handle'}
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isAr ? 'مثال: كريم زمالك' : 'e.g. Karim Zamalek'}
                className="w-full bg-[#131315] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase text-[#caf300] font-bold">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-[#131315] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] uppercase text-[#8f9378] font-bold">
                {isAr ? 'رقم التليفون (اختياري للمقابلة)' : 'Phone Number (Optional for Meetups)'}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010 1234 5678"
                className="w-full bg-[#131315] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none transition-colors"
              />
            </div>
          )}

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
              className="w-full bg-[#131315] border border-white/15 focus:border-[#caf300] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8f9378] focus:outline-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1.5 py-3.5 rounded-2xl bg-[#caf300] text-[#171e00] font-mono text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg shadow-[#caf300]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                <span>
                  {mode === 'signin'
                    ? isAr
                      ? 'تسجيل الدخول'
                      : 'Sign In'
                    : isAr
                    ? 'إنشاء الحساب وبدء سواب'
                    : 'Create Account & Start Swapping'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Quick Guest Bypass Option */}
        <div className="pt-2 border-t border-white/10 flex flex-col items-center gap-1.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGuestTrial}
            className="text-[11px] font-mono text-[#8f9378] hover:text-[#caf300] underline cursor-pointer transition-colors"
          >
            {isAr ? 'تخطي كزائر للتجربة السريعة ←' : 'Browse as Guest for now →'}
          </button>
        </div>
      </div>
    </div>
  );
};
