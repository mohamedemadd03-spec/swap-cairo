import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCashDelta,
  calculateCo2Preserved,
  filterGarments,
  formatCurrency,
  validateHandshakePassCode,
  resolveCompetingOffersCleanup,
} from './swapLogic';
import {
  recordSwipeAction,
  loadTasteProfile,
  rankCairoFeedEngine,
  calculateClosetSynergyScore,
} from '../services/recommendationEngine';
import { Garment, WardrobeItem, SwapOffer } from '../types/swap';
import { INITIAL_GARMENTS, INITIAL_WARDROBE } from '../data/mockData';

// ==============================================================================
// 1. END-TO-END SIMULATED REAL USER JOURNEY
// ==============================================================================

test('User Journey 1: Complete Barter Lifecycle (Discover -> Propose -> Negotiate -> Lock -> Handshake -> Wardrobe Transition)', () => {
  // Step 1: User's initial state
  let userTrustPoints = 120;
  let userWardrobe: WardrobeItem[] = [
    {
      id: 'my-item-1',
      title: 'Carhartt WIP Detroit Canvas',
      categoryTag: 'JACKET • WORKWEAR',
      category: 'jacket',
      value: 850,
      size: "MEN'S L",
      status: 'available',
      currency: 'EGP',
      condition: '9.5 / 10',
      description: 'Clean canvas jacket',
      imageUrl: 'https://example.com/carhartt.jpg',
    },
    {
      id: 'my-item-2',
      title: 'Stussy Basic Tee',
      categoryTag: 'TEES • GRAPHIC',
      category: 'tees',
      value: 350,
      size: "MEN'S L",
      status: 'available',
      currency: 'EGP',
      condition: '9.0 / 10',
      description: 'Graphic tee',
      imageUrl: 'https://example.com/stussy.jpg',
    },
  ];

  // Step 2: User finds a desired garment on Discover
  const targetGarment: Garment = {
    id: 'cairo-grail-1',
    title: "Arc'teryx Alpha SV Shell",
    brand: "Arc'teryx",
    estValue: 1400,
    category: 'jacket',
    size: "MEN'S L",
    distance: '1.8 KM',
    city: 'Maadi, Cairo',
    currency: 'EGP',
    condition: '9.8 / 10',
    owner: {
      name: 'Kareem T.',
      handle: '@kareem_tech',
      isPro: true,
      rating: 4.9,
      swapCount: 22,
      avatarUrl: 'https://example.com/avatar.jpg',
      location: 'Degla Hub',
    },
    angles: { front: '', back: '' },
    description: '3-layer Gore-Tex waterproof jacket',
    lot: 'LOT #CAI-1400',
    tags: ['#GORPCORE', '#WATERPROOF'],
    badge: 'TECHNICAL GRAIL',
    archiveTag: '3-LAYER GORE-TEX',
    imageUrl: 'https://example.com/arcteryx.jpg',
  };

  // Step 3: User proposes trade with bundle (Item 1 + Item 2 = 850 + 350 = 1200 EGP)
  const offeredItems = [userWardrobe[0], userWardrobe[1]];
  const totalOfferedValue = offeredItems.reduce((acc, curr) => acc + curr.value, 0);
  assert.equal(totalOfferedValue, 1200);

  // Calculate Cash Delta: Target 1400 - Offered 1200 = 200 EGP top-up required from you
  const delta = calculateCashDelta(totalOfferedValue, targetGarment.estValue);
  assert.equal(delta.isBalanced, false);
  assert.equal(delta.payer, 'you');
  assert.equal(delta.cashAmount, 200);

  // Step 4: Create offer with security code
  const generatedCode = 'SWP-8842';
  const newOffer: SwapOffer = {
    id: 'offer-sim-001',
    direction: 'sent',
    partner: targetGarment.owner,
    theirItem: {
      id: targetGarment.id,
      title: targetGarment.title,
      imageUrl: targetGarment.imageUrl,
      value: targetGarment.estValue,
      size: targetGarment.size,
      brand: targetGarment.brand,
    },
    yourItem: {
      id: offeredItems[0].id,
      title: offeredItems[0].title,
      imageUrl: offeredItems[0].imageUrl,
      value: offeredItems[0].value,
      size: offeredItems[0].size,
    },
    yourItems: offeredItems.map((i) => ({
      id: i.id,
      title: i.title,
      imageUrl: i.imageUrl,
      value: i.value,
      size: i.size,
    })),
    cashTopUp: 200,
    topUpBy: 'you',
    hubLocation: 'Maadi Hub',
    status: 'pending',
    timestamp: 'Just now',
    securityPassCode: generatedCode,
    co2SavedKg: calculateCo2Preserved(3),
  };

  assert.equal(newOffer.status, 'pending');
  assert.equal(newOffer.cashTopUp, 200);
  assert.equal(newOffer.topUpBy, 'you');
  assert.ok((newOffer.co2SavedKg || 0) > 10, 'Should preserve significant CO2');

  // Step 5: Partner accepts deal -> 48-Hour Deal Lock is engaged
  newOffer.status = 'accepted';
  const now = Date.now();
  newOffer.lockExpiresAt = now + 48 * 60 * 60 * 1000;
  assert.ok(newOffer.lockExpiresAt > now);

  // Wardrobe items involved become pending in deal
  userWardrobe = userWardrobe.map((w) =>
    offeredItems.some((i) => i.id === w.id) ? { ...w, status: 'pending' as const } : w
  );
  assert.equal(userWardrobe[0].status, 'pending');
  assert.equal(userWardrobe[1].status, 'pending');

  // Step 6: Competing offers on locked items must be auto-declined
  const allOffers: SwapOffer[] = [
    newOffer,
    {
      id: 'offer-competing-002',
      status: 'pending',
      partner: { name: 'Stranger', handle: '@stranger', isPro: false, rating: 4, swapCount: 1, avatarUrl: '', location: '' },
      theirItem: { id: 'other-1', title: 'Vintage Hoodie', imageUrl: '', value: 800, size: 'L' },
      yourItem: { id: userWardrobe[0].id, title: userWardrobe[0].title, imageUrl: '', value: 850, size: 'L' },
      cashTopUp: 0,
      topUpBy: 'none',
      hubLocation: 'Maadi Hub',
      securityPassCode: 'SWP-1111',
      timestamp: '1h ago',
      co2SavedKg: 0,
    },
  ];

  const cleanedOffers = resolveCompetingOffersCleanup(allOffers, newOffer.id);
  assert.equal(cleanedOffers[0].status, 'accepted');
  assert.equal(cleanedOffers[1].status, 'declined', 'Competing offer on locked item must be auto-declined');

  // Step 7: Swappers meet at Cairo Hub & verify Handshake code
  const isCodeValid = validateHandshakePassCode('swp-8842', generatedCode);
  assert.equal(isCodeValid.valid, true);

  // Complete Handshake
  newOffer.status = 'completed';
  userTrustPoints += 50; // Earned +50 Trust Points!

  // Acquired piece added to user wardrobe, traded pieces removed
  userWardrobe = userWardrobe.filter((w) => !offeredItems.some((i) => i.id === w.id));
  const acquiredPiece: WardrobeItem = {
    id: `swapped-${targetGarment.id}`,
    title: targetGarment.title,
    categoryTag: 'JACKET • SHELL',
    category: targetGarment.category,
    value: targetGarment.estValue,
    size: targetGarment.size,
    status: 'available',
    currency: 'EGP',
    condition: targetGarment.condition,
    description: targetGarment.description || '',
    imageUrl: targetGarment.imageUrl,
  };
  userWardrobe.push(acquiredPiece);

  // Final Assertions on Successful Swap
  assert.equal(userWardrobe.length, 1);
  assert.equal(userWardrobe[0].title, "Arc'teryx Alpha SV Shell");
  assert.equal(userWardrobe[0].status, 'available');
  assert.equal(userTrustPoints, 170, 'Trust points must increase by 50');
  assert.equal(newOffer.status, 'completed');
});

// ==============================================================================
// 2. SIMULATED TASTE ADAPTATION & ANTI-REPETITION FEED STRESS TEST
// ==============================================================================

test('User Journey 2: Browsing & Rapid Swipe Session (Silent Taste Learning & Infinite Feed Freshness)', () => {
  let profile = loadTasteProfile();
  const sessionSwiped = new Set<string>();

  const testFeed = [...INITIAL_GARMENTS];
  assert.ok(testFeed.length >= 6);

  // 1. Initial state: user has 0 swipes
  assert.equal(profile.totalSwipes, 0);

  // 2. User swipes right on Salomon XT-6 (Gorpcore / Shoes)
  const salomonItem = testFeed.find((g) => g.brand.toLowerCase() === 'salomon') || testFeed[0];
  profile = recordSwipeAction(profile, salomonItem, 'like');
  sessionSwiped.add(salomonItem.id);

  assert.equal(profile.totalSwipes, 1);
  assert.ok(profile.brandAffinities.salomon > 0);
  assert.ok(profile.archetypeAffinities.GORPCORE > 0, 'Should boost GORPCORE cluster');

  // 3. User passes on Supreme Box Logo Hoodie
  const supremeItem = testFeed.find((g) => g.brand.toLowerCase() === 'supreme') || testFeed[1];
  profile = recordSwipeAction(profile, supremeItem, 'pass');
  sessionSwiped.add(supremeItem.id);

  assert.equal(profile.totalSwipes, 2);
  assert.equal(profile.passedGarmentIds.includes(supremeItem.id), true);

  // 4. Rank the feed: unswiped items must come first, ranked by Gorpcore / outdoor affinity
  const { unswipedDeck } = rankCairoFeedEngine(
    testFeed,
    profile,
    INITIAL_WARDROBE,
    { sessionSwipedIds: sessionSwiped }
  );

  // Verify no swiped items appear in the unswiped deck
  unswipedDeck.forEach((g) => {
    assert.equal(sessionSwiped.has(g.id), false, `Item ${g.id} was already swiped!`);
  });

  // Verify Arc'teryx (Gorpcore sibling) ranked high among unswiped
  const arcteryxIndex = unswipedDeck.findIndex((g) => g.brand.toLowerCase().includes('arc'));
  if (arcteryxIndex !== -1) {
    assert.ok(arcteryxIndex <= 2, 'Arc’teryx must be prioritized due to Gorpcore cluster synergy');
  }

  // 5. Exhausting the feed: simulate swiping every single item in Cairo
  testFeed.forEach((g) => sessionSwiped.add(g.id));

  const exhaustedResult = rankCairoFeedEngine(
    testFeed,
    profile,
    INITIAL_WARDROBE,
    { sessionSwipedIds: sessionSwiped }
  );

  // Must not throw or produce an empty feed! Recirculation gracefully kicks in
  assert.ok(exhaustedResult.rankedDeck.length > 0, 'Feed must never be blank upon deck exhaustion');
  assert.equal(exhaustedResult.rankedDeck[0].id, salomonItem.id, 'Previously liked item must lead recirculation');
});

// ==============================================================================
// 3. DEFENSIVE SECURITY & INJECTION VULNERABILITY AUDIT
// ==============================================================================

test('Security Audit 1: Malicious Input Sanitization & Handshake Passcode Shielding', () => {
  const legitCode = 'SWP-4491';

  // Test 1: XSS script injection in PIN
  const xssAttempt = validateHandshakePassCode('<script>alert("hacked")</script>', legitCode);
  assert.equal(xssAttempt.valid, false);

  // Test 2: SQL Injection / Command payload in PIN
  const sqlAttempt = validateHandshakePassCode("' OR '1'='1' --", legitCode);
  assert.equal(sqlAttempt.valid, false);

  // Test 3: Null bytes / Traversal in PIN
  const nullByteAttempt = validateHandshakePassCode('SWP-4491\0DROP TABLE', legitCode);
  assert.equal(nullByteAttempt.valid, false);

  // Test 4: Legit code with case-insensitivity and whitespace
  const legitMessy = validateHandshakePassCode('  swp-4491  ', legitCode);
  assert.equal(legitMessy.valid, true);
  assert.equal(legitMessy.normalizedCode, 'SWP-4491');
});

test('Security Audit 2: Extreme Boundaries, Integer Floats & Currency Formatting Robustness', () => {
  // Extreme values
  assert.equal(formatCurrency(0), '0 EGP');
  assert.equal(formatCurrency(999999), '999,999 EGP');
  assert.equal(formatCurrency(-500), '-500 EGP');

  // Cash delta edge cases
  const zeroDelta = calculateCashDelta(0, 0);
  assert.equal(zeroDelta.isBalanced, true);
  assert.equal(zeroDelta.cashAmount, 0);

  // Large price difference (100 EGP vs 1,000,000 EGP)
  const hugeDelta = calculateCashDelta(100, 1000000);
  assert.equal(hugeDelta.isBalanced, false);
  assert.equal(hugeDelta.payer, 'you');
  assert.equal(hugeDelta.cashAmount, 999900);

  // Filter boundary checks with impossible price range [5000, 100]
  const invertedFilter = filterGarments(INITIAL_GARMENTS, {
    category: 'all',
    priceRange: [5000, 100],
    maxDistanceKm: 15,
    minCondition: 8,
    onlyPro: false,
    sizes: [],
  });
  // Must handle gracefully without crashing (0 items returned)
  assert.ok(Array.isArray(invertedFilter));
});

test('Security Audit 3: Closet Synergy with Empty or Locked Wardrobes', () => {
  const target = INITIAL_GARMENTS[0];

  // Empty wardrobe
  const emptyResult = calculateClosetSynergyScore(target, []);
  assert.equal(emptyResult.synergyScore, 0);
  assert.equal(emptyResult.bestMatchItem, undefined);

  // Wardrobe with only pending items
  const pendingWardrobe: WardrobeItem[] = [
    {
      id: 'w-pending-1',
      title: 'Pending item',
      categoryTag: 'JACKET',
      value: target.estValue,
      size: 'L',
      status: 'pending',
      currency: 'EGP',
      imageUrl: '',
      condition: '9/10',
      description: '',
    },
  ];
  const pendingResult = calculateClosetSynergyScore(target, pendingWardrobe);
  assert.equal(pendingResult.synergyScore, 0, 'Pending items in deals must never be suggested for trades');
});
