/**
 * SWAP // Domain Types
 */

export interface Owner {
  name: string;
  handle: string;
  isPro: boolean;
  rating: number;
  swapCount: number;
  avatarUrl: string;
  location: string;
}

export interface Garment {
  id: string;
  title: string;
  brand: string;
  lot: string;
  estValue: number;
  buyoutPrice?: number; // Instant cash buyout price without trade
  currency: string;
  condition: string;
  size: string;
  badge: string;
  archiveTag: string;
  distance: string;
  city: string;
  owner: Owner;
  tags: string[];
  imageUrl: string;
  description: string;
  category: 'hoodie' | 'jacket' | 'denim' | 'shoes' | 'tees' | 'flannel' | 'accessories';
  isStashed?: boolean;
  isTraded?: boolean;
  isCommunitySpotlight?: boolean;
  barcode?: string;
  angles?: {
    front: string;
    back: string;
    tag?: string;
  };
  isLiveCameraVerified?: boolean;
  authenticityTier?: AuthenticityTier;
  hasOriginalBox?: boolean;
  boxCondition?: 'mint' | 'damaged' | 'replacement' | 'no_box';
  authenticityChecklist?: AuthenticityChecklist;
}

export interface WardrobeItem {
  id: string;
  title: string;
  categoryTag: string;
  size: string;
  value: number;
  currency: string;
  status: 'available' | 'pending' | 'hot' | 'inquiries' | 'sold';
  badgeLabel?: string;
  imageUrl: string;
  matchesCount?: number;
  likesCount?: number;
  isFeatured?: boolean;
  offerStatus?: string;
  condition?: string;
  description?: string;
  angles?: {
    front: string;
    back: string;
    tag?: string;
  };
  isLiveCameraVerified?: boolean;
  authenticityTier?: AuthenticityTier;
  hasOriginalBox?: boolean;
  boxCondition?: 'mint' | 'damaged' | 'replacement' | 'no_box';
  authenticityChecklist?: AuthenticityChecklist;
  category?: 'hoodie' | 'jacket' | 'denim' | 'shoes' | 'tees' | 'flannel' | 'accessories';
}

export type AuthenticityTier = 'og_box_verified' | 'hub_inspected' | 'community_vintage';

export interface AuthenticityChecklist {
  tagsInspected: boolean;
  boxIncluded: boolean;
  boxCondition?: 'mint' | 'damaged' | 'replacement' | 'no_box';
  receiptAvailable: boolean;
  hardwareChecked: boolean;
  wearGrade?: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  priority: string;
  preferredSize: string;
  notes: string;
  imageUrl: string;
  matchesNearby: number;
}

export interface BundleItem {
  id: string;
  title: string;
  imageUrl: string;
  value: number;
  size: string;
}

export interface CounterOffer {
  cashDelta: number;
  topUpBy: 'you' | 'partner';
  note?: string;
  proposedHub?: string;
  proposedTime?: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface SwapOffer {
  id: string;
  direction?: 'incoming' | 'sent';
  partner: Owner;
  theirItem: {
    id: string;
    title: string;
    imageUrl: string;
    value: number;
    size: string;
    brand?: string;
    condition?: string;
    description?: string;
    category?: string;
  };
  yourItem: {
    id: string;
    title: string;
    imageUrl: string;
    value: number;
    size: string;
    brand?: string;
    condition?: string;
    description?: string;
    category?: string;
  };
  bundleItems?: BundleItem[]; // Support for 2-for-1 or 3-for-1 bundles
  yourItems?: BundleItem[]; // All items offered by you
  partnerItems?: BundleItem[]; // All items offered by partner
  isBundle?: boolean;
  tradeRatio?: '1:1' | '2:1' | '1:2' | 'bundle' | string;
  cashTopUp: number; // >0 means you or partner adds cash
  topUpBy: 'you' | 'partner' | 'none';
  status: 'pending' | 'countered' | 'maybe' | 'inquiry_pending' | 'accepted' | 'declined' | 'scheduled_hub' | 'completed';
  negotiationRounds?: number; // 1, 2, or 3 (max 3 rounds)
  isFinalOffer?: boolean; // Whether the other party marked this proposal as their final offer
  isStandingFirm?: boolean; // Whether party is standing firm on original offer without sweetening
  standingFirmBy?: 'you' | 'partner';
  extraItemsOffered?: BundleItem[]; // Additional pieces (e.g., +1 T-shirt added to sweeten the deal)
  fitCheckPhoto?: string; // Captured Polaroid image data URL / photo URL
  fitCheckTimestamp?: string; // When the fit check was snapped
  fitCheckCaption?: string; // Custom note or caption
  pendingQuestion?: {
    question: string;
    askedAt: string;
    answer?: string;
    answeredAt?: string;
    asker: 'you' | 'them';
  };
  hubLocation: string;
  agreedLocation?: string;
  scheduledTime?: string;
  acceptedAt?: number;
  lockExpiresAt?: number;
  cancellationReason?: 'too_far' | 'condition_mismatch' | 'cant_agree' | 'partner_flaked' | 'other';
  cancelledBy?: 'you' | 'partner';
  gpsMeetupPin?: {
    lat: number;
    lng: number;
    label: string;
    distanceMeters?: number;
    verifiedAt?: string;
  };
  securityPassCode: string;
  barcode?: string;
  trustPointsEarned?: number;
  trustPointsAwarded?: boolean;
  timestamp: string;
  co2SavedKg: number;
  counterOffer?: CounterOffer;
  counterDetails?: {
    cashTopUp?: number;
    requestedItemId?: string;
    requestedItemTitle?: string;
    note?: string;
  };
  messages?: ChatMessage[];
}

export interface BuyoutOrder {
  id: string;
  garment: Garment;
  buyerHandle: string;
  purchasePrice: number;
  currency: string;
  paymentMethod: 'cash_at_hub' | 'instapay' | 'vodafone_cash' | 'card_escrow';
  inspectionRequested: boolean;
  inspectionFee: number;
  totalAmount: number;
  pickupHub: string;
  securityPassCode: string;
  pickupPin: string;
  status: 'confirmed_escrow' | 'ready_for_pickup' | 'completed';
  timestamp: string;
  estimatedReadyDate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'you' | 'them';
  text: string;
  timestamp: string;
  attachmentUrl?: string;
  counterOffer?: CounterOffer;
  isReceipt?: boolean;
  gpsPin?: {
    lat: number;
    lng: number;
    label: string;
    distanceKm?: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  handle: string;
  name: string;
  avatarUrl: string;
  city: string;
  co2SavedKg: number;
  swapsCompleted: number;
  buyoutsCompleted: number;
  badge: string;
}

export interface HubLocation {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  distance: string;
  address: string;
  activeSwappers: number;
  hours: string;
  lat?: number;
  lng?: number;
}

export interface FilterSettings {
  searchQuery?: string;
  category: string;
  maxDistanceKm: number;
  minCondition: number;
  priceRange: [number, number];
  onlyPro: boolean;
  sizes: string[];
}

export type TelemetryEventType =
  | 'session_enter'
  | 'session_heartbeat'
  | 'session_leave'
  | 'view_item'
  | 'filter_change'
  | 'offer_created'
  | 'offer_countered'
  | 'handshake_completed'
  | 'trade_rated'
  | 'fit_check_uploaded'
  | 'auth_state_change'
  | 'hub_changed';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  sessionId: string;
  userHandle: string;
  device: string;
  timestamp: string;
  summaryAr: string;
  summaryEn: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export interface LiveRadarPulse {
  onlineCount: number;
  activeSessions: Array<{
    sessionId: string;
    userHandle: string;
    device: string;
    lastSeen: string;
    ip?: string;
  }>;
  recentEvents: TelemetryEvent[];
  stats: {
    totalVisits: number;
    totalOffers: number;
    totalHandshakes: number;
    totalGarments: number;
    uptimeSeconds: number;
  };
}

export interface ModerationReport {
  id: string;
  garmentId: string;
  garmentTitle: string;
  garmentImageUrl: string;
  garmentOwnerHandle: string;
  reason: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  status: 'pending' | 'resolved_deleted' | 'resolved_dismissed';
}

