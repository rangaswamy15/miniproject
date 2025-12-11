# FitStack - AI Workout Assistant

## Overview

FitStack is a full-stack AI-powered workout assistant web application. Users can create accounts, receive personalized AI-generated workout plans, track their workouts and progress, and view fitness analytics. The platform supports multiple user roles (User, Coach, Admin) and includes features like an exercise library, progress tracking with body measurements, and workout session logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand for auth state with localStorage persistence; TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Design System**: Premium fitness-focused design inspired by Strava, Nike Training Club, and Apple Fitness+. Uses Inter font family with a blue/teal color scheme and comprehensive CSS variables for theming (light/dark mode support)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Style**: RESTful JSON API with `/api` prefix
- **Authentication**: JWT-based auth with bcrypt password hashing. Token sent via Bearer header
- **Validation**: Zod schemas shared between client and server
- **File Structure**: Routes, storage layer, and service modules separated in `/server` directory

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `/shared/schema.ts` - shared between frontend and backend
- **Key Entities**: Users, Exercises, Plans, WorkoutSessions, Progress, Uploads, AiJobs
- **Migrations**: Managed via drizzle-kit with output to `/migrations`

### AI Integration
- **Service**: OpenAI API for generating personalized workout plans
- **Implementation**: Abstracted in `/server/openai.ts` with fallback plan generation when API unavailable
- **Plan Structure**: Multi-week plans with daily workouts containing exercises, sets, reps, and rest periods

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`; esbuild bundles server to `dist/index.cjs`
- **Scripts**: `npm run dev` for development, `npm run build` for production build

## External Dependencies

### Third-Party Services
- **OpenAI API**: Powers AI workout plan generation (requires `OPENAI_API_KEY` environment variable)
- **PostgreSQL Database**: Primary data store (requires `DATABASE_URL` environment variable)

### Key NPM Packages
- **UI Components**: Full shadcn/ui component suite with Radix UI primitives
- **Charts**: Recharts for progress visualization
- **Forms**: React Hook Form with Zod resolver
- **Date Handling**: date-fns
- **Database**: Drizzle ORM with pg driver

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: JWT signing secret (optional, has default)
- `OPENAI_API_KEY`: OpenAI API key for AI plan generation (optional, falls back to mock plans)