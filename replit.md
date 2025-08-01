# Overview

This is a job management application built with a modern full-stack architecture. The system allows users to create, read, update, and delete job entries with fields including job number, client name, job reference, square meter area, hours worked, and design fees. The application features a clean, responsive interface for managing job data with search functionality and real-time updates.

**Recent Migration (August 1, 2025):** Successfully migrated from Bolt environment to Replit with proper client/server separation. All job operations are now handled through REST API endpoints with persistent backend storage instead of localStorage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React 18 using TypeScript and Vite as the build tool. The application uses a component-based architecture with:

- **UI Framework**: React with TypeScript for type safety
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Styling**: Tailwind CSS with shadcn/ui components for consistent design
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Form Handling**: React Hook Form with Zod validation for type-safe forms
- **Build Tool**: Vite with hot module replacement for fast development

The frontend follows a clean separation of concerns with dedicated directories for components, hooks, types, and utilities. Path aliases are configured for clean imports.

## Backend Architecture
The server uses Express.js with TypeScript running on Node.js. The architecture emphasizes:

- **API Design**: RESTful endpoints for job CRUD operations
- **Data Layer**: Storage abstraction with an in-memory implementation (MemStorage) that can be easily swapped for database implementations
- **Type Safety**: Shared TypeScript types and Zod schemas between frontend and backend
- **Development**: Hot reloading with automatic server restart during development
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage
Currently implements an in-memory storage system with:

- **Schema Definition**: Drizzle ORM schemas for PostgreSQL with proper relationships and constraints
- **Data Validation**: Zod schemas for runtime validation of job and user data
- **Storage Interface**: Abstract storage interface allowing easy migration to PostgreSQL
- **Migration Ready**: Drizzle configuration prepared for PostgreSQL deployment

## Development Environment
The application is optimized for Replit with:

- **Hot Reloading**: Both frontend and backend support hot reloading
- **Development Tools**: Runtime error overlay and Cartographer integration for Replit
- **Build Process**: Separate build commands for client (Vite) and server (esbuild)
- **Environment Variables**: Configured for DATABASE_URL when PostgreSQL is added

# External Dependencies

## Database
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **@neondatabase/serverless**: Serverless PostgreSQL client (ready for deployment)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Frontend Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Radix UI**: Headless UI components for accessibility
- **shadcn/ui**: Pre-built component library with Tailwind CSS
- **Lucide React**: Icon library for consistent iconography
- **date-fns**: Date utility library for formatting

## Development Tools
- **Vite**: Frontend build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Static type checking
- **Zod**: Runtime type validation
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Replit integration for code mapping

## Build and Deployment
- **esbuild**: Fast JavaScript bundler for server-side code
- **tsx**: TypeScript execution for development
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer