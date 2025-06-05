# TailTrack

A comprehensive multi-pet care management application that provides an intuitive and engaging platform for pet owners to track, manage, and celebrate their pets' daily activities and health across households.

**Caring for any pet, made simple.**


## ✨ Features

- **Multi-pet support** - Track any pet type (dogs, cats, fish, birds, hamsters, rabbits) with pet-specific care actions
- **Smart primary actions** - Intelligent action buttons adapt based on pet type (Feed + Bathroom for dogs, Feed + Litter Box for cats, etc.)
- **Household coordination** - Multiple family members can share pet care responsibilities with real-time status updates
- **Secure authentication** - Production-hardened login system with comprehensive security measures
- **Activity tracking** - Complete care history with feeding, bathroom, walking, playing, grooming, medication, and training
- **Timezone-aware scheduling** - Accurate care period tracking that adapts to user location and travel
- **Status banners** - Smart notifications showing exactly what care is needed for each pet
- **Progressive Web App** - App Store ready with full offline support and native mobile experience
- **Security hardened** - Production-ready with comprehensive information disclosure protection
- **Performance optimized** - Advanced caching and state management for smooth user experience


## 🛠 Tech Stack

### Frontend
- **React 18** - Component-based UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library

### Backend & Database
- **Express.js** - Node.js web framework with security hardening
- **Supabase PostgreSQL** - Cloud database with real-time capabilities
- **bcryptjs** - Secure password hashing
- **Resend** - Transactional email service for password resets

  
## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tailtrack.git
   cd tailtrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Add your Supabase database URL:
   ```
   DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
   ```

4. **Database setup**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to view the application.


## 📱 Mobile & PWA Support

TailTrack is designed as a Progressive Web App with:

- **Responsive breakpoints** for optimal mobile experience
- **Touch-optimized interactions** with appropriate tap targets
- **Offline functionality** via service worker
- **Install prompts** for native app-like experience
- **Capacitor ready** - Can be easily wrapped for native mobile deployment

### Mobile Installation
1. Open the app in mobile browser
2. Use "Add to Home Screen" option
3. App will launch fullscreen like a native app


## 🎨 Design System

### Color Palette & Theme System
```css
/* Dynamic theme colors based on page context */
--dashboard-theme: #FFD5DC          /* Dashboard - Pup Pink for iOS Safari */
--app-theme: #FAF7F0                /* Other pages - Light Golden Tan */

/* Core color system */
--pup-pink: #FFD5DC to #FFC0CB      /* Primary buttons and dashboard theme */
--golden-tan: #F5E1C0 to #E6D2A0    /* Secondary elements and backgrounds */
--soft-blue: #D4EAF7 to #B3D9F2     /* Bathroom/Let Out action buttons */
--pup-green: #C8EBC5 to #B5E3B1     /* Success states and feeding actions */
--warning-amber: #f59e0b            /* Status warnings and alerts */
--gentle-gray: #e5e7eb              /* Neutral backgrounds */
```

### Visual Identity
- **Pet-centric design** - Interface adapts to pet types with relevant iconography
- **Smart action buttons** - Context-aware primary actions based on pet species
- **Status-driven UI** - Intelligent banner system with specific care guidance
- **Mobile-first design** - Touch-optimized with iOS Safari theme color integration
- **Dynamic theme system** - Page-specific theme colors for enhanced user experience


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide React](https://lucide.dev/) for the icon library

---

Built with ❤️ for pet lovers everywhere
