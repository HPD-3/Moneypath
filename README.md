#  Moneypath

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success"/>
  <img src="https://img.shields.io/badge/frontend-Firebase-orange"/>
  <img src="https://img.shields.io/badge/backend-Vercel-black"/>
  <img src="https://img.shields.io/badge/auth-Firebase-blue"/>
  <img src="https://img.shields.io/badge/license-MIT-green"/>
</p>

> A fullstack finance tracking web app using Firebase + Vercel serverless architecture.

\---

##  Live Demo

*  Deployed Version: [Link Here!](https://moneypath-7777.firebaseapp.com/)


\---

##  Screenshots

###  Dashboard

![Dashboard Screenshot](./src/assets/21.png)

###  Login

![Dashboard Screenshot](./src/assets/Login.png)

\---

##  Architecture

User → Firebase Hosting → Axios → Vercel API → Database

\---

##  Project Structure

front-end/
├── src/
├── public/
├── .env
├── firebase.json
└── server/
├── controllers/
├── middleware/
├── routes/
├── server.js
├── package.json
└── vercel.json

\---

##  Tech Stack

Frontend: React (Vite), Firebase Hosting, Axios, Tailwind CSS  
Backend: Node.js, Express, Vercel, Firebase Admin SDK  
Auth: Firebase Auth, Firebase Admin SDK  
Database: Firestore

\---

##  Dependencies

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **React** | ^19.2.0 | UI library |
| **React DOM** | ^19.2.0 | React DOM binding |
| **React Router DOM** | ^7.13.1 | Client-side routing |
| **Firebase** | ^12.10.0 | Authentication & Firestore |
| **Axios** | ^1.13.6 | HTTP client |
| **Vite** | ^7.3.1 | Build tool & dev server |
| **Tailwind CSS** | ^3.4.4 | Utility-first CSS framework |
| **@mui/material** | ^5.18.0 | Material Design components |
| **@mui/x-charts** | ^7.29.1 | Chart components |
| **Chart.js** | ^4.5.1 | Charting library |
| **React Chart.js 2** | ^5.2.0 | React wrapper for Chart.js |
| **GSAP** | ^3.14.2 | Animation library |
| **Lucide React** | ^1.7.0 | Icon library |
| **Class Variance Authority** | ^0.7.1 | CSS class utilities |
| **clsx** | ^2.1.1 | Conditional classnames |
| **Radix UI** | ^1.4.3 | Unstyled accessible components |
| **Emotion** | ^11.14.0+ | CSS-in-JS library |
| **Tailwind Merge** | ^3.5.0 | Merge Tailwind classes |

### Frontend Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **ESLint** | ^9.39.1 | Code linting |
| **@vitejs/plugin-react** | ^5.1.1 | Vite React plugin |
| **Autoprefixer** | ^10.4.27 | CSS vendor prefixer |
| **PostCSS** | ^8.5.8 | CSS processing |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **Express** | ^5.2.1 | Web framework |
| **Firebase Admin SDK** | ^13.7.0 | Firebase backend access |
| **CORS** | ^2.8.6 | Cross-origin resource sharing |
| **Resend** | ^6.10.0 | Email service |

\---

##  Getting Started

### Clone

git clone <your-repo>
cd front-end

### Frontend

npm install

Create .env:
VITE\_API\_URL=https://your-backend.vercel.app

Run:
npm run dev

### Backend

cd server
npm install
vercel --prod

\---

## 🔌 API Docs

### POST /auth/register

Request:
{
"email": "user@example.com",
"password": "123456"
}

Response:
{
"message": "User created"
}

### POST /auth/login

Response:
{
"token": "..."
}

### GET /auth/profile

Header:
Authorization: Bearer <token>

Response:
{
"uid": "123",
"email": "user@example.com"
}

\---

##  Deployment

Backend:
cd server
vercel --prod

Frontend:
npm run build
firebase deploy

\---

##  Landing Page Components

### Overview
The landing page (`src/pages/Landing.jsx`) has been redesigned with modern UI components, animations, and responsive mobile support. Below is a detailed guide on all components and how to customize them.

### Components & Structure

#### 1. **GlobalStyles**
Provides all global CSS styles including animations, typography, and component-specific styles.

**Key Styles:**
- `.fade-up` - Intersection observer animation that fades elements up from bottom
- `.nav-link` - Navigation link with animated underline (green #B7FF9F)
- `.feature-card` - Clickable feature cards with active state styling
- `.navbar-bg` - Glassmorphism blur effect for navbar

**Customization:**
```jsx
// Modify animation timing
.fade-up {
    transition: all 0.7s ease; // Change duration here
}

// Adjust navbar blur strength
.navbar-bg {
    backdrop-filter: blur(10px); // Increase/decrease blur amount
    background: rgba(23, 38, 25, 0.7); // Adjust opacity
}
```

#### 2. **Navbar Component**
A fixed, responsive navigation bar with:
- Logo display
- Desktop navigation links with hover underline effects
- Mobile hamburger menu with animated icon
- Login/Register buttons
- Glassmorphism background effect

**Features:**
- Animated hamburger menu (3-line animation transforms to X)
- Mobile menu dropdown with smooth animations
- Active link state tracking
- Auto-close menu on navigation

**Mobile Menu:**
```jsx
// The mobile menu automatically closes when:
- A navigation link is clicked
- A button is pressed
- This prevents menu from staying open
```

#### 3. **Hero Component**
Full-width hero section with:
- Gradient background (green gradient from #172619 to #558C5C)
- Animated glow effect (green blur behind phone mockup)
- Responsive text and image layout
- Fade-up animation on load

**Customization:**
```jsx
// Adjust glow effect
<div className="absolute w-[400px] h-[400px] bg-green-400 opacity-20 blur-3xl">
  {/* Change width/height, opacity, or blur-3xl value */}
</div>

// Modify background gradient
className="bg-gradient-to-b from-[#172619] via-[#36593B] to-[#558C5C]"
{/* Change hex colors or gradient direction */}
```

#### 4. **FeatureCard Component**
Individual feature cards that:
- Display icon, title, and description
- Highlight on click (active state)
- Animate with fade-up on page load
- Change styling when active

**Active Card Styling:**
```jsx
.feature-card.active {
    background: linear-gradient(135deg, #1E5B3A, #0B2E1E);
    color: white;
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
```

#### 5. **Features Component**
Grid of 6 feature cards showcasing app features:
- **Saldo** - Balance and transaction management
- **Video Edukasi** - Educational video content
- **Learning Path** - Structured financial learning modules
- **Quiz** - Interactive quizzes with progress tracking
- **Rekap** - Monthly financial recap reports
- **Tabungan** - Savings goal tracking

**Default Active Card:**
The 3rd card (Learning Path) is active by default:
```jsx
const [activeCard, setActiveCard] = useState(2);
// Change 2 to 0, 1, 3, 4, or 5 for different default card
```

#### 6. **TestimonialCard Component**
Individual testimonial card with:
- User quote/review
- User avatar placeholder
- Name and role

#### 7. **Testimonial Section**
Dark background section with:
- Circular background decoration (lingkaran.png)
- Multiple testimonial cards in a scrollable container
- 4 sample testimonials from Nadia, Hannah, Ammar, and Lilya

#### 8. **ImportantStuff Component (Accordion)**
Interactive accordion section showcasing:
- 3 expandable items
- Plus/minus icons that animate
- Expanded item shows full description
- Only one item can be expanded at a time (default: item 2)

**Default Expanded Item:**
```jsx
const [expandedItem, setExpandedItem] = useState(2);
// Change 2 to 0 or 1 for different default expanded item
```

**Item Structure:**
```jsx
{
    title: "Item Title",
    description: "Full description text shown when expanded"
}
```

#### 9. **CTA (Call-to-Action) Component**
Bottom section with:
- Large green text headline
- Call-to-action buttons
- Darker gradient background

#### 10. **Footer Component**
Simple footer with copyright information.

### How to Customize & Replicate

#### Adding New Feature Cards
1. Open `src/pages/Landing.jsx`
2. Locate the `featureCards` array in the `Features` component
3. Add a new object to the array:

```jsx
{
    title: "Your Feature Name",
    description: "Feature description text here",
    icon: {
        bgColor: "bg-purple-100", // Tailwind bg color
        element: (
            <svg className="w-7 h-7 text-purple-600" /* your SVG icon */>
        ),
    },
}
```

#### Changing Colors
All colors use Tailwind classes and can be modified:
- Primary green: `#9FF782` (lime)
- Dark green: `#1E5B3A` or `#0B2E1E`
- Accent green: `#B7FF9F`

Find & replace these hex values or change Tailwind classes like:
- `bg-green-100` → `bg-blue-100`
- `text-green-600` → `text-blue-600`

#### Modifying Animations
**Fade-up timing:**
```jsx
.fade-up {
    transition: all 0.7s ease; // Change 0.7s to your desired duration
}
```

**Hamburger animation:**
```jsx
className={`transition-all duration-300 ${mobileMenuOpen ? "rotate-45" : ""}`}
// Change duration-300 to duration-200, duration-500, etc.
```

#### Adding New Testimonials
In the `Testimonial` component, add to the testimonial cards:

```jsx
<TestimonialCard
    quote="User's review text here"
    name="User Name"
    role="User Role"
/>
```

#### Updating Images
Replace image imports:
```jsx
import logo2 from "../assets/logo2.png";
import phonemockup from "../assets/phone-mockup (2).png";
// Ensure new images are in src/assets/ folder
```

### Key Technologies Used

- **React** - Component-based UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Intersection Observer API** - For fade-up animations
- **CSS Backdrop Filter** - For glassmorphism effect
- **SVG Icons** - Inline SVG icons for features

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS, Android)
- Supports backdrop-filter (use fallback for older browsers)

### Performance Notes

- Images optimized with object-contain
- CSS animations use GPU-accelerated properties (transform, opacity)
- Intersection Observer for efficient scroll animations
- No external animation libraries needed

\---


