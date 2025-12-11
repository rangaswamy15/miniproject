# FitStack - AI Workout Assistant Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based, drawing inspiration from premium fitness and productivity platforms

**Key References:**
- **Strava** - Clean data visualization, progress-focused layouts
- **Nike Training Club** - Bold, motivational typography and imagery
- **Apple Fitness+** - Premium feel, clear visual hierarchy
- **Linear** - Clean dashboard structure, modern interface patterns

**Design Principles:**
1. **Motivational Energy** - Design should inspire action and celebrate progress
2. **Data Clarity** - Complex workout data presented with crystal-clear hierarchy
3. **Effortless Tracking** - Minimal friction in logging workouts and viewing progress
4. **Premium Quality** - Polished, professional feel that builds trust in AI recommendations

---

## Typography System

**Font Families:** (via Google Fonts CDN)
- **Display/Headers:** Inter (weights: 700, 800)
- **Body/UI:** Inter (weights: 400, 500, 600)

**Type Scale:**
- **Hero/Landing:** text-6xl to text-7xl (bold 700-800)
- **Page Headers:** text-4xl to text-5xl (bold 700)
- **Section Headers:** text-2xl to text-3xl (semibold 600)
- **Card Titles:** text-xl (semibold 600)
- **Body Text:** text-base (regular 400)
- **Metadata/Labels:** text-sm (medium 500)
- **Captions:** text-xs (regular 400)

**Hierarchy Rules:**
- Dashboard headers use large, bold display type
- Workout stats use oversized numbers (text-5xl+) with small labels
- Form labels and input text maintain clear contrast in weight

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 24**

**Common Patterns:**
- Section padding: `py-16 md:py-24` 
- Card padding: `p-6 md:p-8`
- Component gaps: `gap-6` to `gap-8`
- Form spacing: `space-y-4` to `space-y-6`
- Grid gaps: `gap-4` to `gap-6`

**Container Strategy:**
- Full-width sections with inner `max-w-7xl mx-auto px-6`
- Dashboard content: `max-w-6xl`
- Form containers: `max-w-md` to `max-w-lg`
- Workout player: `max-w-4xl` centered

**Grid Layouts:**
- Dashboard metrics: 3-4 column grid (responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`)
- Exercise library: 2-3 column grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Weekly calendar: 7 column grid (scrollable on mobile)

---

## Component Library

### Navigation
**Header:** Fixed top navigation with backdrop blur (`backdrop-blur-lg bg-white/80`)
- Logo left, primary nav center, user menu right
- Mobile: hamburger menu with slide-out drawer
- Height: `h-16` to `h-20`

### Dashboard Components

**Stat Cards:** Elevated cards with large numbers
- Border radius: `rounded-2xl`
- Shadow: `shadow-lg`
- Padding: `p-6`
- Layout: Large number on top, label below, trend indicator (arrow/percentage)

**Today's Workout Card:** Featured card with prominent CTA
- Larger than other cards: `p-8 md:p-10`
- Exercise count, estimated duration, difficulty badge
- Large "Start Workout" button at bottom

**Progress Charts:** Clean line charts and bar graphs
- Use recharts or similar library
- Minimal gridlines, clear axis labels
- Data points highlighted on hover

**Weekly Calendar:** Horizontal scrollable grid
- Each day card: `w-32 h-40` minimum
- Completed days: checkmark badge
- Today: highlighted with border/shadow
- Future days: muted opacity

### Workout Player
**Exercise Display:** Full-width layout with video/image and controls
- Top: Exercise name (text-3xl bold), muscle group tag
- Center: Large video/image container (16:9 aspect ratio)
- Bottom: Set/rep counter, timer display, "Mark Complete" button
- Navigation: Previous/Next arrows, progress bar showing exercise X of Y

**Set Tracker:** Table-style layout
- Columns: Set #, Target Reps, Actual Reps, Weight, Rest
- Quick input fields with +/- buttons
- Completed sets: checked state with subtle background

### Forms
**Input Fields:** Clean, spacious form design
- Label above input: `text-sm font-medium mb-2`
- Input height: `h-12` to `h-14`
- Border radius: `rounded-lg`
- Focus state: ring and border emphasis
- Helper text: `text-xs` below input

**CTAs:** Bold, confident buttons
- Primary button: Large `px-8 py-4`, `rounded-xl`, bold text
- Secondary button: Outline style with border
- Icon buttons: `w-12 h-12` square or circular

### Plan Editor
**Exercise List:** Draggable cards in vertical list
- Each exercise card: `rounded-xl border p-4`
- Left: Drag handle icon
- Center: Exercise name, sets/reps info
- Right: Edit/delete actions
- Drag indicator: `cursor-grab`, hover state

**Week/Day Tabs:** Horizontal tab navigation
- Active tab: underline or pill style
- Smooth transitions between content

### Admin Dashboard
**Stats Overview:** Large metric cards in grid
- Total users, active plans, workout completion rate
- Trend charts below metrics
- Recent activity feed in sidebar

**Exercise Library Table:** Data table with filters
- Columns: Name, Muscle Group, Equipment, Actions
- Search bar and filter dropdowns above
- Pagination at bottom

---

## Images

**Hero Section (Landing Page):**
- Large full-width hero: Athletic person mid-workout in modern gym
- Height: `h-[600px] md:h-[700px]`
- Overlay gradient for text readability
- CTA buttons with blurred backgrounds (`backdrop-blur-md bg-white/10`)

**Dashboard:**
- Empty state illustration: Friendly graphic encouraging first workout
- Exercise cards: Small thumbnail images (150x150) showing exercise demonstration

**Progress Section:**
- Before/after photo comparison slots (user uploads)
- Achievement badges/icons

**Exercise Library:**
- Each exercise: Video thumbnail or demonstration GIF (16:9)
- Fallback: Muscle group illustration

**Workout Player:**
- Full-width exercise video/image (primary focus)
- High-quality demonstration loops or static poses

---

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: Simple fade-in (`transition-opacity duration-300`)
- Card hover: Subtle lift (`hover:scale-[1.02] transition-transform`)
- Button press: Slight scale down (`active:scale-[0.98]`)
- Progress charts: Animate on load (entrance animation)
- Workout timer: Smooth countdown animation

**No Distracting Effects:** Avoid parallax, excessive scroll animations, or decorative motion

---

## Additional Specifications

**Accessibility:**
- All interactive elements keyboard navigable
- Form inputs with associated labels
- Image alt text for exercise demonstrations
- ARIA labels for icon-only buttons

**Responsive Breakpoints:**
- Mobile-first approach
- Key breakpoints: `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Dashboard rearranges from single column to multi-column grid
- Workout player stacks vertically on mobile, side-by-side on desktop

**Visual Hierarchy:**
- Use size, weight, and spacing to create clear importance levels
- Primary actions always prominent and easy to reach
- Data presented in scannable chunks with clear grouping