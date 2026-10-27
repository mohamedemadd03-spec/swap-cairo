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

  async resetPassword(identifier: string, phoneNumber: string, newPassword: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, phoneNumber, newPassword }),
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

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('swap_launch_auth_done_v1');
    localStorage.removeItem('swap_launch_auth_completed');
  },
};
