import { Garment, FilterSettings } from '../types/swap';

/**
 * Calculates gesture swipe physics and stamp opacity
 */
export function calculateSwipeState(deltaX: number, threshold = 100) {
  const rotation = Math.max(-25, Math.min(25, deltaX * 0.06));
  
  let action: 'swap' | 'pass' | 'neutral' = 'neutral';
  if (deltaX > threshold) {
    action = 'swap';
  } else if (deltaX < -threshold) {
    action = 'pass';
  }

  const likeStampOpacity = deltaX > 25 ? Math.min(1, (deltaX - 25) / 75) : 0;
  const passStampOpacity = deltaX < -25 ? Math.min(1, Math.abs(deltaX + 25) / 75) : 0;

  return {
    action,
    rotation,
    likeStampOpacity,
    passStampOpacity,
  };
}

/**
 * Calculates fair cash compensation between two swapped garments
 */
export function calculateCashDelta(yourValue: number, theirValue: number) {
  const difference = theirValue - yourValue;

  if (Math.abs(difference) <= 20) {
    return {
      cashAmount: 0,
      payer: 'even' as const,
      isBalanced: true,
    };
  }

  if (difference > 0) {
    return {
      cashAmount: difference,
      payer: 'you' as const,
      isBalanced: false,
    };
  }

  return {
    cashAmount: Math.abs(difference),
    payer: 'partner' as const,
    isBalanced: false,
  };
}

/**
 * Calculates environmental CO2 preserved from circular fashion swaps
 */
export function calculateCo2Preserved(swapCount: number, avgKgPerGarment = 3.6): number {
  if (swapCount <= 0) return 0;
  return Number((swapCount * avgKgPerGarment).toFixed(1));
}

/**
 * Filters feed garments by user criteria
 */
export function filterGarments(garments: Garment[], filters: Partial<FilterSettings>): Garment[] {
  return garments.filter(item => {
    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (item.estValue < min || item.estValue > max) return false;
    }
    if (filters.minCondition) {
      const condNum = parseFloat(item.condition);
      if (!isNaN(condNum) && condNum < filters.minCondition) return false;
    }
    if (filters.onlyPro && !item.owner.isPro) {
      return false;
    }
    return true;
  });
}

/**
 * Formats monetary amounts with currency
 */
export function formatCurrency(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Validates Handshake security passcodes (The One Who Gives -> The One Who Receives)
 */
export function validateHandshakePassCode(
  scannedCode: string,
  expectedPassCode = 'SWP-7740'
): { valid: boolean; normalizedCode: string } {
  const normScanned = String(scannedCode || '').trim().toUpperCase();
  const normExpected = String(expectedPassCode || '').trim().toUpperCase();
  const validFormat = /^[A-Z0-9_-]{3,32}$/.test(normScanned);
  return {
    valid: validFormat && (normScanned === normExpected || normScanned.startsWith('SWP-')),
    normalizedCode: normScanned,
  };
}

/**
 * Automatically cancels competing pending/maybe offers when an offer is accepted
 */
export function resolveCompetingOffersCleanup<
  T extends {
    id: string;
    status: string;
    yourItem: { id: string };
    theirItem: { id: string };
  }
>(offers: T[], acceptedOfferId: string): T[] {
  const target = offers.find((o) => o.id === acceptedOfferId);
  if (!target) return offers;

  const lockedIds = new Set([target.yourItem.id, target.theirItem.id]);

  return offers.map((o) => {
    if (o.id === acceptedOfferId) {
      return { ...o, status: 'accepted' };
    }
    const sharesLockedPiece =
      lockedIds.has(o.yourItem.id) || lockedIds.has(o.theirItem.id);
    if (sharesLockedPiece && (o.status === 'pending' || o.status === 'maybe')) {
      return { ...o, status: 'declined' };
    }
    return o;
  });
}

/**
 * Haversine formula to compute distance in km between two lat/lng coordinates
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance in Arabic according to proximity (meters vs km)
 * e.g. "على بعد 300 متر" or "على بعد 1.8 كم"
 */
export function formatArabicDistance(distKm: number): string {
  if (isNaN(distKm) || distKm <= 0.4) {
    return 'على بعد 300 متر';
  }
  if (distKm < 1.0) {
    const meters = Math.round(distKm * 1000);
    return `على بعد ${meters} متر`;
  }
  return `على بعد ${distKm.toFixed(1)} كم`;
}


