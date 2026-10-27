import { Garment, WardrobeItem } from '../types/swap';
import { calculateHaversineDistanceKm } from '../utils/swapLogic';

export type StreetwearArchetypeKey =
  | 'GORPCORE'
  | 'SKATE_STREETWEAR'
  | 'VINTAGE_ARCHIVE'
  | 'WORKWEAR_HERITAGE'
  | 'SNEAKER_GRAIL'
  | 'CONTEMPORARY_LUXURY';

export interface ArchetypeDefinition {
  id: StreetwearArchetypeKey;
  name: string;
  nameAr: string;
  brands: string[];
  categories: string[];
  keywords: string[];
}

export const STREETWEAR_ARCHETYPES: Record<StreetwearArchetypeKey, ArchetypeDefinition> = {
  GORPCORE: {
    id: 'GORPCORE',
    name: 'Gorpcore & Techwear',
    nameAr: 'جورب كور وتيك وير',
    brands: ['arcteryx', 'salomon', 'thenorthface', 'nikeacg', 'oakley', 'stoneisland', 'andwander'],
    categories: ['jacket', 'shoes'],
    keywords: ['goretex', 'waterproof', 'technical', 'trail', 'shell', 'windbreaker', 'contagrip', 'cordura', 'ripstop'],
  },
  SKATE_STREETWEAR: {
    id: 'SKATE_STREETWEAR',
    name: 'Skate & 90s Streetwear',
    nameAr: 'سكيت وستريت وير 90s',
    brands: ['stussy', 'supreme', 'palace', 'thrasher', 'bape', 'dime', 'huf', 'polar'],
    categories: ['hoodie', 'denim', 'tees'],
    keywords: ['bogo', '8ball', 'baggy', 'skate', 'skatewear', 'oversized', 'mohair', 'fleece'],
  },
  VINTAGE_ARCHIVE: {
    id: 'VINTAGE_ARCHIVE',
    name: 'Vintage & Single Stitch Archive',
    nameAr: 'فينتدج وسينجل ستيتش',
    brands: ['vintage', 'nike', 'adidas', 'champion', 'russellathletic'],
    categories: ['tees', 'hoodie'],
    keywords: ['vintage', 'retro', 'singlestitch', '90s', 'faded', 'washed', 'center swoosh', 'tour', 'grunge', 'nirvana'],
  },
  WORKWEAR_HERITAGE: {
    id: 'WORKWEAR_HERITAGE',
    name: 'Workwear & Industrial Heritage',
    nameAr: 'ويرك وير وكانفاس أصلي',
    brands: ['carhartt', 'carharttwip', 'dickies', 'bendavis', 'pointer', 'stanray'],
    categories: ['jacket', 'denim'],
    keywords: ['canvas', 'detroit', 'workwear', 'carpenter', 'doubleknee', 'blanket', 'corduroy'],
  },
  SNEAKER_GRAIL: {
    id: 'SNEAKER_GRAIL',
    name: 'Sneakers & Trail Runners',
    nameAr: 'سنيكرز وتريل رانرز',
    brands: ['salomon', 'nike', 'jordan', 'newbalance', 'asics', 'yeezy'],
    categories: ['shoes'],
    keywords: ['xt6', 'dunk', 'jordan', 'runner', 'sneaker', 'contagrip', 'phantom'],
  },
  CONTEMPORARY_LUXURY: {
    id: 'CONTEMPORARY_LUXURY',
    name: 'High Street Archive',
    nameAr: 'هاي ستريت وأرشيف فاخر',
    brands: ['rickowens', 'chromehearts', 'undercover', 'balenciaga', 'yohjiyamamoto', 'alyx', 'margiela'],
    categories: ['hoodie', 'jacket', 'denim'],
    keywords: ['archive', 'leather', 'heavyweight', 'avantgarde', 'distressed'],
  },
};

export interface RecentSwipeRecord {
  garmentId: string;
  brand: string;
  category: string;
  archetypes: StreetwearArchetypeKey[];
  action: 'like' | 'pass';
  timestamp: number;
}

export interface UserTasteProfile {
  likedGarmentIds: string[];
  passedGarmentIds: string[];
  brandAffinities: Record<string, number>;
  categoryAffinities: Record<string, number>;
  tagAffinities: Record<string, number>;
  archetypeAffinities: Record<StreetwearArchetypeKey, number>;
  sizeAffinities: Record<string, number>;
  avgLikedPrice: number;
  totalSwipes: number;
  lastUpdated: number;
  recentSwipeActions: RecentSwipeRecord[];
}

const STORAGE_KEY = 'swap_user_taste_profile_v3';

const DEFAULT_ARCHETYPE_AFFINITIES: Record<StreetwearArchetypeKey, number> = {
  GORPCORE: 0,
  SKATE_STREETWEAR: 0,
  VINTAGE_ARCHIVE: 0,
  WORKWEAR_HERITAGE: 0,
  SNEAKER_GRAIL: 0,
  CONTEMPORARY_LUXURY: 0,
};

const DEFAULT_PROFILE: UserTasteProfile = {
  likedGarmentIds: [],
  passedGarmentIds: [],
  brandAffinities: {},
  categoryAffinities: {},
  tagAffinities: {},
  archetypeAffinities: { ...DEFAULT_ARCHETYPE_AFFINITIES },
  sizeAffinities: {},
  avgLikedPrice: 650,
  totalSwipes: 0,
  lastUpdated: Date.now(),
  recentSwipeActions: [],
};

/**
 * Normalizes strings for invariant key lookups
 */
export function normalizeKey(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Normalizes clothing sizes into standard brackets for fit matching
 */
export function normalizeSizeBracket(sizeStr: string): string {
  const s = (sizeStr || '').toUpperCase();
  if (s.includes('XXL') || s.includes('2XL')) return 'XXL';
  if (s.includes('XL')) return 'XL';
  if (s.includes('L')) return 'L';
  if (s.includes('M')) return 'M';
  if (s.includes('S')) return 'S';
  if (s.includes('36') || s.includes('38')) return 'WAIST_36';
  if (s.includes('34')) return 'WAIST_34';
  if (s.includes('32')) return 'WAIST_32';
  if (s.includes('30')) return 'WAIST_30';
  if (s.includes('43') || s.includes('44') || s.includes('42')) return 'FOOTWEAR_43';
  return 'REGULAR';
}

/**
 * Detects which subculture archetypes a piece aligns with
 */
export function detectGarmentArchetypes(garment: Garment): Array<{ archetype: StreetwearArchetypeKey; weight: number }> {
  const brandKey = normalizeKey(garment.brand);
  const catKey = (garment.category || '').toLowerCase();
  const textBlob = `${garment.title} ${garment.brand} ${garment.category || ''} ${(garment.tags || []).join(' ')} ${garment.description || ''} ${garment.archiveTag || ''}`.toLowerCase();

  const results: Array<{ archetype: StreetwearArchetypeKey; weight: number }> = [];

  for (const def of Object.values(STREETWEAR_ARCHETYPES)) {
    let score = 0;
    if (def.brands.some((b) => brandKey.includes(b) || b.includes(brandKey))) score += 0.55;
    if (def.categories.includes(catKey)) score += 0.25;
    const kwMatches = def.keywords.filter((kw) => textBlob.includes(kw)).length;
    if (kwMatches > 0) score += Math.min(0.4, kwMatches * 0.15);

    if (score >= 0.35) {
      results.push({ archetype: def.id, weight: Math.min(1.0, score) });
    }
  }

  if (results.length === 0) {
    results.push({ archetype: 'SKATE_STREETWEAR', weight: 0.5 });
  }

  return results.sort((a, b) => b.weight - a.weight);
}

/**
 * Loads the user's taste profile from localStorage or creates default
 */
export function loadTasteProfile(): UserTasteProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('swap_user_taste_profile_v2');
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
      archetypeAffinities: {
        ...DEFAULT_ARCHETYPE_AFFINITIES,
        ...(parsed.archetypeAffinities || {}),
      },
      sizeAffinities: parsed.sizeAffinities || {},
      recentSwipeActions: Array.isArray(parsed.recentSwipeActions) ? parsed.recentSwipeActions : [],
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
 * Evaluates trade counterpart feasibility against the user's wardrobe (in the background)
 */
export function calculateClosetSynergyScore(
  garment: Garment,
  wardrobe: WardrobeItem[] = []
): { synergyScore: number; bestMatchItem?: WardrobeItem; deltaAmount: number } {
  if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
    return { synergyScore: 0, deltaAmount: 0 };
  }

  let bestScore = 0;
  let bestItem: WardrobeItem | undefined;
  let bestDelta = 9999;

  for (const item of wardrobe) {
    if (item.status === 'pending' || item.status === 'sold') continue;

    const delta = Math.abs((item.value || 500) - (garment.estValue || 500));
    let score = 0;

    // Direct Equity match: low cash delta = high swap success odds
    if (delta <= 100) score += 20;
    else if (delta <= 250) score += 12;
    else if (delta <= 450) score += 6;

    // Size compatibility
    const wBracket = normalizeSizeBracket(item.size || '');
    const gBracket = normalizeSizeBracket(garment.size || '');
    if (wBracket === gBracket && wBracket !== 'REGULAR') {
      score += 8;
    }

    // Outfit completeness synergy (trading top for bottom or vice versa)
    const isTopItem = ['hoodie', 'jacket', 'tees'].includes((item.category || '').toLowerCase());
    const isTopGarment = ['hoodie', 'jacket', 'tees'].includes((garment.category || '').toLowerCase());
    if (isTopItem !== isTopGarment) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
      bestDelta = delta;
    }
  }

  return { synergyScore: bestScore, bestMatchItem: bestItem, deltaAmount: bestDelta };
}

/**
 * Records a swipe action and dynamically updates the multi-vector brain
 */
export function recordSwipeAction(
  profile: UserTasteProfile,
  garment: Garment,
  action: 'like' | 'pass'
): UserTasteProfile {
  const brandKey = normalizeKey(garment.brand);
  const catKey = (garment.category || 'other').toLowerCase();
  const sizeBracket = normalizeSizeBracket(garment.size);
  const archetypes = detectGarmentArchetypes(garment);

  const nextProfile: UserTasteProfile = {
    ...profile,
    likedGarmentIds: [...profile.likedGarmentIds],
    passedGarmentIds: [...profile.passedGarmentIds],
    brandAffinities: { ...profile.brandAffinities },
    categoryAffinities: { ...profile.categoryAffinities },
    tagAffinities: { ...profile.tagAffinities },
    archetypeAffinities: { ...profile.archetypeAffinities },
    sizeAffinities: { ...profile.sizeAffinities },
    recentSwipeActions: [...profile.recentSwipeActions],
    totalSwipes: profile.totalSwipes + 1,
    lastUpdated: Date.now(),
  };

  // Remove duplicate entries
  nextProfile.likedGarmentIds = nextProfile.likedGarmentIds.filter((id) => id !== garment.id);
  nextProfile.passedGarmentIds = nextProfile.passedGarmentIds.filter((id) => id !== garment.id);

  if (action === 'like') {
    nextProfile.likedGarmentIds.push(garment.id);

    // Boost brand affinity (+3.5)
    if (brandKey) {
      nextProfile.brandAffinities[brandKey] = (nextProfile.brandAffinities[brandKey] || 0) + 3.5;
    }

    // Boost category affinity (+2.5)
    if (catKey) {
      nextProfile.categoryAffinities[catKey] = (nextProfile.categoryAffinities[catKey] || 0) + 2.5;
    }

    // Boost size affinity (+2)
    if (sizeBracket) {
      nextProfile.sizeAffinities[sizeBracket] = (nextProfile.sizeAffinities[sizeBracket] || 0) + 2;
    }

    // Boost archetype cluster affinities (+3.0 weighted)
    archetypes.forEach(({ archetype, weight }) => {
      nextProfile.archetypeAffinities[archetype] =
        (nextProfile.archetypeAffinities[archetype] || 0) + 3.0 * weight;
    });

    // Boost tags
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
    // PASS / Skip
    nextProfile.passedGarmentIds.push(garment.id);

    // Gently dampen affinities
    if (brandKey && nextProfile.brandAffinities[brandKey]) {
      nextProfile.brandAffinities[brandKey] = Math.max(0, nextProfile.brandAffinities[brandKey] - 0.7);
    }
    if (catKey && nextProfile.categoryAffinities[catKey]) {
      nextProfile.categoryAffinities[catKey] = Math.max(0, nextProfile.categoryAffinities[catKey] - 0.5);
    }
    archetypes.forEach(({ archetype, weight }) => {
      if (nextProfile.archetypeAffinities[archetype]) {
        nextProfile.archetypeAffinities[archetype] = Math.max(
          0,
          nextProfile.archetypeAffinities[archetype] - 0.4 * weight
        );
      }
    });
  }

  // Record in recent actions queue (last 25 for recency weighting)
  nextProfile.recentSwipeActions.unshift({
    garmentId: garment.id,
    brand: garment.brand,
    category: catKey,
    archetypes: archetypes.map((a) => a.archetype),
    action,
    timestamp: Date.now(),
  });
  if (nextProfile.recentSwipeActions.length > 25) {
    nextProfile.recentSwipeActions.pop();
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
  const sizeBracket = normalizeSizeBracket(garment.size);
  const archetypes = detectGarmentArchetypes(garment);

  // If user hasn't swiped any item yet, provide an initial baseline score
  if (profile.totalSwipes === 0) {
    const seed = garment.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 78 + (seed % 14);
  }

  let rawPoints = 35; // baseline

  // 1. Direct Brand affinity (up to 25 pts)
  const brandScore = profile.brandAffinities[brandKey] || 0;
  rawPoints += Math.min(25, brandScore * 4.5);

  // 2. Category affinity (up to 15 pts)
  const catScore = profile.categoryAffinities[catKey] || 0;
  rawPoints += Math.min(15, catScore * 3.5);

  // 3. Archetype cluster synergy (up to 30 pts)
  let archetypePoints = 0;
  archetypes.forEach(({ archetype, weight }) => {
    const aff = profile.archetypeAffinities[archetype] || 0;
    archetypePoints += aff * weight * 5.5;
  });
  rawPoints += Math.min(30, archetypePoints);

  // 4. Size bracket compatibility (up to 8 pts)
  const sizeScore = profile.sizeAffinities[sizeBracket] || 0;
  rawPoints += Math.min(8, sizeScore * 2);

  // 5. Tags affinity (up to 10 pts)
  if (Array.isArray(garment.tags)) {
    let tagPoints = 0;
    garment.tags.forEach((t) => {
      const cleanTag = normalizeKey(t);
      if (profile.tagAffinities[cleanTag]) {
        tagPoints += profile.tagAffinities[cleanTag] * 2.0;
      }
    });
    rawPoints += Math.min(10, tagPoints);
  }

  // 6. Price tier compatibility (up to 7 pts)
  const priceDiff = Math.abs((garment.estValue || 500) - profile.avgLikedPrice);
  if (priceDiff <= 200) {
    rawPoints += 7;
  } else if (priceDiff <= 500) {
    rawPoints += 4;
  }

  // 7. Recent Momentum Bonus (up to 10 pts)
  if (profile.recentSwipeActions && profile.recentSwipeActions.length > 0) {
    const recentLikes = profile.recentSwipeActions.slice(0, 5).filter((a) => a.action === 'like');
    const recentMatch = recentLikes.some(
      (a) =>
        normalizeKey(a.brand) === brandKey ||
        a.category === catKey ||
        a.archetypes.some((arch) => archetypes.some((ga) => ga.archetype === arch))
    );
    if (recentMatch) rawPoints += 10;
  }

  // Bound between 55% and 99%
  return Math.min(99, Math.max(55, Math.round(rawPoints)));
}

/**
 * Deterministic hash for non-repeating exploration jitter
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
 * Helper to parse numeric km from distance strings
 */
function parseDistanceNum(d: string): number {
  const match = (d || '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 999;
}

/**
 * Master Cairo Feed Engine:
 * Coordinates the full multi-vector algorithm behind the scenes.
 * Ranks items with taste learning, closet trade synergy, proximity balance,
 * and ensures an anti-repetition stream where unswiped items are presented first.
 */
export function rankCairoFeedEngine(
  garments: Garment[],
  profile: UserTasteProfile,
  wardrobe: WardrobeItem[] = [],
  options?: {
    filterCategory?: string;
    searchQuery?: string;
    maxDistanceKm?: number;
    sessionSwipedIds?: Set<string>;
    userCoords?: { lat: number; lng: number };
  }
): {
  rankedDeck: Garment[];
  unswipedDeck: Garment[];
  recirculationDeck: Garment[];
  diagnostics: {
    primaryArchetype: string;
    topBrands: string[];
    avgLikedValue: number;
    synergyCandidateCount: number;
  };
} {
  const {
    filterCategory = 'all',
    searchQuery = '',
    maxDistanceKm = 15,
    sessionSwipedIds = new Set<string>(),
    userCoords,
  } = options || {};

  // 1. Filter out invalid/traded items and apply active filters
  const eligible = garments.filter((g) => {
    if (g.isTraded) return false;

    // Proximity
    let km = parseDistanceNum(g.distance);
    if (userCoords && g.lat != null && g.lng != null) {
      km = calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, g.lat, g.lng);
    }
    if (km > maxDistanceKm) return false;

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

  // If strict radius filter yields 0 items, expand radius automatically so closest available items in adjacent areas show
  const candidatePool = eligible.length > 0 ? eligible : garments.filter((g) => !g.isTraded);

  // 2. Score each candidate item across all vectors (Taste, Proximity, Rating, Synergy, Silent Quality)
  const scoredItems = candidatePool.map((garment) => {
    const tasteScore = calculateGarmentTasteMatch(garment, profile);
    const { synergyScore } = calculateClosetSynergyScore(garment, wardrobe);
    
    let distKm = parseDistanceNum(garment.distance);
    if (userCoords && garment.lat != null && garment.lng != null) {
      distKm = calculateHaversineDistanceKm(userCoords.lat, userCoords.lng, garment.lat, garment.lng);
    }

    // Dynamic Proximity boost:
    // If friend/neighbor is within 200m (e.g. 100 meters away), massive proximity bonus (+35 pts)!
    let proximityScore = 0;
    if (distKm <= 0.2) {
      proximityScore = 35;
    } else if (distKm <= 1.0) {
      proximityScore = 28;
    } else {
      proximityScore = Math.max(0, 25 - distKm * 1.2);
    }

    // Silent Internal Community Acceptance & Photo Quality (Stored internally, not shown to users)
    const pos = garment.positiveSignals || 0;
    const neg = garment.negativeSignals || 0;
    const baseQuality = (garment.internalScore != null ? garment.internalScore : 50) / 10;
    const acceptanceSignal = Math.max(-10, Math.min(15, pos * 2.5 - neg * 1.2));
    const silentMachineScore = baseQuality + acceptanceSignal;

    // Owner credibility & rating boost (5.0 rating & active swaps)
    const ratingScore = Math.max(0, ((garment.owner?.rating || 5.0) - 4.0) * 10);
    const swapPopularityScore = Math.min(10, (garment.owner?.swapCount || 0) * 1.0);

    // Thompson Exploration Jitter (±3 pts variation)
    const jitter = (hashString(garment.id + (profile.totalSwipes % 5).toString()) % 7) - 3;

    // Composite ranking formula:
    // Taste affinity (40%) + Proximity (25%) + Closet Synergy (20%) + Silent Acceptance/Quality (10%) + Rating & Swaps (5%) + Jitter
    const compositeScore =
      tasteScore * 0.40 +
      proximityScore * 0.25 +
      synergyScore * 0.20 +
      silentMachineScore * 0.10 +
      (ratingScore + swapPopularityScore) * 0.05 +
      jitter;

    const isSwipedInSession = sessionSwipedIds.has(garment.id);

    return {
      garment,
      compositeScore,
      isSwipedInSession,
      hasClosetSynergy: synergyScore >= 12,
    };
  });

  // 3. Separate into unswiped queue vs recirculation queue
  const unswiped = scoredItems
    .filter((item) => !item.isSwipedInSession)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((item) => item.garment);

  const recirculation = scoredItems
    .filter((item) => item.isSwipedInSession)
    .sort((a, b) => {
      // Previously liked items appear earlier in recirculation
      const aLiked = profile.likedGarmentIds.includes(a.garment.id) ? 1 : 0;
      const bLiked = profile.likedGarmentIds.includes(b.garment.id) ? 1 : 0;
      if (aLiked !== bLiked) return bLiked - aLiked;
      return b.compositeScore - a.compositeScore;
    })
    .map((item) => item.garment);

  // If unswiped items exist, place them first; recirculation follows seamlessly
  const rankedDeck = unswiped.length > 0 ? [...unswiped, ...recirculation] : recirculation;

  // Diagnostics summary for telemetry / behind-the-scenes logging
  const topArchetypeEntry = Object.entries(profile.archetypeAffinities).sort((a, b) => b[1] - a[1])[0];
  const primaryArchetype = topArchetypeEntry && topArchetypeEntry[1] > 0
    ? STREETWEAR_ARCHETYPES[topArchetypeEntry[0] as StreetwearArchetypeKey]?.name || 'Streetwear Explorer'
    : 'Cairo Streetwear Explorer';

  const topBrands = Object.entries(profile.brandAffinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k.toUpperCase());

  return {
    rankedDeck: rankedDeck.length > 0 ? rankedDeck : eligible,
    unswipedDeck: unswiped,
    recirculationDeck: recirculation,
    diagnostics: {
      primaryArchetype,
      topBrands,
      avgLikedValue: profile.avgLikedPrice,
      synergyCandidateCount: scoredItems.filter((i) => i.hasClosetSynergy).length,
    },
  };
}

/**
 * Backwards-compatible legacy ranking wrapper
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
  const matchScores = new Map<string, number>();
  garments.forEach((g) => {
    matchScores.set(g.id, calculateGarmentTasteMatch(g, profile));
  });

  const { rankedDeck } = rankCairoFeedEngine(garments, profile, [], {
    filterCategory: options?.filterCategory,
    searchQuery: options?.searchQuery,
    maxDistanceKm: options?.maxDistanceKm,
  });

  return { rankedDeck, matchScores };
}

/**
 * Resets passes when the user exhausts the Cairo deck
 */
export function resetDeckForFreshScan(profile: UserTasteProfile): UserTasteProfile {
  const nextProfile: UserTasteProfile = {
    ...profile,
    passedGarmentIds: [],
    lastUpdated: Date.now(),
  };
  saveTasteProfile(nextProfile);
  return nextProfile;
}

/**
 * Summarizes the user's top aesthetic attributes (e.g. "Vintage Nike • Oversized Hoodies")
 */
export function summarizeUserStyleVibe(profile: UserTasteProfile): string {
  const topArchetype = Object.entries(profile.archetypeAffinities).sort((a, b) => b[1] - a[1])[0];
  const archetypeName =
    topArchetype && topArchetype[1] > 0
      ? STREETWEAR_ARCHETYPES[topArchetype[0] as StreetwearArchetypeKey]?.name
      : null;

  const topBrands = Object.entries(profile.brandAffinities)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.toUpperCase())
    .slice(0, 2);

  const topCats = Object.entries(profile.categoryAffinities)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 2);

  if (!archetypeName && topBrands.length === 0 && topCats.length === 0) {
    return 'Cairo Streetwear Explorer';
  }

  const parts: string[] = [];
  if (archetypeName) parts.push(archetypeName);
  if (topBrands.length > 0) parts.push(topBrands.join(' / '));
  if (topCats.length > 0 && parts.length < 2) parts.push(topCats.join(' & '));

  return parts.slice(0, 2).join(' • ');
}
