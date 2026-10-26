import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSwipeState,
  calculateCashDelta,
  calculateCo2Preserved,
  filterGarments,
  formatCurrency,
  validateHandshakePassCode,
  resolveCompetingOffersCleanup,
} from './swapLogic';
import { Garment, WardrobeItem } from '../types/swap';

test('calculateSwipeState correctly identifies swap and pass gestures', () => {
  const neutral = calculateSwipeState(10);
  assert.equal(neutral.action, 'neutral');
  assert.equal(neutral.likeStampOpacity, 0);

  const swap = calculateSwipeState(150);
  assert.equal(swap.action, 'swap');
  assert.ok(swap.likeStampOpacity > 0.9);
  assert.equal(swap.passStampOpacity, 0);

  const pass = calculateSwipeState(-150);
  assert.equal(pass.action, 'pass');
  assert.ok(pass.passStampOpacity > 0.9);
  assert.equal(pass.likeStampOpacity, 0);
});

test('calculateCashDelta computes fair balance', () => {
  // Fair trade (close values)
  const balanced = calculateCashDelta(450, 460);
  assert.equal(balanced.isBalanced, true);
  assert.equal(balanced.cashAmount, 0);

  // You offer 450 for a 600 item -> you top up 150
  const topUpYou = calculateCashDelta(450, 600);
  assert.equal(topUpYou.isBalanced, false);
  assert.equal(topUpYou.payer, 'you');
  assert.equal(topUpYou.cashAmount, 150);

  // You offer 850 for a 450 item -> partner tops up 400
  const topUpPartner = calculateCashDelta(850, 450);
  assert.equal(topUpPartner.isBalanced, false);
  assert.equal(topUpPartner.payer, 'partner');
  assert.equal(topUpPartner.cashAmount, 400);
});

test('calculateCo2Preserved computes sustainability impact correctly', () => {
  assert.equal(calculateCo2Preserved(0), 0);
  // 5 garments * 3.6 = 18.0 kg
  assert.equal(calculateCo2Preserved(5), 18);
  // 24 garments * 3.6 = 86.4 kg (or custom e.g. 24 * ~0.76 = 18.4)
  assert.ok(calculateCo2Preserved(24, 0.7667) >= 18.4);
});

test('filterGarments filters items by category and price range', () => {
  const mockGarments: Garment[] = [
    {
      id: '1',
      title: 'Vintage Hoodie',
      brand: 'Nike',
      lot: 'LOT #1',
      estValue: 450,
      currency: 'EGP',
      condition: '9.5 / 10',
      size: 'L',
      badge: 'AUTHENTIC VINTAGE',
      archiveTag: 'ARCHIVE',
      distance: '2km',
      city: 'Cairo',
      owner: { name: 'Omar', handle: '@omar', isPro: true, rating: 4.9, swapCount: 38, avatarUrl: '', location: 'Maadi' },
      tags: ['#RETRO'],
      imageUrl: '',
      description: 'Classic swoosh',
      category: 'hoodie',
    },
    {
      id: '2',
      title: 'Denim Jeans',
      brand: 'Carhartt',
      lot: 'LOT #2',
      estValue: 600,
      currency: 'EGP',
      condition: '9.0 / 10',
      size: '32',
      badge: 'ARCHIVE',
      archiveTag: 'WORKWEAR',
      distance: '3km',
      city: 'Cairo',
      owner: { name: 'Ali', handle: '@ali', isPro: false, rating: 4.6, swapCount: 12, avatarUrl: '', location: 'Zamalek' },
      tags: ['#WORKWEAR'],
      imageUrl: '',
      description: 'Double knee',
      category: 'denim',
    },
  ];

  const hoodieOnly = filterGarments(mockGarments, { category: 'hoodie' });
  assert.equal(hoodieOnly.length, 1);
  assert.equal(hoodieOnly[0].id, '1');

  const proOnly = filterGarments(mockGarments, { onlyPro: true });
  assert.equal(proOnly.length, 1);
  assert.equal(proOnly[0].owner.handle, '@omar');

  const budgetFilter = filterGarments(mockGarments, { priceRange: [500, 1000] });
  assert.equal(budgetFilter.length, 1);
  assert.equal(budgetFilter[0].id, '2');
});

test('formatCurrency formats values nicely', () => {
  assert.equal(formatCurrency(450, 'EGP'), '450 EGP');
  assert.equal(formatCurrency(1200, 'EGP'), '1,200 EGP');
});

test('validateHandshakePassCode verifies Giver-to-Receiver QR passcodes and blocks injection', () => {
  const validExact = validateHandshakePassCode('swp-7740', 'SWP-7740');
  assert.equal(validExact.valid, true);
  assert.equal(validExact.normalizedCode, 'SWP-7740');

  const malicious = validateHandshakePassCode('<script>alert(1)</script>', 'SWP-7740');
  assert.equal(malicious.valid, false);
});

test('resolveCompetingOffersCleanup automatically declines competing offers on accepted items', () => {
  const sampleOffers = [
    {
      id: 'offer-1',
      status: 'pending',
      yourItem: { id: 'wardrobe-1' },
      theirItem: { id: 'feed-10' },
    },
    {
      id: 'offer-2',
      status: 'maybe',
      yourItem: { id: 'wardrobe-1' },
      theirItem: { id: 'feed-20' },
    },
    {
      id: 'offer-3',
      status: 'pending',
      yourItem: { id: 'wardrobe-2' },
      theirItem: { id: 'feed-30' },
    },
  ];

  const resolved = resolveCompetingOffersCleanup(sampleOffers, 'offer-1');
  assert.equal(resolved[0].status, 'accepted');
  assert.equal(resolved[1].status, 'declined'); // Competing offer on wardrobe-1 auto-declined
  assert.equal(resolved[2].status, 'pending'); // Unrelated offer untouched
});

test('translations dictionary maintains 100% key parity between EN and AR', async () => {
  const { translations } = await import('../i18n/translations');
  const enKeys = Object.keys(translations.en).sort();
  const arKeys = Object.keys(translations.ar).sort();

  assert.deepEqual(enKeys, arKeys, 'EN and AR dictionaries must have identical keys');

  for (const key of enKeys) {
    const enVal = (translations.en as any)[key];
    const arVal = (translations.ar as any)[key];
    assert.ok(typeof enVal === 'string' && enVal.length > 0, `EN key ${key} must not be empty`);
    assert.ok(typeof arVal === 'string' && arVal.length > 0, `AR key ${key} must not be empty`);
  }
});

test('hapticEngine handles all haptic pattern types gracefully in node/headless environment', async () => {
  const { hapticEngine } = await import('../services/haptics');
  assert.ok(hapticEngine, 'hapticEngine must be exported');
  
  // Verify it doesn't throw on any pattern
  hapticEngine.trigger('light');
  hapticEngine.trigger('medium');
  hapticEngine.trigger('heavy');
  hapticEngine.trigger('trade');
  hapticEngine.trigger('nudge');
  hapticEngine.trigger('handshake');
  hapticEngine.trigger('warning');
  hapticEngine.trigger('success');

  const initialEnabled = hapticEngine.getEnabled();
  hapticEngine.toggle();
  assert.equal(hapticEngine.getEnabled(), !initialEnabled);
  hapticEngine.toggle();
  assert.equal(hapticEngine.getEnabled(), initialEnabled);
});

test('recommendationEngine detects archetypes and computes closet trade synergy accurately', async () => {
  const {
    detectGarmentArchetypes,
    calculateClosetSynergyScore,
    recordSwipeAction,
    loadTasteProfile,
    rankCairoFeedEngine,
  } = await import('../services/recommendationEngine');

  const arcteryxGarment: Garment = {
    id: 'test-arc',
    title: "Arc'teryx Alpha SV Shell",
    brand: "Arc'teryx",
    estValue: 1400,
    category: 'jacket',
    size: "MEN'S L",
    badge: 'TECHNICAL GRAIL',
    archiveTag: '3-LAYER GORE-TEX',
    imageUrl: 'https://example.com/arcteryx.jpg',
    tags: ['#GORPCORE', '#WATERPROOF'],
    distance: '1.2 KM',
    city: 'Maadi',
    currency: 'EGP',
    condition: '9.5 / 10',
    owner: { name: 'Ali', handle: '@ali', isPro: true, rating: 5, swapCount: 10, avatarUrl: '', location: '' },
    angles: { front: '', back: '' },
    description: 'Gore-Tex technical shell',
    lot: 'LOT-1',
  };

  const detected = detectGarmentArchetypes(arcteryxGarment);
  assert.ok(detected.length > 0);
  assert.equal(detected[0].archetype, 'GORPCORE');

  const sampleWardrobe: WardrobeItem[] = [
    {
      id: 'w-1',
      title: 'Carhartt Detroit',
      categoryTag: 'JACKET • CANVAS',
      value: 1350,
      size: "MEN'S L",
      category: 'jacket',
      status: 'available',
      currency: 'EGP',
      imageUrl: '',
      condition: '9 / 10',
      description: '',
    },
  ];

  // Value difference is 50 EGP (1400 vs 1350) -> should have high equity synergy
  const synergy = calculateClosetSynergyScore(arcteryxGarment, sampleWardrobe);
  assert.ok(synergy.synergyScore >= 20, 'Should have strong closet synergy score');
  assert.equal(synergy.bestMatchItem?.id, 'w-1');
  assert.equal(synergy.deltaAmount, 50);

  // Record a swipe action and verify taste profile adapts
  let profile = loadTasteProfile();
  profile = recordSwipeAction(profile, arcteryxGarment, 'like');
  assert.ok(profile.archetypeAffinities.GORPCORE > 0);
  assert.ok(profile.brandAffinities.arcteryx > 0);
  assert.equal(profile.likedGarmentIds.includes('test-arc'), true);

  // Verify rankCairoFeedEngine ranks unswiped first
  const { rankedDeck, unswipedDeck } = rankCairoFeedEngine(
    [arcteryxGarment],
    profile,
    sampleWardrobe,
    { sessionSwipedIds: new Set() }
  );
  assert.equal(rankedDeck.length, 1);
  assert.equal(unswipedDeck.length, 1);
});




