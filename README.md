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
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Performant form handling with validation

### Backend & Database
- **Express.js** - Node.js web framework with security hardening
- **Supabase PostgreSQL** - Cloud database with real-time capabilities
- **Drizzle ORM** - Type-safe database queries and migrations
- **bcryptjs** - Secure password hashing
- **Resend** - Transactional email service for password resets
- **Zod** - Schema validation and type safety

### Development Tools
- **ESBuild** - Fast JavaScript bundling
- **PostCSS** - CSS processing
- **Drizzle Kit** - Database migrations
- **TypeScript** - Static type checking

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

Visit `http://localhost:5000` to view the application.

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

## 🏗 Architecture

### Database Schema
```typescript
// Households table
households {
  id: serial primary key
  name: varchar
  inviteCode: varchar unique
  creatorId: integer (foreign key)
  createdAt: timestamp
}

// Users table
users {
  id: serial primary key
  username: varchar unique
  email: varchar unique  
  passwordHash: varchar (bcrypt hashed)
  displayName: varchar
  householdId: integer (foreign key)
  householdJoinedAt: timestamp
  createdAt: timestamp
}

// Pets table
pets {
  id: serial primary key
  householdId: integer (foreign key)
  name: varchar
  petType: varchar ('dog' | 'cat' | 'fish' | 'bird' | 'hamster' | 'rabbit')
  photoUrl: varchar
  createdAt: timestamp
}

// Activities table
activities {
  id: serial primary key
  userId: integer (foreign key)
  householdId: integer (foreign key)
  petIds: integer[] (array of pet IDs)
  action: varchar ('Fed' | 'Bathroom' | 'Walked' | 'Played' | 'Groomed' | 'Medication' | 'Training' | 'Litter Box' | 'Clean Cage' | 'Clean Tank')
  timestamp: timestamp
}

// Password Reset Tokens table
passwordResetTokens {
  id: serial primary key
  userId: integer (foreign key)
  token: varchar unique
  expiresAt: timestamp
  used: boolean
  createdAt: timestamp
}
```

### State Management
- **TanStack Query** for server state and caching
- **React Context** for authentication and pet management state
- **Local state** for UI interactions and form handling
- **Timezone-aware caching** with intelligent invalidation
- **Household-based data sharing** - Real-time activity coordination across family members
- **Smart action state** - Pet-specific action buttons with spam protection

### Performance Optimizations
- **Spam protection** - Intelligent action debouncing to prevent duplicate activities
- **Optimistic updates** for immediate UI feedback
- **Timezone-aware caching** with automatic invalidation
- **Code splitting** for reduced bundle size
- **Component memoization** to prevent unnecessary re-renders
- **Image compression** for pet photos with automatic format conversion

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

### Component Architecture
- **Atomic design principles** with reusable components
- **Compound component patterns** for complex UI elements
- **Custom hooks** for business logic separation
- **TypeScript interfaces** for prop validation

## 🔒 Security & Production Readiness

TailTrack has undergone comprehensive security hardening for App Store submission and production deployment:

### Security Measures
- **Information Disclosure Protection** - All sensitive data filtered from API response logging
- **Console Statement Removal** - Complete elimination of development logging that could expose internal structure
- **Secure Error Handling** - User-friendly error messages without technical details or stack traces
- **Debug Endpoint Removal** - No environment variable information exposed in production
- **Development File Cleanup** - All development-specific files and code paths removed
- **Password Security** - bcrypt hashing with secure salt rounds
- **Input Validation** - Comprehensive Zod schema validation on all API endpoints
- **SQL Injection Prevention** - Parameterized queries via Drizzle ORM
- **Session Security** - Secure session management with appropriate timeouts

### Production Optimizations
- **Secure Logging** - Only safe metadata logged without sensitive information
- **Error Boundaries** - Graceful error handling throughout the application
- **Environment Variable Protection** - No sensitive configuration exposed to client
- **Database Connection Security** - Encrypted connections with credential protection
- **API Rate Limiting** - Built-in spam protection for user actions

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run db:push      # Push schema changes to database
npm run db:studio    # Open database studio
```

### Code Quality
- **TypeScript strict mode** for type safety
- **ESLint configuration** for code standards
- **Consistent formatting** with Prettier
- **Component documentation** with JSDoc

## 🚀 Deployment

### Production Build
```bash
npm run build          # Creates optimized production build
npm run preview        # Preview production build locally
```

### Environment Variables
Required for production deployment:
```bash
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
RESEND_API_KEY=re_[your_resend_api_key]     # For password reset emails
NODE_ENV=production
```

### Replit Deployment
The application is production-ready for Replit deployment:
1. Push security-hardened code to repository
2. Connect to Replit with environment variables
3. Deploy with built-in Replit hosting at tailtrack.app domain
4. Automatic HTTPS and CDN optimization included

### App Store Submission
TailTrack is prepared for mobile app store submission:
- **Security hardened** - Comprehensive information disclosure protection
- **Progressive Web App** - Full offline support and native mobile experience
- **Performance optimized** - Fast loading and smooth interactions
- **Production tested** - All systems validated for deployment

### Mobile App Conversion
Ready for native mobile app development:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init TailTrack com.tailtrack.app
npx cap add ios android
npx cap run ios
npx cap run android
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Lucide React](https://lucide.dev/) for the icon library

---

Built with ❤️ for dog lovers everywhere