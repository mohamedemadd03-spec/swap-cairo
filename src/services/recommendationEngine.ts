import { Garment } from '../types/swap';

export interface UserTasteProfile {
  likedGarmentIds: string[];
  passedGarmentIds: string[];
  brandAffinities: Record<string, number>;
  categoryAffinities: Record<string, number>;
  tagAffinities: Record<string, number>;
  avgLikedPrice: number;
  totalSwipes: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'swap_user_taste_profile_v2';

const DEFAULT_PROFILE: UserTasteProfile = {
  likedGarmentIds: [],
  passedGarmentIds: [],
  brandAffinities: {},
  categoryAffinities: {},
  tagAffinities: {},
  avgLikedPrice: 650,
  totalSwipes: 0,
  lastUpdated: Date.now(),
};

/**
 * Loads the user's taste profile from localStorage or creates default
 */
export function loadTasteProfile(): UserTasteProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      likedGarmentIds: Array.isArray(parsed.likedGarmentIds) ? parsed.likedGarmentIds : [],
      passedGarmentIds: Array.isArray(parsed.passedGarmentIds) ? parsed.passedGarmentIds : [],
      brandAffinities: parsed.brandAffinities || {},
      categoryAffinities: parsed.categoryAffinities || {},
      tagAffinities: parsed.tagAffinities || {},
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Persists updated taste profile to localStorage
 */
export function saveTasteProfile(profile: UserTasteProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save taste profile:', err);
  }
}

/**
 * Normalizes a brand name for affinity matching (e.g. "Nike" -> "nike", "Arc'teryx" -> "arcteryx")
 */
function normalizeKey(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Records a swipe action (SWAP = like, PASS = pass) and adapts the style algorithm
 */
export function recordSwipeAction(
  profile: UserTasteProfile,
  garment: Garment,
  action: 'like' | 'pass'
): UserTasteProfile {
  const brandKey = normalizeKey(garment.brand);
  const catKey = (garment.category || 'other').toLowerCase();
  const nextProfile: UserTasteProfile = {
    ...profile,
    likedGarmentIds: [...profile.likedGarmentIds],
    passedGarmentIds: [...profile.passedGarmentIds],
    brandAffinities: { ...profile.brandAffinities },
    categoryAffinities: { ...profile.categoryAffinities },
    tagAffinities: { ...profile.tagAffinities },
    totalSwipes: profile.totalSwipes + 1,
    lastUpdated: Date.now(),
  };

  // Remove from opposing list if already present
  nextProfile.likedGarmentIds = nextProfile.likedGarmentIds.filter((id) => id !== garment.id);
  nextProfile.passedGarmentIds = nextProfile.passedGarmentIds.filter((id) => id !== garment.id);

  if (action === 'like') {
    nextProfile.likedGarmentIds.push(garment.id);

    // Boost brand affinity (+3)
    if (brandKey) {
      nextProfile.brandAffinities[brandKey] = (nextProfile.brandAffinities[brandKey] || 0) + 3;
    }

    // Boost category affinity (+2.5)
    if (catKey) {
      nextProfile.categoryAffinities[catKey] = (nextProfile.categoryAffinities[catKey] || 0) + 2.5;
    }

    // Boost tag affinities (+2 for each tag)
    if (Array.isArray(garment.tags)) {
      garment.tags.forEach((tag) => {
        const cleanTag = normalizeKey(tag);
        if (cleanTag) {
          nextProfile.tagAffinities[cleanTag] = (nextProfile.tagAffinities[cleanTag] || 0) + 2;
        }
      });
    }

    // Rolling average liked price
    const currentCount = nextProfile.likedGarmentIds.length;
    nextProfile.avgLikedPrice = Math.round(
      (profile.avgLikedPrice * (currentCount - 1) + (garment.estValue || 500)) / currentCount
    );
  } else {
    // PASS / Skip: slightly reduce or penalize
    nextProfile.passedGarmentIds.push(garment.id);

    if (brandKey && nextProfile.brandAffinities[brandKey]) {
      nextProfile.brandAffinities[brandKey] = Math.max(0, nextProfile.brandAffinities[brandKey] - 0.7);
    }
    if (catKey && nextProfile.categoryAffinities[catKey]) {
      nextProfile.categoryAffinities[catKey] = Math.max(0, nextProfile.categoryAffinities[catKey] - 0.5);
    }
  }

  saveTasteProfile(nextProfile);
  return nextProfile;
}

/**
 * Calculates a dynamic 0-100% Style Match score for a garment given the user's taste profile
 */
export function calculateGarmentTasteMatch(garment: Garment, profile: UserTasteProfile): number {
  const brandKey = normalizeKey(garment.brand);
  const catKey = (garment.category || 'other').toLowerCase();

  // If user hasn't swiped any item yet, provide an initial baseline score
  if (profile.totalSwipes === 0) {
    const seed = garment.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 78 + (seed % 14);
  }

  let rawPoints = 40; // baseline

  // Brand affinity match (up to 30 pts)
  const brandScore = profile.brandAffinities[brandKey] || 0;
  rawPoints += Math.min(30, brandScore * 5);

  // Category affinity match (up to 20 pts)
  const catScore = profile.categoryAffinities[catKey] || 0;
  rawPoints += Math.min(20, catScore * 4);

  // Tags affinity match (up to 15 pts)
  if (Array.isArray(garment.tags)) {
    let tagPoints = 0;
    garment.tags.forEach((t) => {
      const cleanTag = normalizeKey(t);
      if (profile.tagAffinities[cleanTag]) {
        tagPoints += profile.tagAffinities[cleanTag] * 2.5;
      }
    });
    rawPoints += Math.min(15, tagPoints);
  }

  // Price compatibility (up to 10 pts)
  const priceDiff = Math.abs((garment.estValue || 500) - profile.avgLikedPrice);
  if (priceDiff <= 200) {
    rawPoints += 10;
  } else if (priceDiff <= 500) {
    rawPoints += 5;
  }

  // Bound between 58% and 99%
  return Math.min(99, Math.max(58, Math.round(rawPoints)));
}

/**
 * Simple deterministic hash for exploration jitter
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns prioritized deck with recommendation ranking and 15% exploration serendipity
 */
export function rankGarmentsForDiscovery(
  garments: Garment[],
  profile: UserTasteProfile,
  options?: {
    filterCategory?: string;
    searchQuery?: string;
    maxDistanceKm?: number;
    excludeSwiped?: boolean;
  }
): { rankedDeck: Garment[]; matchScores: Map<string, number> } {
  const {
    filterCategory = 'all',
    searchQuery = '',
    maxDistanceKm = 15,
    excludeSwiped = true,
  } = options || {};

  const matchScores = new Map<string, number>();

  // Filter valid garments
  const eligible = garments.filter((g) => {
    if (g.isTraded) return false;

    // Check if swiped
    if (excludeSwiped) {
      if (profile.likedGarmentIds.includes(g.id) || profile.passedGarmentIds.includes(g.id)) {
        return false;
      }
    }

    // Category filter
    if (filterCategory !== 'all') {
      const cat = (g.category || '').toLowerCase();
      const title = (g.title || '').toLowerCase();
      if (filterCategory === 'tees' && !cat.includes('tee') && !title.includes('tee') && !title.includes('t-shirt')) return false;
      if (filterCategory === 'hoodie' && !cat.includes('hoodie') && !title.includes('hoodie')) return false;
      if (filterCategory === 'jacket' && !cat.includes('jacket') && !title.includes('jacket') && !title.includes('shell')) return false;
      if (filterCategory === 'denim' && !cat.includes('denim') && !title.includes('jean') && !title.includes('denim') && !title.includes('pant')) return false;
      if (filterCategory === 'shoes' && !cat.includes('shoe') && !title.includes('salomon') && !title.includes('sneaker')) return false;
    }

    // Proximity
    const match = g.distance.match(/[\d.]+/);
    const km = match ? parseFloat(match[0]) : 999;
    if (km > maxDistanceKm) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchBrand = g.brand.toLowerCase().includes(q);
      const matchSize = g.size.toLowerCase().includes(q);
      const matchOwner = g.owner.handle.toLowerCase().includes(q) || g.owner.name.toLowerCase().includes(q);
      const matchCity = g.city.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchSize && !matchOwner && !matchCity) return false;
    }

    return true;
  });

  // Calculate scores
  eligible.forEach((g) => {
    matchScores.set(g.id, calculateGarmentTasteMatch(g, profile));
  });

  // Rank with 85% taste score + 15% serendipity/exploration randomness
  const rankedDeck = [...eligible].sort((a, b) => {
    const scoreA = matchScores.get(a.id) || 70;
    const scoreB = matchScores.get(b.id) || 70;

    // Exploration jitter based on ID hash
    const jitterA = (hashString(a.id) % 20) - 10;
    const jitterB = (hashString(b.id) % 20) - 10;

    const effectiveScoreA = scoreA * 0.85 + jitterA;
    const effectiveScoreB = scoreB * 0.85 + jitterB;

    return effectiveScoreB - effectiveScoreA;
  });

  return { rankedDeck, matchScores };
}

/**
 * Resets passes when the user exhausts the Cairo deck
 */
export function resetDeckForFreshScan(profile: UserTasteProfile): UserTasteProfile {
  const nextProfile: UserTasteProfile = {
    ...profile,
    passedGarmentIds: [], // Clear passes so they can see items again with new taste rankings
    lastUpdated: Date.now(),
  };
  saveTasteProfile(nextProfile);
  return nextProfile;
}

/**
 * Summarizes the user's top aesthetic attributes (e.g. "Vintage Nike • Oversized Hoodies")
 */
export function summarizeUserStyleVibe(profile: UserTasteProfile): string {
  const topBrands = Object.entries(profile.brandAffinities)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.toUpperCase())
    .slice(0, 2);

  const topCats = Object.entries(profile.categoryAffinities)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 2);

  if (topBrands.length === 0 && topCats.length === 0) {
    return 'Cairo Streetwear Explorer';
  }

  const parts = [...topBrands, ...topCats];
  return parts.join(' • ');
}
