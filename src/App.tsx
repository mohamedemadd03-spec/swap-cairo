import { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInAsGuest,
  signInWithPhoneQuick,
  logOut,
  syncWardrobeItemToFirestore,
  deleteGarmentFromFirestore,
  syncOfferToFirestore,
  subscribeToGarments,
  subscribeToOffers,
  updateOfferInFirestore,
} from './firebase/config';

import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DiscoverView } from './components/DiscoverView';
import { ClosetView } from './components/ClosetView';
import { MatchesView } from './components/MatchesView';
import { ProfileView } from './components/ProfileView';

import { FilterModal } from './components/modals/FilterModal';
import { AddItemModal } from './components/modals/AddItemModal';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { ScanModal } from './components/modals/ScanModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { RequestSwapModal } from './components/modals/RequestSwapModal';
import { EditOfferModal } from './components/modals/EditOfferModal';
import { AuthGateModal } from './components/modals/AuthGateModal';
import { LanguageSelectModal } from './components/modals/LanguageSelectModal';
import { LiveRadarModal } from './components/modals/LiveRadarModal';
import { InteractiveNotificationBanner } from './components/notifications/InteractiveNotificationBanner';
import { telemetryService } from './services/telemetry';

import {
  INITIAL_GARMENTS,
  INITIAL_WARDROBE,
  INITIAL_WISHLIST,
  ACTIVE_SWAP_OFFERS,
  INITIAL_BUYOUT_ORDERS,
  INITIAL_LEADERBOARD,
  HUB_LOCATIONS,
} from './data/mockData';
import {
  Garment,
  WardrobeItem,
  WishlistItem,
  SwapOffer,
  BuyoutOrder,
  LeaderboardEntry,
  HubLocation,
  FilterSettings,
} from './types/swap';
import { filterGarments } from './utils/swapLogic';
import { soundFX } from './hooks/useSoundFX';
import {
  loadInitialPersistedState,
  persistStateEverywhere,
  fetchServerPersistedState,
  resetAllPersistedData,
} from './services/dataSync';

export default function App() {
  const initialHydrated = useMemo(
    () =>
      loadInitialPersistedState({
        garments: INITIAL_GARMENTS,
        wardrobe: INITIAL_WARDROBE,
        offers: ACTIVE_SWAP_OFFERS,
        userTrustPoints: 450,
        preferredHubId: HUB_LOCATIONS[0].id,
      }),
    []
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasCompletedLaunchAuth, setHasCompletedLaunchAuth] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swap_launch_auth_done_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(() => {
    try {
      return localStorage.getItem('swap_lang_selected_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [currentHub, setCurrentHub] = useState<HubLocation>(
    () => HUB_LOCATIONS.find((h) => h.id === initialHydrated.preferredHubId) || HUB_LOCATIONS[0]
  );
  const [showBrandToast, setShowBrandToast] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>('Just now');

  // Play "SWAP" brand opening sound on application launch
  useEffect(() => {
    let played = false;

    const playBrandSound = () => {
      if (played) return;
      played = true;
      soundFX.playBrandIntro();
      setShowBrandToast(true);
      setTimeout(() => setShowBrandToast(false), 2400);
      window.removeEventListener('pointerdown', playBrandSound);
      window.removeEventListener('keydown', playBrandSound);
    };

    // Attempt direct autoplay immediately on open
    try {
      soundFX.playBrandIntro();
      setShowBrandToast(true);
      setTimeout(() => setShowBrandToast(false), 2400);
      played = true;
    } catch {
      // Browser autoplay policy requires user gesture
    }

    // Attach listener for first user touch / click to guarantee the sound plays cleanly
    window.addEventListener('pointerdown', playBrandSound, { once: true });
    window.addEventListener('keydown', playBrandSound, { once: true });

    return () => {
      window.removeEventListener('pointerdown', playBrandSound);
      window.removeEventListener('keydown', playBrandSound);
    };
  }, []);

  // Data states (hydrated from localStorage + Server DB)
  const [garments, setGarments] = useState<Garment[]>(initialHydrated.garments);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(initialHydrated.wardrobe);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [offers, setOffers] = useState<SwapOffer[]>(initialHydrated.offers);
  const [leaderboardEntries] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  // Filter settings
  const [filters, setFilters] = useState<FilterSettings>({
    category: 'all',
    maxDistanceKm: 15,
    minCondition: 8.5,
    priceRange: [0, 5000],
    onlyPro: false,
    sizes: [],
  });

  // Modal controls
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLiveRadarOpen, setIsLiveRadarOpen] = useState(false);

  // Active Telemetry and Session Observability (MCP / Live Pulse)
  useEffect(() => {
    const handle = currentUser?.displayName || currentUser?.email?.split('@')[0] || '@swapper_cairo';
    telemetryService.trackEvent('session_enter', {
      summaryAr: 'مستخدم دخل التطبيق الآن',
      summaryEn: 'Swapper joined session',
      userHandle: handle,
    });

    const hbInterval = setInterval(() => {
      telemetryService.trackHeartbeat(handle);
    }, 25000);

    return () => clearInterval(hbInterval);
  }, [currentUser]);

  // Active item contexts for modals
  const [modalSelectedItem, setModalSelectedItem] = useState<WardrobeItem | Garment | null>(null);

  // Request Swap & Trust Points
  const [isRequestSwapOpen, setIsRequestSwapOpen] = useState(false);
  const [requestTargetGarment, setRequestTargetGarment] = useState<Garment | null>(null);
  const [userTrustPoints, setUserTrustPoints] = useState<number>(initialHydrated.userTrustPoints);

  // Reconcile state from Express Server DB on startup
  useEffect(() => {
    fetchServerPersistedState().then((serverState) => {
      if (!serverState) return;
      if (Array.isArray(serverState.garments) && serverState.garments.length > 0) {
        setGarments(serverState.garments);
      }
      if (Array.isArray(serverState.wardrobe) && serverState.wardrobe.length > 0) {
        setWardrobe(serverState.wardrobe);
      }
      if (Array.isArray(serverState.offers) && serverState.offers.length > 0) {
        setOffers(serverState.offers);
      }
      if (typeof serverState.userTrustPoints === 'number') {
        setUserTrustPoints(serverState.userTrustPoints);
      }
      if (serverState.preferredHubId) {
        const foundHub = HUB_LOCATIONS.find((h) => h.id === serverState.preferredHubId);
        if (foundHub) setCurrentHub(foundHub);
      }
    });
  }, []);

  // Automatically persist every state change to LocalStorage + Express Server DB
  useEffect(() => {
    persistStateEverywhere(
      {
        garments,
        wardrobe,
        offers,
        userTrustPoints,
        preferredHubId: currentHub.id,
      },
      () => {
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    );
  }, [garments, wardrobe, offers, userTrustPoints, currentHub.id]);

  // Edit & Sweeten Held Offers Modal state
  const [isEditOfferOpen, setIsEditOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SwapOffer | null>(null);

  // Interactive Trade Notification Banner state
  const [bannerOffer, setBannerOffer] = useState<SwapOffer | null>(null);

  // Reactive Banner Auto-Sync: If the banner's offer is no longer actionable (e.g., accepted, declined, or its garment was traded elsewhere), immediately dismiss the banner!
  useEffect(() => {
    if (!bannerOffer) return;
    const liveOffer = offers.find((o) => o.id === bannerOffer.id);
    const garmentObj = garments.find((g) => g.id === bannerOffer.theirItem.id);
    const isItemGone = Boolean(garmentObj?.isTraded && liveOffer?.status !== 'accepted');
    if (
      !liveOffer ||
      (liveOffer.status !== 'pending' && liveOffer.status !== 'maybe') ||
      isItemGone
    ) {
      setBannerOffer(null);
    } else if (liveOffer !== bannerOffer) {
      setBannerOffer(liveOffer);
    }
  }, [offers, garments, bannerOffer]);

  // 48-Hour Deal Lock Expiration Watchdog: Automatically unlocks items if a locked deal expires without handover
  useEffect(() => {
    const now = Date.now();
    const expiredOffers = offers.filter(
      (o) => o.status === 'accepted' && o.lockExpiresAt && o.lockExpiresAt < now
    );
    if (expiredOffers.length === 0) return;

    const expiredOfferIds = new Set(expiredOffers.map((o) => o.id));
    const unlockedWardrobeIds = new Set<string>();
    const unlockedGarmentIds = new Set<string>();

    expiredOffers.forEach((eo) => {
      unlockedGarmentIds.add(eo.theirItem.id);
      if (eo.yourItems && eo.yourItems.length > 0) {
        eo.yourItems.forEach((i) => unlockedWardrobeIds.add(i.id));
      } else {
        unlockedWardrobeIds.add(eo.yourItem.id);
      }
    });

    setOffers((prev) =>
      prev.map((o) =>
        expiredOfferIds.has(o.id)
          ? {
              ...o,
              status: 'declined',
              cancellationReason: 'partner_flaked',
              messages: [
                ...(o.messages || []),
                {
                  id: `msg-exp-${Date.now()}`,
                  sender: 'them' as const,
                  text: '⏱️ 48h Deal Lock expired without QR Handover. Both items have been automatically unlocked and returned to closets.',
                  timestamp: 'Just now',
                },
              ],
            }
          : o
      )
    );

    setWardrobe((prev) =>
      prev.map((w) =>
        unlockedWardrobeIds.has(w.id)
          ? { ...w, status: 'available', badgeLabel: 'Verified Closet' }
          : w
      )
    );

    setGarments((prev) =>
      prev.map((g) =>
        unlockedGarmentIds.has(g.id) ? { ...g, isTraded: false } : g
      )
    );
  }, [offers]);
  // Show incoming pending trade notification on app launch for quick 1-tap accept/decline
  useEffect(() => {
    const timer = setTimeout(() => {
      const incomingPending = offers.find((o) => {
        if (o.direction === 'sent' || (o.status !== 'pending' && o.status !== 'maybe')) return false;
        const garmentObj = garments.find((g) => g.id === o.theirItem.id);
        if (garmentObj?.isTraded) return false;
        return true;
      });
      if (incomingPending) {
        setBannerOffer(incomingPending);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Firebase auth state subscription & Live Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setHasCompletedLaunchAuth(true);
        try {
          localStorage.setItem('swap_launch_auth_done_v1', 'true');
        } catch {
          // Ignore storage error
        }
      }
    });

    const unsubGarments = subscribeToGarments((liveGarments) => {
      if (liveGarments && liveGarments.length > 0) {
        setGarments((prev) => {
          const liveIds = new Set(liveGarments.map((g) => g.id));
          const localRemaining = prev.filter((p) => !liveIds.has(p.id));
          return [...liveGarments, ...localRemaining];
        });
      }
    });

    const unsubOffers = subscribeToOffers((liveOffers) => {
      if (liveOffers && liveOffers.length > 0) {
        setOffers((prev) => {
          const localMap = new Map(prev.map((o) => [o.id, o]));
          liveOffers.forEach((lo) => localMap.set(lo.id, lo));
          return Array.from(localMap.values());
        });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubGarments();
      unsubOffers();
    };
  }, []);

  // Derived filtered garments
  const filteredGarments = useMemo(() => {
    return filterGarments(garments, filters);
  }, [garments, filters]);

  const activeGarment = filteredGarments[currentIndex % filteredGarments.length] || garments[0];

  const stashedGarments = useMemo(() => {
    return garments.filter((g) => g.isStashed);
  }, [garments]);

  // Authentication Handlers
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setHasCompletedLaunchAuth(true);
      localStorage.setItem('swap_launch_auth_done_v1', 'true');
    } catch {
      // Fallback if popup blocked in preview iframe
      await signInAsGuest('Vault Member').catch(() => {});
      setHasCompletedLaunchAuth(true);
      localStorage.setItem('swap_launch_auth_done_v1', 'true');
    }
  };

  const handlePhoneSignIn = async (phoneNumber: string, method: 'call' | 'sms' = 'call') => {
    try {
      await signInWithPhoneQuick(phoneNumber, method);
    } catch {
      // Handled cleanly
    } finally {
      setHasCompletedLaunchAuth(true);
      try {
        localStorage.setItem('swap_launch_auth_done_v1', 'true');
      } catch {
        // Ignore storage error
      }
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('swap_launch_auth_done_v1');
      setHasCompletedLaunchAuth(false);
      await logOut();
    } catch {
      setHasCompletedLaunchAuth(false);
    }
  };

  const handleSwipeRight = (_garment: Garment) => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSwipeLeft = (_garment: Garment) => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleToggleBookmark = (garment: Garment) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === garment.id ? { ...g, isStashed: !g.isStashed } : g))
    );
  };

  const handleScanSuccess = (code: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.securityPassCode === code ? { ...o, status: 'completed' } : o
      )
    );
  };

  const handleProposeDirectTrade = (
    myWardrobeItem: WardrobeItem,
    target: Garment,
    bundleItems?: WardrobeItem[]
  ) => {
    const allYourItems = bundleItems && bundleItems.length > 0 
      ? [myWardrobeItem, ...bundleItems] 
      : [myWardrobeItem];
    const isBundle = allYourItems.length > 1;
    const totalOfferedValue = allYourItems.reduce((sum, item) => sum + item.value, 0);

    const cashDelta = target.estValue - totalOfferedValue;
    const newOffer: SwapOffer = {
      id: `swap-${Date.now()}`,
      partner: target.owner,
      theirItem: {
        id: target.id,
        title: target.title,
        imageUrl: target.imageUrl,
        value: target.estValue,
        size: target.size,
      },
      yourItem: {
        id: myWardrobeItem.id,
        title: isBundle
          ? allYourItems.map((b) => b.title.split(' ')[0]).join(' + ')
          : myWardrobeItem.title,
        imageUrl: myWardrobeItem.imageUrl,
        value: totalOfferedValue,
        size: isBundle ? `${allYourItems.length} pcs` : myWardrobeItem.size,
      },
      yourItems: allYourItems.map((it) => ({
        id: it.id,
        title: it.title,
        imageUrl: it.imageUrl,
        value: it.value,
        size: it.size,
      })),
      partnerItems: [
        {
          id: target.id,
          title: target.title,
          imageUrl: target.imageUrl,
          value: target.estValue,
          size: target.size,
        },
      ],
      bundleItems: isBundle ? bundleItems : undefined,
      isBundle,
      tradeRatio: isBundle ? `${allYourItems.length}:1` : '1:1',
      cashTopUp: Math.abs(cashDelta),
      topUpBy: cashDelta > 0 ? 'you' : cashDelta < 0 ? 'partner' : 'none',
      status: 'pending',
      hubLocation: currentHub.address,
      scheduledTime: 'Tomorrow at 4:00 PM',
      securityPassCode: `SWAP-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      co2SavedKg: isBundle ? 6.4 : 3.6,
    };

    setOffers((prev) => [newOffer, ...prev]);
    if (currentUser?.uid) {
      syncOfferToFirestore(newOffer);
    }
    setActiveTab('matches');
  };

  const handleInstantSwapFromCloset = (yourItem: WardrobeItem, target: Garment) => {
    handleProposeDirectTrade(yourItem, target);
    soundFX.playMatch();
    setActiveTab('matches');
  };

  const handleOpenRequestSwap = (garment: Garment) => {
    const availablePieces = wardrobe.filter((w) => w.status === 'available');
    if (availablePieces.length === 0) {
      setIsAddItemOpen(true);
      return;
    }
    setRequestTargetGarment(garment);
    setIsRequestSwapOpen(true);
  };

  const handleRequestSent = (newOffer: SwapOffer) => {
    setOffers((prev) => [newOffer, ...prev]);
    if (currentUser?.uid) {
      syncOfferToFirestore(newOffer);
    }
    setActiveTab('matches');
  };

  const handleAcceptOffer = (offerId: string) => {
    const targetOffer = offers.find((o) => o.id === offerId);
    const now = Date.now();
    const lockDurationMs = 48 * 60 * 60 * 1000; // 48-hour deal lock window

    // Collect all item IDs involved in the accepted deal (including bundles)
    const acceptedItemIds = new Set<string>();
    if (targetOffer) {
      acceptedItemIds.add(targetOffer.theirItem.id);
      acceptedItemIds.add(targetOffer.yourItem.id);
      targetOffer.yourItems?.forEach((i) => acceptedItemIds.add(i.id));
      targetOffer.partnerItems?.forEach((i) => acceptedItemIds.add(i.id));
    }

    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'accepted',
            acceptedAt: now,
            lockExpiresAt: now + lockDurationMs,
            messages:
              o.messages && o.messages.length > 0
                ? o.messages
                : [
                    {
                      id: `msg-${Date.now()}`,
                      sender: 'them' as const,
                      text: 'Deal accepted! Both pieces are now locked for 48h. Share a GPS meetup pin or select a Hub below for handover.',
                      timestamp: 'Just now',
                    },
                  ],
          };
        }

        // Auto-cancel any competing pending/nudged offers that involve ANY of the same items
        if (
          targetOffer &&
          (o.status === 'pending' || o.status === 'maybe' || o.status === 'countered')
        ) {
          const otherOfferIds = [
            o.theirItem.id,
            o.yourItem.id,
            ...(o.yourItems?.map((i) => i.id) || []),
            ...(o.partnerItems?.map((i) => i.id) || []),
          ];
          const hasOverlap = otherOfferIds.some((id) => acceptedItemIds.has(id));
          if (hasOverlap) {
            return {
              ...o,
              status: 'declined',
              cancellationReason: 'other',
              messages: [
                ...(o.messages || []),
                {
                  id: `msg-autosync-${Date.now()}`,
                  sender: 'them' as const,
                  text: '🔄 Auto-Resolved: One of the pieces in this proposal was locked in another accepted swap.',
                  timestamp: 'Just now',
                },
              ],
            };
          }
        }
        return o;
      })
    );

    // Remove traded garment from Discover feed immediately so others cannot see it!
    if (targetOffer) {
      setGarments((prev) =>
        prev.map((g) =>
          g.id === targetOffer.theirItem.id ? { ...g, isTraded: true } : g
        )
      );

      // Mark your offered item(s) as locked in swap inside your closet
      const lockedIds = new Set(
        targetOffer.yourItems && targetOffer.yourItems.length > 0
          ? targetOffer.yourItems.map((i) => i.id)
          : [targetOffer.yourItem.id]
      );
      setWardrobe((prev) =>
        prev.map((w) =>
          lockedIds.has(w.id)
            ? { ...w, status: 'pending', badgeLabel: 'Locked in Swap' }
            : w
        )
      );
    }

    // Clear banner if this offer or any competing offer was showing
    if (bannerOffer) {
      const bannerIds = [
        bannerOffer.theirItem.id,
        bannerOffer.yourItem.id,
        ...(bannerOffer.yourItems?.map((i) => i.id) || []),
      ];
      if (bannerOffer.id === offerId || bannerIds.some((id) => acceptedItemIds.has(id))) {
        setBannerOffer(null);
      }
    }

    if (currentUser?.uid) {
      updateOfferInFirestore(offerId, { status: 'accepted' });
    }
  };

  const handleDeclineOffer = (
    offerId: string,
    reason?: 'too_far' | 'condition_mismatch' | 'cant_agree' | 'partner_flaked' | 'other'
  ) => {
    const targetOffer = offers.find((o) => o.id === offerId);
    const reasonLabelMap: Record<string, string> = {
      too_far: '📍 Deal canceled: Meetup location or distance was too far. Both items returned to closets.',
      condition_mismatch: '🛡️ Handover rejected: Garment condition did not match photos. Your item is unlocked with zero penalty.',
      cant_agree: '🤝 Deal canceled: Could not agree on final trade terms. Both items returned to closets.',
      partner_flaked: '⏱️ Deal canceled: Partner backed out / unresponsive. Your item is unlocked & partner trust score adjusted.',
      other: '🔄 Trade canceled. Both garments have been unlocked and returned to closets.',
    };

    if (reason === 'partner_flaked') {
      // Award +10 reliability compensation to user when partner flakes
      setUserTrustPoints((prev) => prev + 10);
    }

    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'declined',
              cancellationReason: reason || 'other',
              cancelledBy: 'you',
              messages: reason
                ? [
                    ...(o.messages || []),
                    {
                      id: `msg-cancel-${Date.now()}`,
                      sender: 'you' as const,
                      text: reasonLabelMap[reason] || reasonLabelMap.other,
                      timestamp: 'Just now',
                    },
                  ]
                : o.messages,
            }
          : o
      )
    );

    if (targetOffer) {
      // Unlock your wardrobe item(s) immediately so they return to your closet as Available
      const lockedIds = new Set(
        targetOffer.yourItems && targetOffer.yourItems.length > 0
          ? targetOffer.yourItems.map((i) => i.id)
          : [targetOffer.yourItem.id]
      );
      setWardrobe((prev) =>
        prev.map((w) =>
          lockedIds.has(w.id)
            ? { ...w, status: 'available', badgeLabel: w.isLiveCameraVerified ? 'Live Cam Verified' : 'Verified Closet' }
            : w
        )
      );

      // Also restore partner's garment back to Discover feed if it was locked in this accepted deal
      setGarments((prev) =>
        prev.map((g) =>
          g.id === targetOffer.theirItem.id ? { ...g, isTraded: false } : g
        )
      );
    }

    if (bannerOffer?.id === offerId) {
      setBannerOffer(null);
    }
    if (currentUser?.uid) {
      updateOfferInFirestore(offerId, { status: 'declined' });
    }
  };

  const handleUpdateOfferGpsPin = (
    offerId: string,
    gpsPin: { lat: number; lng: number; label: string; distanceMeters?: number }
  ) => {
    const targetOffer = offers.find((o) => o.id === offerId);
    const updatedGpsPin = {
      ...gpsPin,
      verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const newGpsMsg = {
      id: `msg-gps-${Date.now()}`,
      sender: 'you' as const,
      text: `📍 Exact GPS Meetup Pin Shared: ${gpsPin.label} (${gpsPin.lat.toFixed(4)}°N, ${gpsPin.lng.toFixed(4)}°E)`,
      timestamp: 'Just now',
      gpsPin: {
        lat: gpsPin.lat,
        lng: gpsPin.lng,
        label: gpsPin.label,
        distanceKm: gpsPin.distanceMeters ? Number((gpsPin.distanceMeters / 1000).toFixed(2)) : 0.05,
      },
    };
    const updatedMessages = [...(targetOffer?.messages || []), newGpsMsg];

    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              hubLocation: gpsPin.label,
              agreedLocation: gpsPin.label,
              gpsMeetupPin: updatedGpsPin,
              messages: updatedMessages,
            }
          : o
      )
    );

    updateOfferInFirestore(offerId, {
      hubLocation: gpsPin.label,
      agreedLocation: gpsPin.label,
      gpsMeetupPin: updatedGpsPin,
      messages: updatedMessages,
    });
  };

  const handleReportGarment = (garment: Garment, _reason: string) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === garment.id ? { ...g, isTraded: true } : g))
    );
    setOffers((prev) =>
      prev.map((o) =>
        o.theirItem.id === garment.id && (o.status === 'pending' || o.status === 'maybe')
          ? { ...o, status: 'declined' }
          : o
      )
    );
  };

  const handleSimulateIncomingOffer = () => {
    const simulatedOffer: SwapOffer = {
      id: `offer-sim-${Date.now()}`,
      direction: 'incoming',
      partner: {
        name: 'Nour El-Din',
        handle: 'nour_gorp',
        isPro: true,
        rating: 4.9,
        swapCount: 38,
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        location: 'Degla Hub',
      },
      theirItem: {
        id: 'g-arc-beta-sim',
        title: "Arc'teryx Beta LT Shell",
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAql2OJ7YcMEv9jLeXzK7EowjtJ7pq2B45S3JLErkvoseLGzXoYpfGHJhmCHhW7-gK-PoqaF1TslfIaG-CBfqYxXv1QIxQCwFN0GXk_fLIrgQR3kvg9QWUNPv7aclBRHffIWpGs-MW1dyiygyswVJpRc4ThahGSwyEqvS2yoLyA7vG8G0uTrHhqDwsCh0mrUFnhA4I1PahffI-ZYwO3gIOARLHiteejfljf9rvFQnWX1ZMTZgwQf37M',
        value: 950,
        size: 'L',
        brand: "Arc'teryx",
        condition: '9.8 / 10 MINT',
        description:
          "Authentic Arc'teryx Beta LT with Gore-Tex 3L membrane. Perfect seam taping and water beading.",
        category: 'jacket',
      },
      yourItem: {
        id: wardrobe[0]?.id || 'vault-1',
        title: wardrobe[0]?.title || 'Vintage Nirvana In Utero Washed Tee',
        imageUrl:
          wardrobe[0]?.imageUrl ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAQIPFLaXbG7hGXYmbB4fPjEyd7MtwoE2DMVtVWbG8gAke6M15nReQTWZXy8YPih8SsJVGIyk1da8n66OyBTkWKx3HDcf2_xvrU44NBfufN1dYuCFreBYK55FX-TfAYCmXm7YXXpPv0IZObr6EQF-leIWqTT8mouLIsZCdu6dpGYC937N-6vn7Nib6AwWPF5peRoXNaIfILl6P3CqvijG7oU5O65-rJglGUVyzJT-551sxRZHFEAp7c',
        value: wardrobe[0]?.value || 650,
        size: wardrobe[0]?.size || 'L',
        brand: 'Vintage',
        condition: '9.5 / 10 MINT',
        description: 'Vintage heavyweight washed cotton tee.',
        category: 'tees',
      },
      cashTopUp: 0,
      topUpBy: 'none',
      status: 'pending',
      negotiationRounds: 1,
      hubLocation: 'Espresso Lab Degla Hub #04',
      securityPassCode: `SWP-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `BC-${Date.now().toString().slice(-8)}`,
      timestamp: 'Just now',
      co2SavedKg: 5.2,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'them',
          text: "Hey! Loved your piece in Discover. Want to trade for my Arc'teryx Beta LT?",
          timestamp: 'Just now',
        },
      ],
    };

    setOffers((prev) => [simulatedOffer, ...prev]);
    setBannerOffer(simulatedOffer);

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('swap. • New Trade Request', {
        body: `@nour_gorp wants to trade Arc'teryx Beta LT for your ${simulatedOffer.yourItem.title}`,
        icon: '/assets/aistudio/Image_1_3ba5c951.png',
      });
    }
  };

  const handleCounterOffer = (
    offerId: string,
    counterDetails: { cashTopUp?: number; requestedItemTitle?: string; note?: string }
  ) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'countered',
              cashTopUp: counterDetails.cashTopUp ?? o.cashTopUp,
              counterDetails,
            }
          : o
      )
    );
  };

  const handleSendMessage = (offerId: string, messageText: string) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'you' as const,
      text: messageText,
      timestamp: 'Just now',
    };

    const targetOffer = offers.find((o) => o.id === offerId);
    const updatedMessages = [...(targetOffer?.messages || []), newMsg];

    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              messages: updatedMessages,
            }
          : o
      )
    );

    // Sync real-time message directly to Firestore for multi-device chat
    updateOfferInFirestore(offerId, { messages: updatedMessages });

    // Only trigger simulated auto-reply for initial demo seed offers (id starts with 'offer-')
    const isDemoSeedOffer = offerId.startsWith('offer-');
    if (isDemoSeedOffer) {
      setTimeout(() => {
        const partnerReply = {
          id: `msg-reply-${Date.now()}`,
          sender: 'them' as const,
          text:
            messageText.toLowerCase().includes('hub') ||
            messageText.toLowerCase().includes('degla')
              ? 'Sounds perfect! I will head to Degla Hub lockers this evening.'
              : 'Got it! I will bring the garment ready for QR scanning and verification.',
          timestamp: 'Just now',
        };
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId
              ? {
                  ...o,
                  messages: [...(o.messages || []), partnerReply],
                }
              : o
          )
        );
      }, 1200);
    }
  };

  const handleMaybeOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          const currentRounds = o.negotiationRounds || 1;
          const updated: SwapOffer = {
            ...o,
            status: 'maybe',
            negotiationRounds: Math.min(3, currentRounds),
            messages: [
              ...(o.messages || []),
              {
                id: `msg-${Date.now()}`,
                sender: 'you' as const,
                text: '⚡ Nudged: Holding out for a sweeter offer or counter-deal.',
                timestamp: 'Just now',
              },
            ],
          };
          if (bannerOffer?.id === offerId) {
            setBannerOffer(updated);
          }
          if (currentUser?.uid) {
            updateOfferInFirestore(offerId, { status: 'maybe', messages: updated.messages });
          }
          return updated;
        }
        return o;
      })
    );
  };

  const handleAskQuestion = (offerId: string, question: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'inquiry_pending',
            pendingQuestion: {
              question,
              askedAt: 'Just now',
              asker: 'you',
            },
          };
        }
        return o;
      })
    );
  };

  const handleAnswerQuestion = (offerId: string, answer: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'pending', // Unlocks Accept action
            pendingQuestion: o.pendingQuestion
              ? {
                  ...o.pendingQuestion,
                  answer,
                  answeredAt: 'Just now',
                }
              : undefined,
          };
        }
        return o;
      })
    );
  };

  const handleStandFirm = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          const updated: SwapOffer = {
            ...o,
            status: 'pending',
            isStandingFirm: true,
            standingFirmBy: 'you',
            messages: [
              ...(o.messages || []),
              {
                id: `msg-${Date.now()}`,
                sender: 'you' as const,
                text: '🛡️ Standing firm on the original offer — no extra cash or items needed. Deal is ready if you want it!',
                timestamp: 'Just now',
              },
            ],
          };
          if (bannerOffer?.id === offerId) setBannerOffer(updated);
          if (currentUser?.uid) {
            updateOfferInFirestore(offerId, { status: 'pending', isStandingFirm: true, messages: updated.messages });
          }
          return updated;
        }
        return o;
      })
    );
  };

  const handleSweetenOffer = (offerId: string, extraTeeTitle: string, cashExtra: number) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          const currentRounds = o.negotiationRounds || 1;
          const nextRounds = Math.min(3, currentRounds + 1);
          const newExtraItem = {
            id: `extra-${Date.now()}`,
            title: extraTeeTitle,
            imageUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAQIPFLaXbG7hGXYmbB4fPjEyd7MtwoE2DMVtVWbG8gAke6M15nReQTWZXy8YPih8SsJVGIyk1da8n66OyBTkWKx3HDcf2_xvrU44NBfufN1dYuCFreBYK55FX-TfAYCmXm7YXXpPv0IZObr6EQF-leIWqTT8mouLIsZCdu6dpGYC937N-6vn7Nib6AwWPF5peRoXNaIfILl6P3CqvijG7oU5O65-rJglGUVyzJT-551sxRZHFEAp7c',
            value: 450,
            size: 'L',
          };
          return {
            ...o,
            status: 'pending',
            negotiationRounds: nextRounds,
            cashTopUp: o.cashTopUp + cashExtra,
            extraItemsOffered: [...(o.extraItemsOffered || []), newExtraItem],
            messages: [
              ...(o.messages || []),
              {
                id: `msg-${Date.now()}`,
                sender: 'them' as const,
                text: `Revised proposal (Round ${nextRounds}/3): Added +${extraTeeTitle} & +${cashExtra} EGP cash on top to sweeten the trade!`,
                timestamp: 'Just now',
              },
            ],
          };
        }
        return o;
      })
    );
  };

  const handleOpenEditOffer = (offer: SwapOffer) => {
    setEditingOffer(offer);
    setIsEditOfferOpen(true);
  };

  const handleSaveRevisedOffer = (
    offerId: string,
    selectedItems: WardrobeItem[],
    cashTopUp: number,
    note?: string
  ) => {
    const isBundle = selectedItems.length > 1;
    const totalOfferedValue = selectedItems.reduce((sum, item) => sum + item.value, 0);

    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          const currentRounds = o.negotiationRounds || 1;
          const nextRounds = Math.min(3, currentRounds + 1);
          const primaryItem = selectedItems[0];
          const revisedOffer: SwapOffer = {
            ...o,
            status: 'pending',
            negotiationRounds: nextRounds,
            yourItem: {
              id: primaryItem.id,
              title: isBundle
                ? selectedItems.map((b) => b.title.split(' ')[0]).join(' + ')
                : primaryItem.title,
              imageUrl: primaryItem.imageUrl,
              value: totalOfferedValue,
              size: isBundle ? `${selectedItems.length} pcs` : primaryItem.size,
            },
            yourItems: selectedItems.map((it) => ({
              id: it.id,
              title: it.title,
              imageUrl: it.imageUrl,
              value: it.value,
              size: it.size,
            })),
            isBundle,
            tradeRatio: isBundle ? `${selectedItems.length}:1` : '1:1',
            cashTopUp,
            counterDetails: note ? { note, cashTopUp } : undefined,
            messages: [
              ...(o.messages || []),
              {
                id: `msg-${Date.now()}`,
                sender: 'you' as const,
                text: `Revised proposal (Round ${nextRounds}/3): ${
                  isBundle
                    ? `Bundled ${selectedItems.length} pieces (${selectedItems.map((i) => i.title).join(' + ')})`
                    : `Offering ${primaryItem.title}`
                }${cashTopUp > 0 ? ` + ${cashTopUp} EGP cash on top` : ''}${note ? `. Note: "${note}"` : ''}`,
                timestamp: 'Just now',
              },
            ],
          };

          if (bannerOffer?.id === offerId) {
            setBannerOffer(revisedOffer);
          }
          if (currentUser?.uid) {
            updateOfferInFirestore(offerId, revisedOffer);
          }
          return revisedOffer;
        }
        return o;
      })
    );

    soundFX.playMatch();
    setIsEditOfferOpen(false);
    setEditingOffer(null);
  };

  const handleMarkFinalOffer = (offerId: string) => {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === offerId) {
          return {
            ...o,
            status: 'pending',
            isFinalOffer: true,
            messages: [
              ...(o.messages || []),
              {
                id: `msg-${Date.now()}`,
                sender: 'them' as const,
                text: 'This is my final, non-negotiable proposal. Please Accept or Decline.',
                timestamp: 'Just now',
              },
            ],
          };
        }
        return o;
      })
    );
  };

  const handleScanBarcodeSuccess = (offerId: string, fitCheckPhoto?: string) => {
    const completedOffer = offers.find((o) => o.id === offerId);
    setUserTrustPoints((prev) => prev + 50);
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? {
              ...o,
              status: 'completed',
              trustPointsEarned: 50,
              trustPointsAwarded: true,
              ...(fitCheckPhoto ? { fitCheckPhoto, fitCheckTimestamp: new Date().toLocaleDateString() } : {}),
            }
          : o
      )
    );

    if (completedOffer) {
      telemetryService.trackEvent('handshake_completed', {
        summaryAr: `أتم هاند شيك موثق بنجاح ✓ (${completedOffer.theirItem.title})`,
        summaryEn: `Completed verified handshake: ${completedOffer.theirItem.title}`,
        userHandle: currentUser?.displayName || '@swapper_cairo',
        metadata: { offerId, hasFitCheck: Boolean(fitCheckPhoto) },
      });

      const tradedOutIds = new Set(
        completedOffer.yourItems && completedOffer.yourItems.length > 0
          ? completedOffer.yourItems.map((i) => i.id)
          : [completedOffer.yourItem.id]
      );
      const acquiredPiece: WardrobeItem = {
        id: `swapped-${completedOffer.theirItem.id}-${Date.now()}`,
        title: completedOffer.theirItem.title,
        categoryTag: `SWAPPED • ${completedOffer.theirItem.size}`,
        size: completedOffer.theirItem.size,
        value: completedOffer.theirItem.value,
        currency: 'EGP',
        status: 'available',
        badgeLabel: 'Acquired via Swap',
        imageUrl: completedOffer.theirItem.imageUrl,
        condition: completedOffer.theirItem.condition || '9.8 / 10 MINT',
        description:
          completedOffer.theirItem.description ||
          `Acquired via verified locker swap with @${completedOffer.partner.handle}.`,
      };

      setWardrobe((prev) => [
        acquiredPiece,
        ...prev.filter((w) => !tradedOutIds.has(w.id)),
      ]);

      if (currentUser?.uid) {
        updateOfferInFirestore(offerId, { status: 'completed' });
        syncWardrobeItemToFirestore(acquiredPiece, currentUser.uid);
      }
    }
  };

  const handleAddItem = (newItem: WardrobeItem) => {
    setWardrobe((prev) => [newItem, ...prev]);

    telemetryService.trackEvent('view_item', {
      summaryAr: `أضاف قطعة جديدة للدولاب: ${newItem.title}`,
      summaryEn: `Added piece to wardrobe: ${newItem.title}`,
      userHandle: currentUser?.displayName || '@swapper_cairo',
      metadata: { title: newItem.title, value: newItem.value },
    });

    // Also publish the uploaded piece to the neighborhood feed
    const newFeedGarment: Garment = {
      id: newItem.id,
      title: newItem.title,
      brand: newItem.title.split(' ')[0] || 'Vintage',
      lot: `LOT #${newItem.id.slice(-4).toUpperCase()}`,
      estValue: newItem.value,
      currency: newItem.currency || 'EGP',
      condition: newItem.condition || '9.8 / 10 MINT',
      size: newItem.size,
      badge: newItem.isLiveCameraVerified ? 'LIVE CAM VERIFIED' : 'JUST LISTED',
      archiveTag: 'LOCAL VAULT',
      distance: '0.1 km • Your Closet',
      city: currentHub.name,
      imageUrl: newItem.imageUrl,
      angles: newItem.angles,
      isLiveCameraVerified: newItem.isLiveCameraVerified,
      description: newItem.description || `Authentic ${newItem.title}. Ready for 1-to-1 barter.`,
      category: newItem.category || 'tees',
      owner: {
        name: currentUser?.displayName || 'You (@youssef_fits)',
        handle: (currentUser?.displayName || 'youssef_fits').toLowerCase().replace(/\s+/g, '_'),
        isPro: true,
        rating: 4.9,
        swapCount: 24,
        avatarUrl:
          currentUser?.photoURL ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDiBFlwRfyYNXXzMMHog4cnQQF4aB7aMTx6jmYgc1oqDyInrgqUHMU_dEBicHujxi6YICVBf-I-dChd_1HAp5YJG5jmU24PI08rtPjdiQOxaFyGGJLHPgqfAMdWprP8Z8Ar7uBKcTHyORErqdcBr_XjOMJ_CLTid-_SeoHMjHqi_pkw1dXC3dZWEKid0tRCavzL4tn8mVFj3sIxSjv6TIMzCDbGoHRiZkTwG8vDF1ZxorcBHjzHnUVq',
        location: currentHub.name,
      },
      tags: ['Verified', 'New Upload'],
    };
    setGarments((prev) => [newFeedGarment, ...prev]);

    if (currentUser?.uid) {
      syncWardrobeItemToFirestore(newItem, currentUser.uid);
    }
  };

  const handleUpdateWardrobeItemValue = (itemId: string, delta: number) => {
    setWardrobe((prev) =>
      prev.map((w) => {
        if (w.id !== itemId) return w;
        const nextVal = Math.max(50, (w.value || 450) + delta);
        const updated = { ...w, value: nextVal };
        if (currentUser?.uid) {
          syncWardrobeItemToFirestore(updated, currentUser.uid);
        }
        return updated;
      })
    );
    setGarments((prev) =>
      prev.map((g) =>
        g.id === itemId ? { ...g, estValue: Math.max(50, (g.estValue || 450) + delta) } : g
      )
    );
    setLastSyncedAt('Updated piece value');
  };

  const handleRemoveWardrobeItem = (itemId: string) => {
    setWardrobe((prev) => prev.filter((item) => item.id !== itemId));
    setGarments((prev) => prev.filter((g) => g.id !== itemId));
    if (currentUser?.uid) {
      deleteGarmentFromFirestore(itemId);
    }

    // Automatically decline any pending/maybe offers involving the removed closet item
    setOffers((prev) =>
      prev.map((o) => {
        const involvesItem =
          o.yourItem.id === itemId ||
          o.theirItem.id === itemId ||
          Boolean(o.yourItems?.some((i) => i.id === itemId));
        if (involvesItem && (o.status === 'pending' || o.status === 'maybe')) {
          return { ...o, status: 'declined' };
        }
        return o;
      })
    );

    if (
      bannerOffer &&
      (bannerOffer.yourItem.id === itemId || bannerOffer.theirItem.id === itemId)
    ) {
      setBannerOffer(null);
    }
  };

  const handleClearDemoCloset = () => {
    const demoIds = new Set(['w1', 'w2', 'w3', 'w4']);
    setWardrobe((prev) => prev.filter((item) => !demoIds.has(item.id)));
    setOffers((prev) =>
      prev.filter(
        (o) => !demoIds.has(o.yourItem.id) && !demoIds.has(o.theirItem.id)
      )
    );
    if (
      bannerOffer &&
      (demoIds.has(bannerOffer.yourItem.id) || demoIds.has(bannerOffer.theirItem.id))
    ) {
      setBannerOffer(null);
    }
    setLastSyncedAt('Cleared demo closet');
  };

  const handleResetDemoData = async () => {
    await resetAllPersistedData();
    setGarments(INITIAL_GARMENTS);
    setWardrobe(INITIAL_WARDROBE);
    setOffers(ACTIVE_SWAP_OFFERS);
    setUserTrustPoints(450);
    setCurrentHub(HUB_LOCATIONS[0]);
    setLastSyncedAt('Reset to defaults');
  };

  // Filter out stale notifications whose items were already traded or locked elsewhere
  const actionableOffers = useMemo(() => {
    const lockedItemIds = new Set<string>();
    offers.forEach((o) => {
      if (o.status === 'accepted' || o.status === 'completed') {
        lockedItemIds.add(o.theirItem.id);
        lockedItemIds.add(o.yourItem.id);
        o.yourItems?.forEach((i) => lockedItemIds.add(i.id));
        o.partnerItems?.forEach((i) => lockedItemIds.add(i.id));
      }
    });

    return offers.filter((o) => {
      if (o.direction === 'sent') return false;
      if (o.status !== 'pending' && o.status !== 'maybe') return false;
      const garmentObj = garments.find((g) => g.id === o.theirItem.id);
      if (garmentObj?.isTraded) return false;
      if (lockedItemIds.has(o.theirItem.id) || lockedItemIds.has(o.yourItem.id)) return false;
      return true;
    });
  }, [offers, garments]);

  const actionableOffersCount = actionableOffers.length;

  return (
    <div className="w-full min-h-dvh bg-[#131315] text-[#ededed] font-body selection:bg-[#d4ff00] selection:text-[#0d0e12] flex flex-col justify-between overflow-x-hidden">
      {/* First-Launch Animated Brutalist Login Gate */}
      <AuthGateModal
        isOpen={!currentUser && !hasCompletedLaunchAuth}
        onGoogleSignIn={handleGoogleSignIn}
        onPhoneSignIn={handlePhoneSignIn}
      />

      {/* Post-Login Trilingual Onboarding Modal (AR / EN / FR) */}
      <LanguageSelectModal
        isOpen={(Boolean(currentUser) || hasCompletedLaunchAuth) && !hasSelectedLanguage}
        onConfirm={() => setHasSelectedLanguage(true)}
      />

      {/* Sticky Header */}
      <Header
        currentHub={currentHub}
        allHubs={HUB_LOCATIONS}
        onSelectHub={setCurrentHub}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenScanner={() => setIsScanOpen(true)}
        unreadCount={actionableOffersCount}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenLiveRadar={() => setIsLiveRadarOpen(true)}
        onPlayBrandIntro={() => {
          setShowBrandToast(true);
          setTimeout(() => setShowBrandToast(false), 2400);
        }}
      />

      {/* Brand Launch Sound Pulse Toast */}
      {showBrandToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181920]/95 border border-[#d4ff00]/50 shadow-[0_0_20px_rgba(212,255,0,0.3)] backdrop-blur-xl">
            <span className="material-symbols-outlined text-[15px] text-[#d4ff00] animate-pulse">
              volume_up
            </span>
            <span className="font-display font-black text-[11px] tracking-wider uppercase text-white flex items-center gap-1">
              <span>👶</span>
              <span className="text-[#d4ff00]">"SWAPPP!!"</span>
            </span>
          </div>
        </div>
      )}

      {/* Interactive Drop-Down Trade Notification Banner (Direct 1-tap Accept/Decline/Edit) */}
      <InteractiveNotificationBanner
        incomingOffer={bannerOffer}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        onOpenChat={(offer) => {
          setActiveTab('matches');
          setBannerOffer(null);
        }}
        onEditOffer={handleOpenEditOffer}
        onNudgeOffer={handleMaybeOffer}
        onStandFirm={handleStandFirm}
        onSweetenOffer={handleSweetenOffer}
        onSendMessage={handleSendMessage}
        onDismiss={() => setBannerOffer(null)}
      />

      {/* Main Content Router */}
      {activeTab === 'discover' && (
        <DiscoverView
          garments={filteredGarments}
          userWardrobe={wardrobe}
          currentIndex={currentIndex}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          onToggleBookmark={handleToggleBookmark}
          onOpenItemDetail={(g) => {
            setModalSelectedItem(g);
            setIsDetailOpen(true);
          }}
          onRequestSwap={handleOpenRequestSwap}
          onOpenFilters={() => setIsFilterOpen(true)}
          activeFilters={filters}
          onResetFilters={() =>
            setFilters({
              category: 'all',
              maxDistanceKm: 15,
              minCondition: 8.5,
              priceRange: [0, 5000],
              onlyPro: false,
              sizes: [],
              searchQuery: '',
            })
          }
          onReportGarment={handleReportGarment}
        />
      )}

      {activeTab === 'closet' && (
        <ClosetView
          wardrobe={wardrobe}
          wishlist={wishlist}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          onSelectItem={(item) => {
            setModalSelectedItem(item as any);
            setIsDetailOpen(true);
          }}
          onNavigateToDeals={() => setActiveTab('matches')}
          onRemoveItem={handleRemoveWardrobeItem}
          onUpdateItemValue={handleUpdateWardrobeItemValue}
          onClearDemoCloset={handleClearDemoCloset}
        />
      )}

      {activeTab === 'matches' && (
        <MatchesView
          offers={offers}
          userWardrobe={wardrobe}
          userTrustPoints={userTrustPoints}
          onAcceptOffer={handleAcceptOffer}
          onDeclineOffer={handleDeclineOffer}
          onUpdateOfferGpsPin={handleUpdateOfferGpsPin}
          onCounterOffer={handleCounterOffer}
          onMaybeOffer={handleMaybeOffer}
          onStandFirm={handleStandFirm}
          onAskQuestion={handleAskQuestion}
          onAnswerQuestion={handleAnswerQuestion}
          onSweetenOffer={handleSweetenOffer}
          onEditOffer={handleOpenEditOffer}
          onMarkFinalOffer={handleMarkFinalOffer}
          onSendMessage={handleSendMessage}
          onScanBarcodeSuccess={handleScanBarcodeSuccess}
          onNavigateToVault={() => setActiveTab('closet')}
          onNavigateToDiscover={() => setActiveTab('discover')}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileView
          currentHub={currentHub}
          allHubs={HUB_LOCATIONS}
          onSelectHub={setCurrentHub}
          stashedGarments={stashedGarments}
          onSelectGarment={(g) => {
            setModalSelectedItem(g);
            setIsDetailOpen(true);
          }}
          userTrustPoints={userTrustPoints}
          currentUser={currentUser}
          completedSwapsCount={24 + offers.filter((o) => o.status === 'completed').length}
          completedOffers={offers.filter((o) => o.status === 'completed' || o.status === 'accepted')}
          onClearDemoCloset={handleClearDemoCloset}
          onResetDemoData={handleResetDemoData}
          onOpenLiveRadar={() => setIsLiveRadarOpen(true)}
          onSignOut={() => {
            handleSignOut();
            window.localStorage.removeItem('swap_launch_auth_completed');
            setHasCompletedLaunchAuth(false);
          }}
        />
      )}

      {/* Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchesBadgeCount={actionableOffersCount}
      />

      {/* Streamlined Modals & Dialogs */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApplyFilters={setFilters}
      />

      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboardEntries}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />

      <ItemDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        item={modalSelectedItem}
        onInitiateSwap={(g) => {
          handleOpenRequestSwap(g);
          setIsDetailOpen(false);
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        offers={offers}
        actionableOffers={actionableOffers}
        onAcceptOffer={handleAcceptOffer}
        onDeclineOffer={handleDeclineOffer}
        onOpenChat={(offer) => {
          setActiveTab('matches');
          setIsNotificationsOpen(false);
        }}
        onEditOffer={handleOpenEditOffer}
        onStandFirm={handleStandFirm}
        onSweetenOffer={handleSweetenOffer}
      />

      <RequestSwapModal
        isOpen={isRequestSwapOpen}
        onClose={() => setIsRequestSwapOpen(false)}
        targetGarment={requestTargetGarment}
        userWardrobe={wardrobe}
        onRequestSent={handleRequestSent}
        onOpenAddItem={() => {
          setIsRequestSwapOpen(false);
          setIsAddItemOpen(true);
        }}
      />

      <EditOfferModal
        isOpen={isEditOfferOpen}
        onClose={() => {
          setIsEditOfferOpen(false);
          setEditingOffer(null);
        }}
        offer={editingOffer}
        userWardrobe={wardrobe}
        onSaveRevisedOffer={handleSaveRevisedOffer}
        onNudgeOffer={handleMaybeOffer}
      />

      {/* Live Observability / MCP Operations Radar Modal */}
      <LiveRadarModal
        isOpen={isLiveRadarOpen}
        onClose={() => setIsLiveRadarOpen(false)}
      />
    </div>
  );
}
