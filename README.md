# Campaign Amplify

A mobile platform for community-funded message amplification and distribution built with **React Native**, **Expo (SDK 58)**, and **TypeScript**, powered by **Bun**.

> **Important Concept**: Campaign Amplify is **NOT a donation platform**. Backer contributions directly fund targeted advertising and digital media placement to amplify important civic, environmental, and public-interest messages to new audiences.

---

## Tech Stack & Architecture

- **Framework**: React Native 0.88, Expo SDK 58
- **Navigation & Routing**: Expo Router v4 (file-based routing under `src/app/`)
- **Package Manager**: [Bun](https://bun.sh/) (always use `bun` / `bunx`)
- **State Management**:
  - [Zustand](https://github.com/pmndrs/zustand) with `@react-native-async-storage/async-storage` persistence
  - `useCampaignDraftStore`: 5-step draft persistence with debounced autosave
  - `useMyCampaignsStore`: local store for submitted campaigns (`SUBMITTED_FOR_REVIEW`)
  - `useContributionStore`: contributions and simulated payments history
  - `useCampaignFundingStore`: local funding update overrides across mock and user campaigns
- **Data Fetching & Cache**: [TanStack Query v5](https://tanstack.com/query) (`@tanstack/react-query`)
- **Validation**: [Zod](https://zod.dev/) 5-step schema validation (`basics`, `story`, `visuals`, `reach`, `submit`)
- **UI & Icons**: `@expo/vector-icons` (Ionicons), `expo-image`, custom design system (`Palette`, `Spacing`, `Typography`)

---

## Getting Started

### 1. Prerequisites

Ensure [Bun](https://bun.sh/) is installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start Development Server

```bash
# Start Metro bundler with interactive controls
bun expo start

# Or start directly for web testing
bun expo start --web
```

### 4. Running on Devices & Emulators

```bash
# Run on Android emulator / connected device
bun expo run:android

# Run on iOS simulator (macOS required)
bun expo run:ios
```

### 5. Typecheck & Code Health

```bash
bunx tsc --noEmit
bunx expo-doctor
```

---

## Core Flows

### 1. Campaign Creator Flow
1. **Entry**: Start new campaign or resume saved local draft with step restoration.
2. **Step 1 - Basics**: Title (max 60 chars), topic category, creator attribution, short summary (max 240 chars), cover image picker.
3. **Step 2 - Story**: Editorial narrative, headline, lead intro, structured supporting research links with live preview.
4. **Step 3 - Visuals**: Independent campaign cover vs ad creative hook, call-to-action selector, real-time social ad card preview.
5. **Step 4 - Reach & Targeting**: Geographic location tags, audience interest targeting, channel preferences, campaign duration (7–60 days).
6. **Step 5 - Review & Submit**: Amplification funding goal selection ($100–$1,000,000), real-time use-of-funds breakdown, full 5-step Zod validation. Incomplete sections prompt the user with direct navigation to the first invalid step.
7. **Status**: Creates a campaign with status `SUBMITTED_FOR_REVIEW` and structured story details.

### 2. Backer Contribution Flow
1. **Campaign Detail**: View substantiated message, creator, funding progress, and inspect supporting sources with external browser linking (`Linking.openURL`).
2. **Choose Contribution** (`/contribution/[campaignId]`): Select preset ($10, $25, $50, $100, $250) or custom numeric amount. Real-time fee calculation and estimated impressions preview.
3. **Review Contribution** (`/contribution/review`): Full transparency breakdown (85% advertising, 10% platform, 5% processing).
4. **Simulated Payment** (`/contribution/payment`): Demo sandbox payment form with test card autofill (`4242 4242 4242 4242`). Supports simulated success and failure testing. Sensitive card details are never stored or persisted.
5. **Success / Failure**:
   - On success: Payment reference issued, local campaign funding immediately incremented, TanStack query cache invalidated, receipt generated.
   - On failure: Friendly diagnostic screen, no campaign funding added.
6. **Receipt** (`/contribution/receipt`): Itemized breakdown of advertising allocation, platform fees, reference code, and date.
7. **Activity**: View all past backed contributions and access receipts at any time.

---

## Centralized Policies & Calculations

- **Fees (`Config.feeStructure`)**:
  - Direct Paid Ad Placement: **85%**
  - Platform Operations & Review: **10%**
  - Payment Processing: **5%**
- **Estimated Impressions (`estimateDirectReach`)**:
  - Calculated directly from the 85% advertising allocation (20–30 impressions per advertising dollar).
  - A $100 contribution → $85 ad budget → **1,700–2,550 Estimated Impressions**.
- **Lifecycle Pipeline**:
  `SUBMITTED_FOR_REVIEW` → `UNDER_REVIEW` → `APPROVED` → `FUNDING` → `FUNDING_GOAL_REACHED` → `DISTRIBUTION_PREPARATION` → `PROMOTING` → `COMPLETED`.

---

## License

Private repository. All rights reserved.
