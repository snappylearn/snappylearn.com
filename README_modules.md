# SnappyLearn - Module Documentation

## Overview
SnappyLearn is a full-stack document management application with AI-powered chat capabilities and social community features. This document provides comprehensive documentation for all modules in the platform.

## Project Structure

```
snappylearn/
├── client/                    # Frontend React application
├── server/                    # Backend Express.js API
├── shared/                    # Shared TypeScript schemas
└── attached_assets/           # Static assets and uploads
```

---

## Frontend Modules (`client/`)

### Core Application
- **`main.tsx`** - Application entry point with React 18 and providers
- **`App.tsx`** - Main app component with routing and authentication
- **`index.css`** - Global styles and Tailwind CSS configuration

### Authentication (`client/src/contexts/`, `client/src/hooks/`)

#### AuthContext (`contexts/AuthContext.tsx`)
- Manages global authentication state
- Handles Google OAuth and JWT authentication
- Provides user session management

#### Authentication Hooks
- **`useAuth.ts`** - Authentication state and actions
- **`hooks/useAuth.ts`** - Alternative auth hook implementation

#### Authentication Components (`components/auth/`)
- **`AuthPage.tsx`** - Main authentication page wrapper
- **`GoogleSignInButton.tsx`** - Google OAuth signin button
- **`LoginForm.tsx`** - Email/password login form
- **`SignUpForm.tsx`** - User registration form

### Layout System (`components/layout/`)

#### Core Layouts
- **`UnifiedLayout.tsx`** - Main layout with consistent header/sidebar
- **`MainLayout.tsx`** - Primary application layout
- **`TwitterStyleLayout.tsx`** - Social media style layout
- **`CommunityLayout.tsx`** - Community-specific layout

### UI Components (`components/ui/`)
Comprehensive UI component library built on Radix UI primitives:

#### Form Components
- **`button.tsx`** - Button component with variants
- **`input.tsx`** - Text input fields
- **`form.tsx`** - Form wrapper with validation
- **`checkbox.tsx`** - Checkbox input
- **`radio-group.tsx`** - Radio button groups
- **`select.tsx`** - Dropdown selection
- **`input-otp.tsx`** - OTP input fields

#### Layout Components
- **`card.tsx`** - Card container component
- **`dialog.tsx`** - Modal dialogs
- **`sheet.tsx`** - Slide-out panels
- **`popover.tsx`** - Floating popover content
- **`accordion.tsx`** - Collapsible content sections
- **`tabs.tsx`** - Tab navigation

#### Navigation Components
- **`navigation-menu.tsx`** - Main navigation menus
- **`menubar.tsx`** - Menu bar component
- **`breadcrumb.tsx`** - Breadcrumb navigation
- **`pagination.tsx`** - Page navigation

#### Display Components
- **`avatar.tsx`** - User avatar display
- **`badge.tsx`** - Status and category badges
- **`alert.tsx`** - Alert messages
- **`progress.tsx`** - Progress indicators
- **`calendar.tsx`** - Date picker calendar
- **`chart.tsx`** - Data visualization charts

#### Utility Components
- **`scroll-area.tsx`** - Custom scrollable areas
- **`separator.tsx`** - Visual separators
- **`resizable.tsx`** - Resizable panels
- **`carousel.tsx`** - Image/content carousels
- **`hover-card.tsx`** - Hover tooltips
- **`context-menu.tsx`** - Right-click menus
- **`command.tsx`** - Command palette
- **`drawer.tsx`** - Mobile-friendly drawers

### Social Platform (`components/posts/`)

#### Post Management
- **`PostCard.tsx`** - Individual post display with interactions
- **`CreatePostForm.tsx`** - Form for creating new posts

#### Social Features
- **`BookmarkPopover.tsx`** - Pinterest-style bookmark interface with multi-notebook selection
- **`FloatingChatWidget.tsx`** - Floating chat interface

### Document Management

#### Notebook System
- **`collection-card.tsx`** - Notebook display cards
- **`create-collection-modal.tsx`** - Create new notebook modal
- **`add-document-dropdown.tsx`** - Document upload interface
- **`file-upload.tsx`** - File upload component

### AI Chat System

#### Chat Components
- **`chat-input.tsx`** - Message input with file attachments
- **`chat-loading.tsx`** - Loading states for AI responses
- **`message.tsx`** - Chat message display
- **`conversation-card.tsx`** - Conversation preview cards

#### AI Artifacts
- **`artifact-manager.tsx`** - Manage educational artifacts
- **`artifact-viewer.tsx`** - Display and interact with artifacts

### Admin Interface (`components/admin/`)

#### Administrative Tools
- **`AdminTestButton.tsx`** - Admin testing utilities
- **`AuditLogsTable.tsx`** - System audit logs display
- **`DataTable.tsx`** - Generic data table component
- **`TenantDialog.tsx`** - Multi-tenant management
- **`UserManagementTable.tsx`** - User administration interface

### Hooks (`hooks/`)

#### Data Management Hooks
- **`use-collections.ts`** - Notebook CRUD operations
- **`use-conversations.ts`** - Chat conversation management
- **`use-messages.ts`** - Message handling
- **`use-artifacts.ts`** - Educational artifact management

#### Utility Hooks
- **`use-toast.ts`** - Toast notification system
- **`use-mobile.tsx`** - Mobile device detection
- **`usePostHog.ts`** - Analytics integration

### API & Utilities (`lib/`)

#### API Layer
- **`api.ts`** - REST API client with type safety
- **`queryClient.ts`** - TanStack Query configuration
- **`supabase.ts`** - Supabase client setup

#### Utilities
- **`utils.ts`** - Common utility functions
- **`authUtils.ts`** - Authentication helpers
- **`analytics.ts`** - PostHog analytics integration

### Pages (`pages/`)

#### Core Pages
- **`landing.tsx`** - Public landing page
- **`home.tsx`** - Authenticated user dashboard
- **`dashboard.tsx`** - User activity dashboard

#### Notebook Management
- **`my-collections.tsx`** - User's notebook overview
- **`collections.tsx`** - Create new notebook page
- **`collection-detail.tsx`** - Individual notebook view

#### Social Features
- **`communities.tsx`** - Community discovery
- **`community.tsx`** - Community creation
- **`community-detail.tsx`** - Individual community view
- **`discover.tsx`** - Content discovery feed

#### Chat & AI
- **`chat.tsx`** - Standalone chat interface
- **`conversations.tsx`** - Chat history overview
- **`conversation.tsx`** - Individual conversation view
- **`artifacts.tsx`** - Educational artifacts gallery

#### User Management
- **`profile.tsx`** - User profile management
- **`settings.tsx`** - User preferences
- **`AdminDashboard.tsx`** - Administrative interface
- **`tasks.tsx`** - Scheduled AI tasks management

#### Utility Pages
- **`not-found.tsx`** - 404 error page

### Providers (`providers/`)
- **`GoogleOAuthProvider.tsx`** - Google OAuth configuration

---

## Backend Modules (`server/`)

### Core Server
- **`index.ts`** - Express.js server entry point
- **`routes.ts`** - Main API route configuration
- **`vite.ts`** - Vite development server integration

### Database Layer
- **`db.ts`** - Database connection and Drizzle ORM setup
- **`storage.ts`** - Data access layer with repository pattern
- **`seed.ts`** - Database seeding for development

### Authentication (`routes/auth.ts`, auth modules)

#### Authentication Routes
- **`routes/auth.ts`** - JWT authentication endpoints
- **`routes/googleAuth.ts`** - Google OAuth integration
- **`supabaseAuth.ts`** - Supabase authentication (legacy)
- **`replitAuth.ts`** - Replit OpenID Connect (legacy)

#### Auth Configuration
- **`auth-config.ts`** - Authentication middleware configuration
- **`auth.ts`** - Core authentication logic

### API Routes (`routes/`)

#### Social Platform
- **`posts.ts`** - Post CRUD, likes, comments, bookmarks
- **`topics.ts`** - Topic and category management
- **`follows.ts`** - User following system

#### Administration
- **`admin.ts`** - Administrative endpoints and user management

### Services (`services/`)
- **`openai.ts`** - OpenAI GPT-4 integration for AI chat and content generation

### External Integrations (`lib/`)
- **`supabase.ts`** - Supabase client configuration

---

## Shared Modules (`shared/`)

### Database Schema (`schema.ts`)
Comprehensive database schema using Drizzle ORM:

#### Core Tables
- **`users`** - User accounts and profiles
- **`sessions`** - Authentication session storage

#### Social Platform
- **`posts`** - User-generated content
- **`topics`** - Content categorization
- **`likes`** - Post engagement
- **`comments`** - Post discussions
- **`reposts`** - Content sharing
- **`follows`** - User relationships

#### Document Management
- **`collections`** - Document notebooks (renamed from collections)
- **`documents`** - File uploads and content
- **`collectionDocuments`** - Many-to-many relationship for multi-notebook organization

#### AI System
- **`conversations`** - Chat sessions
- **`messages`** - Individual chat messages
- **`artifacts`** - Educational tools and interactive content

#### Community Features
- **`communities`** - Learning communities
- **`communityMembers`** - Community membership

#### Automation
- **`tasks`** - Scheduled AI tasks with email notifications

#### Legacy Tables
- **`bookmarks`** - Simple bookmarking (replaced by collection-based system)

---

## Key Features

### Pinterest-Style Bookmarking
- Multi-notebook selection for posts
- Inline notebook creation
- Automatic "Personal Notebook" for all users
- Document-based bookmark storage

### AI Integration
- OpenAI GPT-4 powered chat
- Source attribution from documents
- Educational artifact generation
- Scheduled AI tasks with email notifications

### Social Platform
- Twitter-style post interactions
- Community-based learning
- User following system
- Content discovery feed

### Document Management
- Multi-format file support (PDF, Word, Markdown, CSV)
- Notebook-based organization
- AI-powered document analysis
- Upload and sharing capabilities

### Authentication
- JWT-based session management
- Google OAuth integration
- Role-based access control
- Automatic user onboarding

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for server state
- **Wouter** for routing
- **Radix UI** + **shadcn/ui** for components
- **Tailwind CSS** for styling
- **PostHog** for analytics

### Backend
- **Node.js** with **Express.js**
- **TypeScript** with ES modules
- **Drizzle ORM** with PostgreSQL
- **Neon** for serverless database hosting
- **OpenAI API** for AI capabilities
- **SendGrid** for email notifications

### Database
- **PostgreSQL** with relational schema
- **Drizzle ORM** for type-safe queries
- **Junction tables** for many-to-many relationships
- **Automatic migrations** via drizzle-kit

---

## Development Guidelines

### Module Organization
- Components organized by feature domain
- Shared utilities in dedicated directories
- Type-safe API layer with shared schemas
- Consistent naming conventions

### State Management
- TanStack Query for server state
- React Context for global client state
- Local state for component-specific data

### Authentication Flow
- JWT tokens with 7-day expiration
- Automatic token refresh
- Role-based route protection
- Session persistence

### Database Patterns
- Repository pattern for data access
- Shared schema types between frontend/backend
- Automatic timestamp management
- Soft deletes where appropriate

---

This documentation provides a comprehensive overview of all modules in the SnappyLearn platform. Each module is designed to be modular, reusable, and maintainable while following modern React and Node.js best practices.