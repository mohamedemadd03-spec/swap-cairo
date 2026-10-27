/**
 * SWAP Cairo // Progression & Trust Engine
 * Dynamic ranking, level advancement, and prestige perks for street barterers.
 */

export interface RankTier {
  level: number;
  titleAr: string;
  titleEn: string;
  minPoints: number;
  maxPoints: number;
  badge: string;
  badgeColor: string;
  perkAr: string;
  perkEn: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    level: 1,
    titleAr: 'سوابر جديد',
    titleEn: 'Rookie Swapper',
    minPoints: 0,
    maxPoints: 100,
    badge: 'ROOKIE',
    badgeColor: '#c5c9ac',
    perkAr: 'التبادل المباشر 1:1 في كافة مناطق ونقاط القاهرة',
    perkEn: 'Direct 1:1 barter across all Cairo partner hubs',
  },
  {
    level: 2,
    titleAr: 'سوابر موثق',
    titleEn: 'Verified Swapper',
    minPoints: 100,
    maxPoints: 250,
    badge: 'VERIFIED',
    badgeColor: '#caf300',
    perkAr: 'علامة التوثيق وخاصية الهاند شيك السريع بدون انتظار',
    perkEn: 'Verified checkmark + fast QR Handshake authentication',
  },
  {
    level: 3,
    titleAr: 'خبير ستريتوير',
    titleEn: 'Streetwear Vanguard',
    minPoints: 250,
    maxPoints: 500,
    badge: 'VANGUARD',
    badgeColor: '#38bdf8',
    perkAr: 'تبادل حزم متعددة (Multi-Piece Bundles) وأولوية الظهور في Discover',
    perkEn: 'Multi-piece bundle trades & priority discovery placement',
  },
  {
    level: 4,
    titleAr: 'أرشيف كوريتور',
    titleEn: 'Archive Curator',
    minPoints: 500,
    maxPoints: 1000,
    badge: 'CURATOR',
    badgeColor: '#a855f7',
    perkAr: 'معاملات فرق الكاش المعفاة من رسوم المعاينة وشارة خبير الأرشيف',
    perkEn: 'Zero-fee cash-delta barter + exclusive archive curator badge',
  },
  {
    level: 5,
    titleAr: 'أيقونة ستريت',
    titleEn: 'Cult Icon',
    minPoints: 1000,
    maxPoints: 999999,
    badge: 'CULT ICON',
    badgeColor: '#f59e0b',
    perkAr: 'صدارة لوحة شرف القاهرة والوصول الحصري لأندر قطع الأرشيف',
    perkEn: 'Top Cairo leaderboard standing + VIP drop access',
  },
];

export interface UserRankCalculation {
  currentTier: RankTier;
  nextTier: RankTier | null;
  level: number;
  progressPercent: number;
  pointsToNext: number;
  currentPoints: number;
}

export function calculateUserRank(points: number = 0): UserRankCalculation {
  const safePoints = Math.max(0, points);
  let currentTier = RANK_TIERS[0];

  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (safePoints >= RANK_TIERS[i].minPoints) {
      currentTier = RANK_TIERS[i];
    }
  }

  const currentIndex = RANK_TIERS.findIndex((t) => t.level === currentTier.level);
  const nextTier = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;

  let progressPercent = 100;
  let pointsToNext = 0;

  if (nextTier) {
    const range = nextTier.minPoints - currentTier.minPoints;
    const gained = safePoints - currentTier.minPoints;
    progressPercent = Math.min(100, Math.max(0, Math.round((gained / range) * 100)));
    pointsToNext = Math.max(0, nextTier.minPoints - safePoints);
  }

  return {
    currentTier,
    nextTier,
    level: currentTier.level,
    progressPercent,
    pointsToNext,
    currentPoints: safePoints,
  };
}
