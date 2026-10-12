# Tripzobox — Go Somewhere. Meet Someone.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-0.441-F56565.svg)](https://lucide.dev/)

> **"Go Somewhere. Meet Someone."**  
> A travel-community platform where people create profiles, discover or create trips, request to join compatible travellers, record authentic experiences in a private diary, and publish practical travel stories.

---

## 📸 Reference Screens & Visual Alignment

Tripzobox is built to pixel-fidelity matching the 12 reference UI screens:
1. **Landing Page (`/`)**: Full-bleed hero image, headline *"Your Journey. Your People. Your Story."*, floating 3-card strip, popular destinations grid.
2. **Sign Up / Login (`/signup`, `/login`)**: Split-screen brand pane with 4 feature bullets, tabbed form with client validation and social authentication buttons.
3. **Dashboard (`/app/dashboard`)**: Time-sensitive greeting, hero destination search banner, 3 quick-action cards (*Travel Vault*, *Find a Trip*, *Travel Diary*), and Recent Trips grid.
4. **Travel Vault (`/app/vault`)**: 4 sub-tabs (*Documents*, *Emergency*, *Contacts*, *Offline Access*), privacy banner, document badges, and Add Document modal.
5. **Find a Trip (`/app/trips`)**: Hero search banner with destination/date/budget filter inputs, category tabs (*Popular*, *Upcoming*, *Nearby*), and responsive trip card grid.
6. **Create a Trip (`/app/trips/create`)**: 3-step wizard with numbered stepper, budget slider, trip type segmented control, and preference chips.
7. **Trip Details (`/app/trips/:tripId`)**: Cover banner, interactive Join Trip status toggle, 5 content tabs (*About*, *Itinerary*, *Members*, *Chat*, *Reviews*), trip leader card, and compatibility fit score.
8. **Travel Diary (`/app/diary`)**: *My Entries* and *Published Stories* tabs, private vs published badges, and quick edit modal.
9. **Add Experience (`/app/diary/add`)**: Drag-and-drop media dropzone with local thumbnail preview, category pills, 5-star interactive rating, and text narrative.
10. **Explore Destinations (`/explore` & `/app/explore`)**: Category filter pills (*All*, *Mountains*, *Beaches*, *Cities*, *Culture*, *Nature*) and destination cards.
11. **Public Travel Story (`/stories/:storySlug`)**: Cover with overlaid title, author follow toggle, 3-photo gallery, stats, and accordion expander for reading full story.
12. **Profile (`/app/profile`)**: Banner cover, circular overlapping avatar, bio, stats row (*12 Trips / 5 Stories / 48 Followers / 12 Following*), 4 tabs (*My Trips*, *My Stories*, *Saved*, *Settings*), and account privacy options.

---

## 🎨 Design System & Color Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `primary` | `#0F9058` | Primary CTA buttons, active navigation state, links, brand badges |
| `secondary` | `#34C759` | Secondary accents, success states |
| `accent` | `#A1F3D0` | Light accent fills, badges, hover backgrounds, chip highlights |
| `text` | `#1F2037` | Headings, primary body typography |
| `light-bg` | `#F8FAF9` | Page canvas, soft card backgrounds |
| `white` | `#FFFFFF` | Cards, surfaces, modal panels |

- **Typography**: Google Fonts — **Poppins** (600/700 weight for headings) and **Inter** (400/500 weight for body).
- **Iconography**: `lucide-react` with consistent 1.75px stroke width.

---

## 📱 Responsive Architecture

- **Desktop (`≥1024px`)**: Full multi-column grids, dual-pane layouts, persistent left sidebar in web app shell.
- **Tablet (`768px – 1023px`)**: 2-column reflow, compact padding, fluid banners.
- **Mobile (`<768px`)**:
  - Web app sidebar collapses into a **fixed 5-icon bottom tab bar** with an elevated center `+` button.
  - Search bar collapses to a search icon with tap-to-expand.
  - Public nav collapses to a smooth slide-over drawer with compact Get Started CTA.
  - Touch targets maintain `≥44×44px` across interactive controls.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+`
- npm `v9+`

### Installation
```bash
# Clone the repository
git clone https://github.com/Valartamizh/TripzoBox.git
cd TripzoBox

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore the app.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
TripzoBox/
├── src/
│   ├── assets/              # Static branding and icons
│   ├── components/
│   │   ├── feature/         # TripCard, DestinationCard, DocumentRow, DiaryEntryCard, StoryCard
│   │   └── ui/              # Button, Input, Card, Badge, Tabs, Avatar, StarRating, Stepper, Modal, SearchBar, Dropzone, EmptyState, Skeleton
│   ├── context/             # AuthContext, TripsContext, DiaryContext, VaultContext, ToastContext
│   ├── data/                # Mock data (Munnar, Varkala, Kochi, Ooty, Goa, Mysuru)
│   ├── layouts/             # PublicShell, AppShell (with mobile bottom tab bar)
│   ├── pages/               # All 12 reference screens + supporting routes
│   ├── styles/              # globals.css, Tailwind configuration
│   ├── types/               # TypeScript data models
│   ├── App.tsx              # React Router v6 routing tree
│   └── main.tsx             # React 18 DOM entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🛡️ Privacy & Safety Model
- **Client-Side Encryption & Storage**: Personal diary entries, custom trips, and Travel Vault documents are persisted in browser `localStorage`.
- **Zero Server Uploads**: File dropzones generate local object URLs (`URL.createObjectURL`) for immediate previews with zero network exposure.
- **Compatibility Disclaimer**: Fit scores reflect travel preference alignments only and include explicit disclaimers regarding independent traveller safety.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
