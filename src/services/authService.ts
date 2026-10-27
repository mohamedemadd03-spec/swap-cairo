export interface AuthUser {
  uid: string;
  email?: string;
  displayName: string;
  handle: string;
  phoneNumber?: string;
  photoURL?: string;
  trustPoints?: number;
  rating?: number;
  swapCount?: number;
  preferredHub?: string;
  isGuest?: boolean;
}

const STORAGE_KEYS = {
  USER: 'swap_auth_user_v2',
  TOKEN: 'swap_auth_token_v2',
};

export const authService = {
  getStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return null;
      const user = JSON.parse(raw);
      // Automatically reject old guest sessions so everyone must sign up with phone
      if (user?.isGuest) {
        this.logout();
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  setStoredUser(user: AuthUser, token?: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem('swap_launch_auth_done_v1', 'true');
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
    } catch (err) {
      console.warn('Could not store auth session:', err);
    }
  },

  async sendOtp(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    normalizedPhone: string;
    isExistingUser: boolean;
    smsPreview?: string;
    otpDebug?: string;
  }> {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'فشل إرسال رمز التأكيد SMS');
    }
    return data;
  },

  async verifyOtp(phoneNumber: string, code: string): Promise<{
    success: boolean;
    verified: boolean;
    isNewUser: boolean;
    user?: AuthUser;
    token?: string;
  }> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'رمز التأكيد غير صحيح');
    }

    if (data.user) {
      this.setStoredUser(data.user, data.token);
    }

    return data;
  },

  async phoneRegister(
    phoneNumber: string,
    code: string,
    displayName: string,
    password: string
  ): Promise<AuthUser> {
    const res = await fetch('/api/auth/phone-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, code, displayName, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'فشل إنشاء الحساب برقم الهاتف');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async phoneLogin(phoneNumber: string, password: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/phone-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async register(
    username: string,
    password: string,
    phoneNumber?: string,
    displayName?: string
  ): Promise<AuthUser> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        handle: username,
        password,
        phoneNumber,
        displayName: displayName || username,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'فشل إنشاء الحساب / Registration failed');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async login(identifier: string, password: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, email: identifier, phoneNumber: identifier, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'البيانات غير صحيحة / Invalid credentials');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async verifyResetPhone(phoneNumber: string): Promise<{
    verified: boolean;
    resetToken?: string;
    handle: string;
    displayName?: string;
    phoneNumber: string;
  }> {
    const res = await fetch('/api/auth/verify-reset-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'رقم الهاتف غير مسجل في النظام');
    }

    return data;
  },

  async resetPassword(
    phoneNumber: string,
    newPassword: string,
    resetToken?: string,
    identifier?: string
  ): Promise<AuthUser> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, newPassword, resetToken, identifier }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'فشل إعادة تعيين كلمة المرور');
    }

    if (data.user) {
      this.setStoredUser(data.user, data.token);
    }
    return data.user as AuthUser;
  },

  async verifySession(): Promise<{ valid: boolean; user?: AuthUser; banned?: boolean; error?: string }> {
    try {
      const user = this.getStoredUser();
      if (!user?.uid) return { valid: false };
      const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TOKEN) : null;

      const res = await fetch(`/api/auth/verify-session?uid=${encodeURIComponent(user.uid)}&token=${encodeURIComponent(token || '')}`);
      const data = await res.json();
      if (res.ok && data?.success && data?.valid && data?.user) {
        return { valid: true, user: data.user };
      }
      return { valid: false, banned: Boolean(data?.banned), error: data?.error };
    } catch {
      const local = this.getStoredUser();
      return { valid: Boolean(local), user: local || undefined };
    }
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('swap_launch_auth_done_v1');
    localStorage.removeItem('swap_launch_auth_completed');
  },
};
