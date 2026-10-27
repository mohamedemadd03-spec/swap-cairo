import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WardrobeItem, Garment, SwapOffer } from '../types/swap';
import { calculateUserRank } from './progression';
import { validateHandshakePassCode } from './swapLogic';

test('Fresh User Live Journey: Zero-Demo Registration -> Upload -> Swap Proposal -> Handshake -> Level Up', () => {
  // 1. Initial Fresh User State (No Demos)
  let userTrustPoints = 50; // Starter phone verification bonus
  let wardrobe: WardrobeItem[] = []; // Zero demo items
  let offers: SwapOffer[] = []; // Zero demo deals
  let garmentsFeed: Garment[] = []; // Neighborhood feed

  // Verify fresh baseline
  let rank = calculateUserRank(userTrustPoints);
  assert.equal(wardrobe.length, 0, 'Fresh wardrobe must be completely empty');
  assert.equal(offers.length, 0, 'Fresh offers must be completely empty');
  assert.equal(rank.level, 1, 'Fresh user must start at Level 1');
  assert.equal(rank.currentTier.titleEn, 'Rookie Swapper');
  assert.equal(rank.progressPercent, 50);

  // 2. User uploads a piece to their closet
  const uploadedPiece: WardrobeItem = {
    id: 'wardrobe_real_01',
    title: 'Vintage Supreme Motion Logo Tee',
    categoryTag: 'TEES • M',
    category: 'tees',
    size: 'M',
    value: 750,
    currency: 'EGP',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    condition: '9.5 / 10',
    description: 'Authentic washed black motion logo tee from Cairo vault.',
  };

  // Add to closet and award +15 points
  wardrobe.push(uploadedPiece);
  userTrustPoints += 15;

  // Publish to neighborhood Discover feed
  const feedPiece: Garment = {
    id: uploadedPiece.id,
    title: uploadedPiece.title,
    brand: 'Supreme',
    lot: 'LOT #0199',
    estValue: uploadedPiece.value,
    currency: 'EGP',
    condition: uploadedPiece.condition || '9.5 / 10',
    size: uploadedPiece.size,
    badge: 'JUST LISTED',
    archiveTag: 'LOCAL VAULT',
    distance: '0.1 km • Your Closet',
    city: 'Espresso Lab Degla Hub #04',
    imageUrl: uploadedPiece.imageUrl,
    description: uploadedPiece.description || '',
    category: 'tees',
    owner: {
      name: 'Fresh Swapper',
      handle: '@fresh_cairo',
      isPro: false,
      rating: 5.0,
      swapCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      location: 'Maadi, Cairo',
    },
    tags: ['Verified', 'Supreme'],
  };
  garmentsFeed.push(feedPiece);

  assert.equal(wardrobe.length, 1, 'Closet must hold exactly 1 uploaded item');
  assert.equal(userTrustPoints, 65, 'Points must be 65 after listing piece');
  assert.equal(garmentsFeed.length, 1, 'Feed must contain newly listed piece');

  // 3. Propose a Swap Trade with another Cairo swapper
  const partnerGarment: Garment = {
    id: 'cairo_vault_nike',
    title: 'Vintage Nike ACG Storm-Fit Shell',
    brand: 'Nike ACG',
    lot: 'LOT #7721',
    estValue: 900,
    currency: 'EGP',
    condition: '9.8 / 10',
    size: 'L',
    badge: 'TECHNICAL VINTAGE',
    archiveTag: '3-LAYER',
    distance: '1.2 km',
    city: 'Maadi Hub',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    description: 'Black ACG waterproof jacket.',
    category: 'jacket',
    owner: {
      name: 'Karim Cairo',
      handle: '@karim_acg',
      isPro: true,
      rating: 4.9,
      swapCount: 18,
      avatarUrl: '',
      location: 'Degla, Maadi',
    },
    tags: ['#ACG', '#NIKE'],
  };

  const tradeOffer: SwapOffer = {
    id: 'offer_live_882',
    partner: partnerGarment.owner,
    theirItem: {
      id: partnerGarment.id,
      title: partnerGarment.title,
      imageUrl: partnerGarment.imageUrl,
      value: partnerGarment.estValue,
      size: partnerGarment.size,
    },
    yourItem: {
      id: uploadedPiece.id,
      title: uploadedPiece.title,
      imageUrl: uploadedPiece.imageUrl,
      value: uploadedPiece.value,
      size: uploadedPiece.size,
    },
    cashTopUp: 150,
    topUpBy: 'you',
    status: 'accepted',
    negotiationRounds: 1,
    hubLocation: 'Espresso Lab Degla Hub #04',
    scheduledTime: 'Today at 6:00 PM',
    securityPassCode: 'SWAP-CAI-5591',
    timestamp: 'Just now',
    co2SavedKg: 3.5,
  };
  offers.push(tradeOffer);
  assert.equal(offers.length, 1, 'Offer must be active');

  // 4. In-Person Handshake at Espresso Lab Degla Hub
  const validation = validateHandshakePassCode(tradeOffer.securityPassCode || '', 'SWAP-CAI-5591');
  assert.equal(validation.valid, true, 'QR Handshake passcode must validate');

  // Complete the trade:
  // Award +75 Handshake points + +25 5-Star rating bonus
  const rating = 5;
  const earnedPoints = 75 + (rating >= 5 ? 25 : 0);
  userTrustPoints += earnedPoints;

  // Swap wardrobe items:
  // Remove traded out piece, add acquired piece
  wardrobe = wardrobe.filter((w) => w.id !== tradeOffer.yourItem.id);
  const acquiredPiece: WardrobeItem = {
    id: `swapped-${partnerGarment.id}`,
    title: partnerGarment.title,
    categoryTag: `SWAPPED • ${partnerGarment.size}`,
    size: partnerGarment.size,
    value: partnerGarment.estValue,
    currency: 'EGP',
    status: 'available',
    badgeLabel: 'Acquired via Swap',
    imageUrl: partnerGarment.imageUrl,
    condition: partnerGarment.condition,
  };
  wardrobe.unshift(acquiredPiece);

  tradeOffer.status = 'completed';

  // 5. Verify Progression & Level Up!
  rank = calculateUserRank(userTrustPoints);
  assert.equal(userTrustPoints, 165, 'Total points must be 65 + 75 + 25 = 165 pts');
  assert.equal(rank.level, 2, 'User MUST level up to Level 2 (Verified Swapper)');
  assert.equal(rank.currentTier.titleEn, 'Verified Swapper');
  assert.equal(rank.currentTier.titleAr, 'سوابر موثق');
  assert.equal(wardrobe.length, 1, 'Wardrobe has 1 piece (the newly acquired ACG jacket)');
  assert.equal(wardrobe[0].title, partnerGarment.title);

  // Financial impact calculation:
  const completedCount = offers.filter((o) => o.status === 'completed').length;
  const totalSaved = offers
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.theirItem.value || 0), 0);
  assert.equal(completedCount, 1, 'Completed swaps count must be exactly 1');
  assert.equal(totalSaved, 900, 'Total saved vs retail must be 900 EGP');
});
