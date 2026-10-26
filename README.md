# swap. — Raw Brutalist Streetwear Exchange 🇪🇬

> **Mobile-First Circular Fashion & Barter Exchange for Cairo & Giza**  
> *1-to-1 verified swaps, physical safe hub handshakes, and real-time MCP observability.*

---

## 📱 Mobile Architecture & Philosophy

`swap.` is designed **strictly for smartphones** as a progressive web application (PWA). Every view, swipe gesture, card ratio, and modal interaction is engineered to fit a portrait mobile viewport with zero desktop bloat or horizontal scrolling.

### Key Mobile Features
1. **First-Launch Brutalist Auth Gate (`src/components/modals/AuthGateModal.tsx`)**:
   - Clean, high-impact entrance with Google Sign-In and Phone OTP verification.
   - Disappears permanently after authentication so the mobile header stays focused.

2. **Discover Feed (`src/components/DiscoverView.tsx`)**:
   - 1-to-1 swipeable streetwear deck with distance-based Cairo hub radius (`0.8 km`, `1.5 km`).
   - Brutalist tags, instant buyout options, and community moderation flags.

3. **My Closet / Vault (`src/components/ClosetView.tsx`)**:
   - 4-category grid (`All`, `Jackets`, `Tops`, `Shoes`).
   - 3-step progressive camera upload (`Front` → `Tag` → `Post`) with AI condition assessment.
   - Dynamic valuation adjustment and 1-tap piece deletion.

4. **Deals & In-Person Handshake (`src/components/MatchesView.tsx`)**:
   - **Competing Offers Auto-Cleanup**: Accepting a deal immediately locks both garments for 48 hours and auto-declines competing proposals.
   - **Zero-Penalty Cancellation**: Disagreements or partner flakes return locked garments to closet with zero score deduction.
   - **Live GPS Radar Meetup Pin**: 1-tap coordinate sharing with external map navigation.
   - **Handshake Verification**: Dynamic role cards (`The One Who Gives` reveals verified QR & PIN; `The One Who Receives` scans with camera).
   - **Fit Check Polaroid**: Verified polaroid snapshot watermarked with Cairo handshake stamp.

5. **Swapper Passport & Admin Telemetry (`src/components/ProfileView.tsx` & `src/components/modals/LiveRadarModal.tsx`)**:
   - Brutalist Swapper Card with trust score, rank progression, and receipt archives.
   - **Live MCP Radar**: Real-time observability dashboard showing active users, recent events, and live trade pulse.
   - Language switch located cleanly in settings and login screen (Egyptian Arabic & English).

---

## 📁 Clean Codebase Directory Structure

```text
SWAP/
├── .github/workflows/          # CI/CD security audit and validation
├── dist/                       # Production build output
├── public/                     # Static PWA assets, web manifest, and touch icons
│   ├── assets/aistudio/        # Verified brand and app icons
│   ├── manifest.json           # Mobile PWA configuration
│   └── sw.js                   # Service worker
├── src/                        # React 19 + TypeScript frontend application
│   ├── components/             # Core mobile views & bottom navigation
│   │   └── modals/             # Mobile-optimized brutalist modals (Auth, Radar, QR, Detail)
│   ├── data/                   # Initial Cairo archival streetwear mock data & hubs
│   ├── firebase/               # Firebase Auth & Firestore sync config
│   ├── hooks/                  # Audio FX, haptics, and PWA install hooks
│   ├── i18n/                   # Egyptian Street Arabic & English localization dictionary
│   ├── services/               # State sync, telemetry, and device haptics
│   ├── types/                  # Domain TypeScript interfaces (Garment, SwapOffer, Telemetry)
│   ├── utils/                  # Barter math, swipe gestures, and QR token logic
│   ├── App.tsx                 # Root mobile application controller
│   ├── index.css               # Tailwind CSS v4 & custom typography system
│   └── main.tsx                # Client entry point
├── Dockerfile                  # Production Alpine container definition
├── server.ts                   # Express.js + Vite backend with live telemetry & state persistence
├── tsconfig.json               # Strict TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 🛠️ Development & Production Scripts

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (9/9 passing with 100% i18n key parity)
npm test

# 3. TypeScript validation
npm run lint

# 4. Production build
npm run build

# 5. Start dev server (Express + Vite)
npm run dev

# 6. Start production server
npm start
```

---

## 🔒 Security & Privacy

- Full Content-Security-Policy (CSP) headers applied in `server.ts`.
- Zero local disk storage of plain passwords; authenticated via Firebase Auth.
- API endpoints rate-limited and hardened against QR passcode injection attacks.
- Sensitive environment variables stored strictly in `.env` (never committed).
