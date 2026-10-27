import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateUserRank, RANK_TIERS } from './progression';

test('calculateUserRank computes correct tiers and progressive perks', () => {
  // 1. Fresh User with 50 starter points (Phone Verification Bonus)
  const fresh = calculateUserRank(50);
  assert.equal(fresh.level, 1, 'Must be Level 1');
  assert.equal(fresh.currentTier.titleEn, 'Rookie Swapper');
  assert.equal(fresh.progressPercent, 50, '50/100 points must be 50%');
  assert.equal(fresh.pointsToNext, 50, 'Must need 50 points to Level 2');

  // 2. User lists 1 piece (+15 pts = 65 pts)
  const listed = calculateUserRank(65);
  assert.equal(listed.level, 1);
  assert.equal(listed.progressPercent, 65);
  assert.equal(listed.pointsToNext, 35);

  // 3. User completes first Handshake (+75 pts = 140 pts) -> LEVEL UP!
  const firstHandshake = calculateUserRank(140);
  assert.equal(firstHandshake.level, 2, 'Must advance to Level 2');
  assert.equal(firstHandshake.currentTier.titleEn, 'Verified Swapper');
  assert.equal(firstHandshake.currentTier.titleAr, 'سوابر موثق');
  assert.ok(firstHandshake.progressPercent > 0);
  assert.equal(firstHandshake.pointsToNext, 110, 'Must need 110 points to Level 3');

  // 4. User receives 5-Star rating bonus (+25 pts = 165 pts)
  const rated = calculateUserRank(165);
  assert.equal(rated.level, 2);
  assert.equal(rated.pointsToNext, 85);

  // 5. Streetwear Vanguard (250+ pts)
  const vanguard = calculateUserRank(320);
  assert.equal(vanguard.level, 3);
  assert.equal(vanguard.currentTier.titleEn, 'Streetwear Vanguard');

  // 6. Archive Curator (500+ pts)
  const curator = calculateUserRank(750);
  assert.equal(curator.level, 4);
  assert.equal(curator.currentTier.titleEn, 'Archive Curator');

  // 7. Cult Icon (1000+ pts)
  const cult = calculateUserRank(1500);
  assert.equal(cult.level, 5);
  assert.equal(cult.currentTier.titleEn, 'Cult Icon');
  assert.equal(cult.nextTier, null, 'Level 5 is apex rank');
});
