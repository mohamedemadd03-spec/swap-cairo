import { Garment, WardrobeItem, SwapOffer } from '../types/swap';

const STORAGE_KEYS = {
  GARMENTS: 'swap_prod_v1_garments',
  WARDROBE: 'swap_prod_v1_wardrobe',
  OFFERS: 'swap_prod_v1_offers',
  TRUST_POINTS: 'swap_prod_v1_trust_points',
  HUB_ID: 'swap_prod_v1_hub_id',
};

export interface PersistedAppState {
  garments?: Garment[];
  wardrobe?: WardrobeItem[];
  offers?: SwapOffer[];
  userTrustPoints?: number;
  preferredHubId?: string;
}

export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage quota warning:', err);
  }
}

export function loadInitialPersistedState(defaults: {
  garments: Garment[];
  wardrobe: WardrobeItem[];
  offers: SwapOffer[];
  userTrustPoints: number;
  preferredHubId: string;
}) {
  return {
    garments: loadFromLocalStorage(STORAGE_KEYS.GARMENTS, defaults.garments),
    wardrobe: loadFromLocalStorage(STORAGE_KEYS.WARDROBE, defaults.wardrobe),
    offers: loadFromLocalStorage(STORAGE_KEYS.OFFERS, defaults.offers),
    userTrustPoints: loadFromLocalStorage(STORAGE_KEYS.TRUST_POINTS, defaults.userTrustPoints),
    preferredHubId: loadFromLocalStorage(STORAGE_KEYS.HUB_ID, defaults.preferredHubId),
  };
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function persistStateEverywhere(state: PersistedAppState, onSyncComplete?: () => void): void {
  if (state.garments) saveToLocalStorage(STORAGE_KEYS.GARMENTS, state.garments);
  if (state.wardrobe) saveToLocalStorage(STORAGE_KEYS.WARDROBE, state.wardrobe);
  if (state.offers) saveToLocalStorage(STORAGE_KEYS.OFFERS, state.offers);
  if (typeof state.userTrustPoints === 'number') {
    saveToLocalStorage(STORAGE_KEYS.TRUST_POINTS, state.userTrustPoints);
  }
  if (state.preferredHubId) {
    saveToLocalStorage(STORAGE_KEYS.HUB_ID, state.preferredHubId);
  }

  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      onSyncComplete?.();
    } catch {
      // Offline mode: localStorage already has the latest state
    }
  }, 350);
}

export async function fetchServerPersistedState(): Promise<PersistedAppState | null> {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && data?.hasSavedState && data?.state) {
      return data.state as PersistedAppState;
    }
    return null;
  } catch {
    return null;
  }
}

export async function resetAllPersistedData(): Promise<void> {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  }
  try {
    await fetch('/api/reset-demo', { method: 'POST' });
  } catch {
    // Ignore offline error
  }
}

/**
 * Client-side HTML5 Canvas image compressor
 * Ensures phone camera uploads (5MB-12MB) are compressed to ~70KB so Firestore (<1MB limit)
 * and localStorage never fail or lag.
 */
export function compressImageFile(
  file: File,
  maxDimension = 760,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
