# Tripzobox — Frontend Build Prompt for Antigravity

Responsive web app (desktop + mobile) · Frontend-only · No backend, no real auth, no real payments. Paste this whole document as the mission brief in Google Antigravity, with the reference UI image attached to the task.

## 1. Role & Mission

You are a senior frontend engineer building the **Tripzobox MVP marketing + web-app frontend**. Tripzobox is a travel-community platform: people create profiles, discover or create trips, request to join compatible travellers, record real experiences in a private diary, and publish practical travel stories. Brand line: **"Go Somewhere. Meet Someone."**

Your job is to produce a **production-quality, fully responsive, frontend-only** codebase that visually and structurally matches the 12 reference UI screens as closely as possible, and extends the same design language to the handful of supporting pages the product brief requires but the mockups don't show.

This is a **UI/UX implementation task**, not a backend task. Do not build authentication, databases, file storage, real-time messaging, or payment logic. Simulate all of it with mock data, local component state, and browser `localStorage` for persistence between reloads.

## 2. Scope & Non-Goals

**In scope:**

- All 12 reference screens, pixel-close on desktop, fully reflowed for mobile.
- A shared design system (tokens, components) used consistently across every page.
- Client-side routing between every page in the sitemap in Section 6.
- Realistic mock/sample data wired into every list, card, and detail view.
- Full responsive behavior: desktop (≥1024px), tablet (640–1023px), mobile (<640px).
- All interactive UI states: hover, focus, active, loading, empty, error, success, validation — even though nothing is actually submitted to a server.
- Basic client-side form validation (required fields, email/phone format, password rules) with inline error messages — no real submission.
- Accessibility basics: semantic HTML, keyboard navigation, visible focus states, labelled form fields, adequate color contrast, alt text on images.

**Out of scope (do not build):**

- Any backend, API, database, or server code.
- Real authentication/session management, OTP/email verification, or password-reset emails — use mock "fake success" flows only.
- Real file upload/storage for Travel Vault documents — accept files into local state/UI only, never upload anywhere.
- Real-time chat/messaging infrastructure — Trip Chat can be a static or locally-simulated thread.
- Payments, booking engine, loans/EMI, AI recommendations, local-companion marketplace — explicitly "Later" or "Not MVP" per the product brief.
- Admin/moderation backend logic — a Report/Block button can exist in the UI and show a confirmation toast, nothing more.

## 3. Tech Stack (assumed — adjust only if you have a stronger reason)

- **Framework:** React 18 + TypeScript, bundled with Vite.
- **Routing:** React Router v6 (client-side only).
- **Styling:** Tailwind CSS, configured with the exact design tokens in Section 4. Use Tailwind's `theme.extend` for colors/fonts/spacing rather than scattering hex codes through components.
- **Icons:** `lucide-react` (closest free match to the thin outline icon style in the reference) — pick one consistent set and stick to it everywhere.
- **Fonts:** Google Fonts — **Poppins** (headings, 600/700 weight) and **Inter** (body, 400/500 weight), loaded via `<link>` or `@fontsource`.
- **State:** React Context + hooks for a mock "logged in user", trips, diary entries, documents, etc. No Redux needed at this size.
- **Forms:** Plain controlled components + a small validation helper (or `react-hook-form`) — client-side checks only.
- **Animation:** Tailwind transitions + `framer-motion` for page/card entrance and modal transitions — subtle, never gratuitous.
- **Persistence:** `localStorage` so mock "created trips", "diary entries", and "uploaded documents" survive a refresh, so demos feel real.

## 4. Design System — extracted from the reference image

### 4.1 Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#0F9058` | Primary buttons, active nav state, links, icons-on-brand |
| `secondary` | `#34C759` | Secondary accents, success states, pairs with primary |
| `accent` | `#A1F3D0` | Light accent fills, badges, hover backgrounds, chip highlights |
| `text` | `#1F2037` | Primary body/heading text |
| `light-bg` | `#F8FAF9` | Page background, card backgrounds on dark sections |
| `white` | `#FFFFFF` | Cards, surfaces, nav background |

Derive supporting neutrals (borders, muted text, disabled states) as tints/shades of `text` and `light-bg` — do not invent an unrelated gray scale.

### 4.2 Typography

- Headings: **Poppins**, Bold (700) for page titles/hero, SemiBold (600) for section headers and card titles.
- Body: **Inter**, Regular (400) for paragraphs/labels, Medium (500) for emphasized body text, button labels, and nav items.
- Suggested scale: hero H1 \~40–48px, page H1 \~28–32px, section H2 \~20–22px, card title \~16–18px, body \~14–16px, caption \~12–13px. Keep a consistent scale via Tailwind `fontSize` tokens rather than ad hoc sizes.

### 4.3 Icon style

Thin-stroke outline icons (home, shield, people/users, image/gallery, compass, bell, user) at a consistent stroke width (\~1.5–1.75px) and consistent sizing (20–24px in nav, 16–18px inline). Never mix filled and outline icon sets.

### 4.4 Buttons (3 variants used throughout)

- **Primary button:** filled `primary` green background, white text, large-radius corners (\~8–12px), medium-weight label, subtle hover darken + slight shadow lift.
- **Secondary button:** white/transparent background, `primary` green border and text, same radius as primary, hover fills light `accent` background.
- **Text link:** `primary` green text, no border/background, underline or color-shift on hover.

### 4.5 Core UI components to build once, reuse everywhere

Button (3 variants × 3 sizes), Input/Textarea/Select (label, helper text, error state), Card (image-top variant, list-row variant), Badge/Chip (status + selectable preference chips), Tabs, Avatar (with stacked-avatar-group variant for "members"), Star rating input/display, Stepper (numbered step indicator for Create Trip), Modal/Dialog, Toast, Search bar (icon + optional filters), Sidebar nav item, Bottom tab bar item (mobile), Progress/upload dropzone, Empty state block, Skeleton loader.

Build these as a small internal library (`src/components/ui/`) before building pages — pages should only compose these, never redefine styles inline.

## 5. Global Navigation & Layout

Two distinct navigation contexts, matching the reference and the brief's sitemap:

**A. Public / marketing shell** (Landing, Explore Destinations, Public Story, Sign Up/Login, Safety & Community Rules, About/Contact, Terms/Privacy, How It Works): top horizontal nav — logo left, nav links center (`Explore`, `Trips`, `Stories`, `Safety`, `About`), `Login` text link + `Get Started` primary button right.

**B. Logged-in web-app shell** (Dashboard, Travel Vault, Trips, Trip Details, Travel Diary, Add Experience, Explore, Profile, Messages, Notifications, Settings): persistent **left sidebar** (desktop) with icon+label nav items — Dashboard, Travel Vault, Trips, Travel Diary, Explore, Messages, Notifications, Profile — active item highlighted in `primary` green. Top bar inside this shell: search input, notification bell icon, user avatar + name.

**Mobile collapse rule (this is the core "responsible/responsive" behavior):**

- Public shell: nav links collapse into a hamburger / slide-over drawer below \~1024px; `Get Started` stays visible as a compact button.
- App shell: the left sidebar does **not** become a hamburger — convert it into a **fixed bottom tab bar** (5 icons max: Dashboard, Trips, Add/Create \[center, elevated primary-colored button\], Travel Diary, Profile) on screens <768px, the standard pattern for this kind of app that keeps primary actions thumb-reachable. Move the remaining nav items (Travel Vault, Explore, Messages, Notifications) into the avatar/menu or a "More" tab.
- The top search bar collapses to a search icon that expands to full width on tap, on mobile.
- Every multi-column grid (destination cards, trip cards, document list) reflows: 4-col → 2-col (tablet) → 1-col (mobile). Every 2-pane layout (Sign Up/Login split screen, Trip Details content+sidebar) stacks vertically on mobile, content pane first, image/sidebar pane below or as a collapsible section.

## 6. Sitemap & Routing

Build every route below. Use the 12 reference screens as the exact visual spec for the marked pages; for the rest, extend the same design system with your best judgment (the brief explicitly says: "Treat reference mockups as direction, not final requirements").

**Public routes**

- `/` — Landing (reference #1)
- `/signup`, `/login` — Sign Up / Login (reference #2, tabbed single page or two routes sharing one component)
- `/forgot-password` — mock password-reset form (success toast, no email actually sent)
- `/explore` — Explore Destinations (reference #10, public variant without sidebar)
- `/explore/:destinationSlug` — destination detail (new page: hero image, description, related public stories — follow the Public Story visual language)
- `/stories/:storySlug` — Public Travel Story (reference #11)
- `/how-it-works`, `/safety`, `/about` — content pages using the same typography/section patterns as Landing; pull copy for `/safety` from the brief's "Trust, Safety, Privacy" section.
- `/terms`, `/privacy` — plain long-form text pages, same shell.

**Logged-in app routes** (wrap in the app shell; assume a mock logged-in user after Sign Up/Login, stored in Context)

- `/app/dashboard` — Dashboard (reference #3)
- `/app/vault` — Travel Vault (reference #4), with all 4 sub-tabs built (Documents, Emergency, Contacts, Offline Access), not just Documents.
- `/app/trips` — Find a Trip (reference #5)
- `/app/trips/create` — Create a Trip, 3-step flow (reference #6 is step 1; build steps 2 "Preferences" and 3 "Review" with the same card/stepper pattern)
- `/app/trips/:tripId` — Trip Details (reference #7), all 5 tabs built (About, Itinerary, Members, Chat, Reviews) — Chat can be a static mock thread UI.
- `/app/trips/my` — "My Trips" list (reuse the trip-card grid pattern)
- `/app/diary` — Travel Diary (reference #8), both sub-tabs (My Entries, Published Stories)
- `/app/diary/add` — Add Experience (reference #9)
- `/app/diary/create-story` — compose a story from selected diary entries (new page; follow brief Journey C: select entries → title/destination/dates/summary → preview exactly what's public → publish)
- `/app/explore` — Explore Destinations, logged-in variant with sidebar (reference #10)
- `/app/profile` — Profile (reference #12), all 4 tabs (My Trips, My Stories, Saved, Settings)
- `/app/messages` — trip group messages list + thread view (new page, same visual language as the Trip Chat tab)
- `/app/notifications` — notifications list (new page: simple icon+text+timestamp rows)
- Settings lives inside Profile → Settings tab rather than a separate route, unless you prefer a dedicated page.

## 7. Mock Data Model

Seed each interface with 5–10 realistic entries, reusing the destinations named in the brief: Munnar, Varkala, Kochi, Ooty, Coimbatore/Isha Foundation, Kodaikanal, Goa, Mysuru.

```ts
interface User {
  id: string; name: string; avatarUrl: string; city: string;
  languages: string[]; bio: string; travelInterests: string[];
  budgetStyle: 'budget' | 'mid-range' | 'comfort';
  stats: { trips: number; stories: number; followers: number; following: number };
}

interface Trip {
  id: string; name: string; destination: string; startCity: string;
  startDate: string; endDate: string; budgetPerPerson: number;
  tripType: 'solo' | 'group' | 'couple';
  preferences: string[]; // Hiking, Nature, Food, Photography, Culture, Beaches
  description: string; highlights: string[];
  leader: User; members: User[]; maxMembers: number;
  difficulty: 'easy' | 'medium' | 'hard';
  coverImageUrl: string; status: 'open' | 'full' | 'closed';
}

interface JoinRequest { id: string; tripId: string; userId: string; status: 'pending' | 'accepted' | 'declined'; }

interface DiaryEntry {
  id: string; userId: string; place: string; date: string;
  category: 'Nature' | 'Food' | 'Culture' | 'Beach' | 'Adventure' | 'Other';
  text: string; photos: string[]; price?: number; rating?: number;
  tips?: string; isPublished: boolean; storyId?: string;
}

interface Story {
  id: string; title: string; destination: string; dates: string;
  summary: string; coverImageUrl: string; author: User;
  entries: DiaryEntry[]; likes: number; comments: number; views: number; readTimeMins: number;
}

interface Destination {
  id: string; name: string; state: string;
  category: 'Mountains' | 'Beaches' | 'Cities' | 'Culture' | 'Nature';
  imageUrl: string; shortDescription: string;
}

interface VaultDocument {
  id: string;
  type: 'Passport' | 'Aadhaar' | 'DrivingLicense' | 'Insurance' | 'FlightTicket' | 'HotelBooking' | 'Other';
  name: string; validTill?: string; fileUrl?: string;
  visibility: 'private' | 'trusted-contacts' | 'offline-available';
}
```

## 8. Page-by-Page Visual Specification

### 8.1 Landing Page (`/`)

- Sticky top nav: logo + wordmark left; center links `Home, Explore, Trips, Stories, Safety, About`; right: `Login` (text link) + `Get Started` (primary button).
- Full-bleed hero: travel photo (person overlooking a cliff/lake with a backpack), dark gradient overlay for legibility. H1 "Your Journey. Your People. Your Story." — style each line with "Your" plus a highlighted word as in the reference. One-line subtext. Two CTAs: `Start Exploring` (primary), `How It Works` (secondary, ghost-on-image variant).
- A floating 3-card strip near the bottom of the hero (semi-opaque white cards) summarizing Travel Vault / Find Your People / Travel Diary, each: icon, title, one-line description.
- "Popular Destinations" section: header + `View all →` link, 4-card responsive grid (image, destination name, state), reusing the Destination card component.
- Footer: logo, tagline "Go Somewhere. Meet Someone.", link columns (Company, Product, Legal), social icons.

### 8.2 Sign Up / Login (`/signup`, `/login`)

- Two-column split on desktop (collapses to a single column, image-as-top-banner, on mobile).
- Left: full-height background image with dark overlay, headline "New places. Real people. Better journeys.", one-line subtext, 4 feature bullets each with a small icon (Secure travel info / Connect with genuine travellers / Discover amazing destinations / Share your journey).
- Right: white panel, `Sign Up` / `Login` tab toggle at top (underline-active style), form: Full Name (signup only), Email or Phone Number, Password (with eye-icon show/hide), primary full-width submit button, `or` divider, `Continue with Google` and `Continue with Apple` outline buttons with brand icons, footer text link to switch modes.
- Validation: required fields, basic email/phone pattern check, password min length — inline red helper text, never a real network call.

### 8.3 Dashboard (`/app/dashboard`)

- App shell (sidebar + topbar) as defined in Section 5.
- Greeting block: "Good morning, {user.name}! 👋" (derive morning/afternoon/evening from local time) + "Where would you like to go next?" over a hero search banner with a destination-search input.
- 3 quick-action cards in a row (Travel Vault / Find a Trip / Travel Diary): icon badge, title, one-line description, CTA button each (`Open Vault`, `Explore Trips`, `Open Diary`) linking to the respective route.
- "Recent Trips" section header + `View all →`, 3-card trip grid (image, trip name, date range, member count).

### 8.4 Travel Vault (`/app/vault`)

- Page header: title + subtitle + `+ Add Document` primary button (opens a modal with document type, name, valid-till, file picker — file just gets a local object URL, never uploaded).
- Tab row: `Documents` (active), `Emergency`, `Contacts`, `Offline Access` — build real content for each (Emergency: contact list + "add contact" form; Contacts: trusted-contact list with a privacy toggle; Offline Access: a toggle list of which document types are cached offline, with a help banner explaining the privacy model).
- Documents tab: list rows — colored icon badge per type, name, validity line, `View` button, 3-dot menu (View/Share/Delete — mock only).
- Include a small privacy disclaimer banner pulled from the brief: documents are private by default; the user explicitly chooses what's shared.

### 8.5 Find a Trip (`/app/trips`)

- Hero search banner: "Find Your Next Trip" + subtext + search bar (Destination, Date, Budget fields + green `Search` button).
- Tabs: `Popular Trips` (active), `Upcoming`, `Nearby`.
- Responsive trip-card grid (3-col desktop → 1-col mobile): image with a save/heart toggle icon top-right, trip name, date range + member count, price per person; clicking a card routes to Trip Details.
- Empty state (no results after filtering): icon + "No trips match your filters" + `Clear filters` button.

### 8.6 Create a Trip (`/app/trips/create`)

- Title + subtitle, 3-step stepper (`1 Trip Details` active green, `2 Preferences`, `3 Review`), advancing on `Next`.
- Step 1 fields: Trip Name, Destination, Start Date, End Date, Budget per person (range input, displayed as "₹X – ₹Y"), Trip Type segmented control (Solo/Group/Couple), optional Preferences chip-select (Hiking, Nature, Food, Photography, Culture, Beaches — multi-select pills, selected = filled primary/accent).
- Step 2 "Preferences": group size input, itinerary notes, additional interest chips.
- Step 3 "Review": full summary card of everything entered, `Publish Trip` primary button — on submit, push the new trip into mock state/localStorage and route to its new Trip Details page with a success toast.
- Full-width primary button at the bottom of each step (e.g. `Next: Add Preferences →`), with a `Back` text link.

### 8.7 Trip Details (`/app/trips/:tripId`)

- `← Back to Trips` link, hero banner image.
- Title row: trip name + share icon + bookmark icon; info row with icons (dates, duration, budget, Group/Solo badge); stats row (Members "4/8", Difficulty, Type); `Join Trip` primary button top-right (becomes `Request Pending` / `Joined ✓` after click — simulate accept/decline with a short delay or a toggle for demo purposes).
- Tabs: `About` (active) — description + "Trip Highlights" chip list; `Itinerary` — day-by-day list; `Members` — avatar grid with name/role; `Chat` — static/mock message thread with an input bar (no real sending); `Reviews` — simple review card list.
- Right sidebar (stacks below content on mobile): `Trip Leaders` card (avatar, name, role), `Members (4/8)` avatar stack, `Share Trip` secondary button.
- If you show any "compatibility %", include the brief's disclaimer: it reflects preference fit only, never a safety guarantee.

### 8.8 Travel Diary (`/app/diary`)

- Header: title + subtitle + `+ Add Experience` primary button.
- Tabs: `My Entries` (active), `Published Stories`.
- Entry cards: thumbnail image, place name, date + category badge, 2-line description, `Edit` link + 3-dot menu (Delete/Add to Story).
- Entries are private by default per the brief — show a "Private" badge on unpublished entries and a "Published" badge (linking to the public story) on ones that are part of a story.

### 8.9 Add Experience (`/app/diary/add`)

- Title + subtitle.
- Form: Place Name, Category dropdown, 5-star rating input (click to set), Price (optional), "Write your experience" textarea, photo/video dropzone (drag-and-drop styling + click-to-upload, camera icon, accepts multiple, shows thumbnails from local object URLs).
- `Save Experience` primary button — pushes a new DiaryEntry into state/localStorage, success toast, redirect to `/app/diary`.

### 8.10 Explore Destinations (`/explore` and `/app/explore`)

- Header + subtitle, category filter pill row (`All` active, Mountains, Beaches, Cities, Culture, Nature, with an overflow `→` if more categories than fit).
- Responsive destination grid (3-col → 1-col), each card: image, name, state label. Clicking routes to a destination detail page showing a hero image, description, and a grid of related Public Story cards.

### 8.11 Public Travel Story (`/stories/:storySlug`)

- Large hero image with overlaid title, author name, trip date, and `X min read`.
- Intro paragraph (practical/narrative travel-story copy).
- Photo gallery grid (3 images).
- Stats row: likes, comments, views + a `Read Full Story` primary button that reveals the rest of the article inline (accordion-style, since there's no backend to paginate).
- Right sidebar: `Related Stories` — 3 mini cards (image, title, author), stacking below content on mobile.
- Keep the product's safety posture visible in the UI copy even though there's no real publish flow (e.g. a quiet caption about reviewing before publishing).

### 8.12 Profile (`/app/profile`)

- Cover banner image + circular avatar overlapping the bottom edge, name, bio tagline, location, `Edit Profile` primary button (opens a modal mirroring the User model fields).
- Stats row: Trips / Stories / Followers / Following counts.
- Tabs: `My Trips` (active), `My Stories`, `Saved`, `Settings`.
- `My Trips` tab: "Recent Trips" section + `View all →`, trip-card grid.
- `Settings` tab: account fields (name, email/phone, languages, travel interests, budget/style), a `Privacy` sub-section (profile visibility, who can see exact trip dates/locations, blocked users list), and a `Delete Account` destructive action (confirmation modal only, no real deletion beyond local mock state).

## 9. States & Interactions

Implement these consistently across every page, not just once as a demo:

- **Loading:** skeleton loaders on cards/lists for a brief simulated delay (\~300–600ms) after a route change or action — enough to show the pattern, not enough to annoy.
- **Empty:** every list screen needs a designed empty state (no trips, no diary entries, no documents, no notifications) with an icon, a short message, and a relevant CTA.
- **Error:** a generic inline error component for failed validation, plus a toast for the rare mock "failed" action (e.g. "This trip is full" when requesting to join a full trip) to demonstrate the pattern.
- **Success:** toast notifications for Publish Trip, Save Experience, Join request sent, Document added, Profile saved, and similar actions.
- **Validation:** real-time or on-submit field-level errors — red border + helper text under each invalid field; disable submit while invalid where that matches the pattern (e.g. Sign Up).
- **Hover / focus / active:** every interactive element needs a visible hover state and a visible keyboard-focus state — never rely on the default browser outline alone; use a consistent `primary`-green focus ring.

## 10. Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`).
- Meaningful `alt` text on all content images; `alt=""` on purely decorative images.
- Every form input has an associated `<label>`, not just placeholder text.
- Verify color contrast, especially text-on-image overlays and `accent` chip text, meets WCAG AA (≥4.5:1 for body text).
- Full keyboard operability: tab order follows visual order, every button/link is reachable and triggerable via keyboard, modals trap focus and close on Escape.
- Touch targets ≥44×44px on mobile, especially the bottom tab bar icons and card action buttons.

## 11. Animations & Micro-interactions

- Subtle fade/slide-in for cards on scroll or page load (stagger \~40–60ms per card, each under \~300ms).
- Button hover: scale/shadow lift (\~150ms ease).
- Modal/drawer: slide + fade (\~200ms).
- Tab switches: underline/background slide, content cross-fade.
- Toasts: slide in from top-right (desktop) / top (mobile), auto-dismiss after \~3–4s.
- Respect `prefers-reduced-motion` — fall back to instant or opacity-only transitions.

## 12. Suggested Folder Structure

```
src/
  main.tsx, App.tsx
  routes/            # route definitions, public vs app layouts
  layouts/           # PublicShell, AppShell
  components/ui/     # Button, Input, Card, Badge, Tabs, Avatar, StarRating,
                      # Stepper, Modal, Toast, SearchBar, Dropzone, EmptyState, Skeleton
  components/<feature>/  # TripCard, DestinationCard, DocumentRow, DiaryEntryCard, StoryCard, ...
  pages/             # one file or folder per route in Section 6
  context/           # AuthContext (mock), TripsContext, DiaryContext, VaultContext —
                      # all backed by mock data + localStorage
  data/              # mockUsers.ts, mockTrips.ts, mockDestinations.ts, mockStories.ts, mockDocuments.ts
  styles/            # tailwind.config.ts tokens, globals.css, font imports
  assets/            # icons if not using a library, logo
  types/             # shared TS interfaces from Section 7
```

## 13. Acceptance Criteria / Definition of Done

- [ ] All 12 reference screens are implemented and visually match the provided image closely on desktop (colors, fonts, spacing, icon style, button styles).
- [ ] Every route in Section 6 exists and is reachable via the nav.
- [ ] The app is fully usable at 375px (mobile), 768px (tablet), and 1440px (desktop) widths, with no horizontal scroll, no overlapping elements, and no illegible text.
- [ ] The sidebar → bottom-tab-bar collapse works correctly below 768px in the app shell.
- [ ] Every form has working client-side validation and a visible success/loading/error state, with zero real network calls.
- [ ] Mock data persists across a reload (localStorage) for anything the user "creates" (trips, diary entries, documents).
- [ ] Keyboard navigation and screen-reader labels work across the whole app (a full flow is completable without a mouse).
- [ ] Reasonable Lighthouse (or equivalent) scores on Accessibility and Best Practices for a frontend-only prototype.
- [ ] No console errors or warnings in dev mode.

## 14. Build Order — Instructions for Antigravity

1. Scaffold the project (Vite + React + TS + Tailwind), install fonts/icons, set up Tailwind theme tokens from Section 4.
2. Build the core `components/ui/` library from Section 4.5 in isolation (a quick internal `/dev/components` check route is fine) before touching any real page.
3. Build `PublicShell` and `AppShell` layouts, including the mobile nav collapse behavior from Section 5.
4. Wire up routing (Section 6) with placeholder pages first, so navigation works end-to-end early.
5. Build mock data + Context providers (Section 7) before building pages that consume them.
6. Implement pages in this order: Landing → Sign Up/Login → Dashboard → Find a Trip → Trip Details → Create a Trip → Travel Diary → Add Experience → Travel Vault → Explore → Public Story → Profile → remaining sitemap pages.
7. Pass over every page a second time for responsive QA at the three breakpoints in Section 13.
8. Final pass: states & interactions (Section 9), accessibility (Section 10), animations (Section 11).
9. Do not do backend/API work. If something seems to require a server, mock it client-side and leave a short code comment noting the assumption.

## 15. Using Antigravity's Agent Capabilities

Antigravity's agents are multimodal and can plan, edit, run terminal commands, and control a browser — use all of that for this build, not just code generation:

- **Attach the reference image to the task itself**, not just this document, so the agent can keep re-checking its own output against it throughout the build rather than only at the start.
- **Ask for a plan before any code.** Have Antigravity produce a short task list mirroring Section 14's build order, and review that plan before letting it proceed — catch a wrong assumption before it's built, not after.
- **Use the built-in browser as your visual QA loop, continuously.** After each page in Section 8 is implemented, have the agent open the local dev server in its browser, resize to 375px / 768px / 1440px, take a screenshot, and compare it against the matching reference screen crop — fixing color, spacing, type, or layout mismatches before moving to the next page, rather than batching all QA to the end.
- **Build the shared component library first, sequentially.** If you use Antigravity's Manager view to run multiple agents in parallel on different pages, make sure every agent branches from a point where the Section 4.5 component library already exists — otherwise you'll get visual drift between pages built by different agents.
- **Have the agent flag any guess it had to make.** The brief is explicit that the reference mockups are "direction, not final requirements" — ask the agent to note, in its task summary or as code comments, any field or flow it had to invent because neither the brief nor the screens specified it, so you can confirm or correct it.
- **Review the agent's walkthrough/artifact before merging.** Treat it as the acceptance check against Section 13's Definition of Done, not a substitute for loading the app yourself.
