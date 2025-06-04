# TailTrack

A comprehensive dog care management application designed to support pet owners in tracking, monitoring, and coordinating their dogs' health and daily activities through an intuitive, collaborative platform.

**Caring for your pet, made simple.**

## ✨ Features

- **Household-based coordination** - Multiple family members can track shared pet care responsibilities
- **Multi-user authentication** - Secure registration and login system with household sharing
- **Real-time activity tracking** - Track feeding and letting out activities for multiple dogs (Natty & Murphy)
- **Smart status system** - Intelligent status messages showing exactly what care is needed
- **Activity history** - Complete log of all care activities with timestamps and user attribution
- **Responsive design** - Mobile-optimized interface with touch-friendly controls
- **Progressive Web App** - Installable on mobile devices with offline support
- **Data persistence** - Activities stored in Supabase PostgreSQL database with household sharing
- **Performance optimized** - Client-side caching and efficient state management

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
- **Express.js** - Node.js web framework
- **Supabase PostgreSQL** - Cloud database with real-time capabilities
- **Drizzle ORM** - Type-safe database queries
- **Passport.js** - Authentication middleware
- **Zod** - Schema validation

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
  createdAt: timestamp
}

// Users table
users {
  id: serial primary key
  username: varchar unique
  email: varchar unique  
  password: varchar (hashed)
  householdId: integer (foreign key)
  createdAt: timestamp
}

// Activities table
activities {
  id: serial primary key
  userId: integer (foreign key)
  householdId: integer (foreign key)
  dogs: text[] (array of dog names)
  action: varchar ('Fed' | 'Let Out')
  timestamp: timestamp
}
```

### State Management
- **TanStack Query** for server state and caching
- **React Context** for authentication state
- **Local state** for UI interactions and form handling
- **Client-side caching** with 5-second expiration for performance
- **Household-based data sharing** - Activities shared across family members in same household

### Performance Optimizations
- **Debounced API calls** to prevent rate limiting
- **Optimistic updates** for immediate UI feedback
- **Intelligent caching** with automatic invalidation
- **Lazy loading** for code splitting
- **Memoized components** to prevent unnecessary re-renders

## 🎨 Design System

### Color Palette
```css
--pup-pink: #FFD5DC to #FFC0CB     /* Primary gradient - header and action buttons */
--golden-tan: #F5E1C0 to #E6D2A0   /* Secondary gradient - user info bar */
--soft-blue: #D4EAF7 to #B3D9F2    /* Action button - "Let Out" activities */
--pup-green: #C8EBC5 to #B5E3B1    /* Success states */
--warning-gray: #e5e7eb             /* Status banner warning background */
```

### Visual Identity
- **App icon integration** - Custom TailTrack logo used throughout interface
- **Non-interactive header** - Clean, professional header with app branding
- **Status-driven UI** - Color-coded status messages with specific care instructions
- **Mobile-first design** - Touch-optimized with proper spacing and visual hierarchy

### Component Architecture
- **Atomic design principles** with reusable components
- **Compound component patterns** for complex UI elements
- **Custom hooks** for business logic separation
- **TypeScript interfaces** for prop validation

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
npm run build
```

### Replit Deployment
The application is configured for seamless Replit deployment:
1. Push code to repository
2. Connect to Replit
3. Set DATABASE_URL environment variable
4. Deploy with built-in Replit hosting

### Capacitor Integration (Future)
Ready for mobile app conversion:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios android
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