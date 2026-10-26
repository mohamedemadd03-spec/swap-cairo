export interface AuthUser {
  uid: string;
  email: string;
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
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: AuthUser, token?: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
    } catch (err) {
      console.warn('Could not store auth session:', err);
    }
  },

  async register(
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ): Promise<AuthUser> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, phoneNumber }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'فشل إنشاء الحساب / Registration failed');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async login(emailOrPhone: string, password: string): Promise<AuthUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailOrPhone, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error || 'البيانات غير صحيحة / Invalid credentials');
    }

    this.setStoredUser(data.user, data.token);
    return data.user as AuthUser;
  },

  async loginAsGuest(nickname = 'Cairo Guest'): Promise<AuthUser> {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      // Offline fallback
      const rand = Math.floor(1000 + Math.random() * 9000);
      const fallbackUser: AuthUser = {
        uid: 'gst_' + Date.now().toString(36) + '_' + rand,
        email: `guest_${rand}@swap.vault`,
        displayName: nickname,
        handle: `@guest_${rand}`,
        isGuest: true,
        trustPoints: 250,
        rating: 5.0,
        swapCount: 0,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=guest_${rand}`,
      };
      this.setStoredUser(fallbackUser, 'tok_guest_' + rand);
      return fallbackUser;
    }

    this.setStoredUser(data.user, data.token);
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
