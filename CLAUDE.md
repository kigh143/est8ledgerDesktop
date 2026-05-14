# est8Ledger Desktop - Development Guide

## 📋 Project Overview

est8Ledger is a modern property management web application built with React, TypeScript, and Tailwind CSS. It enables landlords and property managers to digitally manage agreements, track maintenance requests, manage repairs, and maintain comprehensive property documentation.

**Live URL**: http://localhost:5173 (development)

## 🏗️ Project Structure

```
est8ledgerDesktop/
├── src/
│   ├── routes/              # TanStack Router pages
│   │   ├── (auth)/          # Authentication routes (login, register, verify, pin)
│   │   ├── properties/      # Properties management routes
│   │   ├── dashboard/       # Dashboard routes (per-property views)
│   │   └── __root.tsx       # Root layout
│   ├── componennts/         # Reusable React components
│   │   ├── forms/           # Form components (Input, Select)
│   │   ├── AuthLayout.tsx   # Auth screens layout
│   │   ├── PropertiesLayout.tsx  # Properties page layout
│   │   └── DashboardLayout.tsx   # Dashboard layout
│   ├── services/            # API service clients
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── propertyApi.ts   # Property endpoints
│   │   ├── agreementService.ts
│   │   ├── tenancyService.ts
│   │   └── config.ts
│   ├── store/               # Zustand state management
│   │   └── index.ts         # Global app store
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── assets/              # Static assets (images, etc.)
│   └── App.tsx              # Main app component
├── public/                  # Static files
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.ts           # Vite configuration
└── CLAUDE.md               # This file
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19.2.6 | UI framework |
| **Language** | TypeScript 6.0.2 | Type safety |
| **Routing** | TanStack Router 1.169.2 | Client-side routing with loaders |
| **Styling** | Tailwind CSS 4.3.0 | Utility-first CSS |
| **State** | Zustand 5.0.13 | Global state management |
| **Icons** | Lucide React 1.3.0 | Icon library |
| **HTTP** | Axios 1.16.0 | API requests |
| **Notifications** | React Toastify 11.1.0 | Toast notifications |
| **Build Tool** | Vite 8.0.12 | Development server & bundler |

## 🎨 Design System

### Brand Colors
- **Primary**: `#3f0ee3` (Purple/Violet)
- **Accent**: `#7fe502` (Lime Green)
- **Neutral**: Slate color palette

### Color Usage
- Primary purple for main CTAs, focus states, and active navigation
- Accent lime for secondary actions and highlights
- Dark sidebar: gradient from slate-900 to slate-800
- Light backgrounds: slate-50 with subtle purple tint

### Components
All components use consistent styling with:
- Rounded corners: `rounded-lg` (small) → `rounded-xl` (large)
- Shadows: `shadow-sm` (subtle) → `shadow-lg` with color glow
- Hover effects: smooth transitions and opacity changes
- Responsive design: mobile-first with `sm:`, `md:`, `lg:` breakpoints

## 🔐 Authentication Flow

1. **Login** (`/login`) - Email or phone number entry
2. **Verify** (`/verify`) - 6-digit OTP verification
3. **PIN** (`/pin`) - 4-digit security PIN
4. **Properties** (`/properties`) - Main dashboard after authentication

### Auth State (Zustand Store)
```typescript
{
  token: string;           // JWT token
  user: User;             // User object
  authData: AuthData;     // Login/register form data
  login(user);            // Set user & token
  logout();               // Clear auth state
  setAuthData(data);      // Update form data
  setToken(token);        // Set JWT token
}
```

## 🎯 Key Features

### Properties Management
- View all properties with details (tenants, units, occupancy, revenue)
- Property cards show:
  - Property image, name, address
  - Number of tenants, clauses, units
  - Occupancy percentage
  - Monthly revenue

### Dashboard (Per-Property)
- Overview of selected property
- Tenants management
- Repair reports
- Expenses tracking
- Inspections
- Security deposits
- Rent tracking
- Tenancy agreements
- Tenant advertising

### Settings & Account
- User settings
- Subscription management
- Help & support

## 🚀 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Type check
tsc -b

# Lint code
npm run lint

# Preview production build
npm run preview
```

## 📁 File Naming Conventions

- **Routes**: kebab-case (e.g., `login.tsx`, `verify.tsx`)
- **Components**: PascalCase (e.g., `DashboardLayout.tsx`)
- **Services**: camelCase (e.g., `propertyApi.ts`)
- **Types**: PascalCase interfaces (e.g., `User`, `PropertyAgreement`)

## 🔄 State Management

### Global Store (Zustand)
Located at `src/store/index.ts`:
- `user`: Current user data
- `token`: JWT authentication token
- `authData`: Authentication form state
- `activeProperty`: Selected property for dashboard
- Action methods for state updates

**Usage**:
```typescript
import { useAppStore } from '../store';

function MyComponent() {
  const { user, logout } = useAppStore();
  return <div>{user?.firstName}</div>;
}
```

## 🛣️ Routing with TanStack Router

### Route Loaders
Routes use `loader` functions to fetch data before rendering:

```typescript
export const Route = createFileRoute('/properties/')({
  component: RouteComponent,
  loader: async () => {
    const response = await agreementService.getPropertyAgreements();
    return { properties: response.data }
  }
})
```

### Protected Routes
Use `beforeLoad` to check authentication:

```typescript
beforeLoad: () => {
  const { token } = useAppStore.getState();
  if (!token) {
    throw redirect({ to: '/login' });
  }
}
```

## 🎨 Layout Components

### AuthLayout
Used by: login, register, verify, pin screens
- Two-column design (hero image + form)
- Dark gradient sidebar with property management tagline
- Responsive mobile view

### PropertiesLayout
Used by: properties listing and management pages
- Dark sidebar with navigation menu
- Header with page title and logout button
- Gradient background content area

### DashboardLayout
Used by: property-specific management pages
- Dark sidebar with context-aware menu
- Header with property name and notification button
- Gradient background with responsive padding

## 📝 Form Components

### Input Component
```typescript
<Input
  label="Email"
  type="text"  // or "password", "pin"
  placeholder="Enter email"
  value={email}
  onChange={(value) => setEmail(value)}
  countryCode="+256"  // Optional for phone numbers
/>
```

### Select Component
```typescript
<Select
  label="Country"
  options={[{ value: 1, label: "Uganda" }]}
  value={selectedCountry}
  onChange={(value) => setSelected(value)}
  placeholder="Select country"
/>
```

## 🔗 API Integration

All API calls go through service files in `src/services/`:

- `auth.ts` - Login, verify OTP, PIN validation
- `propertyApi.ts` - Property CRUD operations
- `agreementService.ts` - Agreement management
- `tenancyService.ts` - Tenant management
- `config.ts` - Configuration (countries, etc.)

**Error Handling**:
```typescript
try {
  const response = await someService.getData();
} catch (error) {
  const message = getNetworkError(error);
  toast.error(message);
}
```

## 🎯 Coding Standards

### TypeScript
- Always use explicit type annotations
- Import types with `import type`
- Use interfaces for object shapes

### Components
- Functional components only
- Props should be typed
- Comments only for non-obvious logic
- Keep components focused (single responsibility)

### Styling
- Use Tailwind classes (avoid inline styles)
- Follow mobile-first approach
- Use design system colors consistently
- Apply consistent spacing and sizing

### File Organization
- One component per file
- Group related utilities together
- Keep imports organized (react → packages → local)

## 🌐 Environment Variables

Create `.env` or `.env.local` in root directory:
```
VITE_API_BASE_URL=https://your-api-url.com
```

## 🚨 Known Issues & Workarounds

None currently documented. Add issues as they're discovered.

## 📚 Resources & References

- [TanStack Router Docs](https://tanstack.com/router/latest)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org)

## 💡 Tips for Contributors

1. **Before Starting Work**: Create a task with `TaskCreate` and mark it `in_progress`
2. **Mobile First**: Always design for mobile, then enhance for desktop
3. **Colors**: Use CSS custom properties or design system constants for brand colors
4. **Testing**: Use the dev server at localhost:5173 to test all features
5. **Type Safety**: Let TypeScript catch errors early - don't use `any`
6. **Git Commits**: Use clear, descriptive commit messages
7. **Code Review**: Run `npm run lint` before committing

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Type check | `tsc -b` |
| Lint files | `npm run lint` |
| View types | `Find usage of type in src/types/` |
| Add a feature | Create task → branch → PR |

## 🎯 Current Branch Guidelines

- **Main**: Production-ready code
- **Develop**: Integration branch (if used)
- **Feature branches**: `feature/feature-name`

Always work on feature branches and create PRs for review.

---

**Last Updated**: May 14, 2026  
**Project Status**: Active Development
