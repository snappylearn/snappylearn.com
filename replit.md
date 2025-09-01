# SnappyLearn - Document Management & AI Chat Application

## Overview
SnappyLearn is a full-stack document management application with AI-powered chat capabilities. It allows users to create document collections, upload various file types (text, PDF, Markdown, CSV, Word docs), and engage in intelligent conversations with an AI assistant. The AI can reference and analyze uploaded documents for context-aware responses. The project aims to provide both independent chat conversations and collection-based conversations that leverage document context, with a vision towards becoming a community-focused social learning platform.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite
- **UI/UX Decisions**: Responsive design, mobile-first approach, dashboard for collections and conversations, drag-and-drop file upload, clean chat interface with source attribution, consistent SnappyLearn branding with purple gradient colors and custom logo. Unified `CommunityLayout` for specific pages while preserving original home page design.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon (serverless)
- **AI Integration**: OpenAI GPT-4o
- **File Handling**: Multer for in-memory file uploads, with automatic text extraction from supported file types.
- **Session Management**: PostgreSQL-based sessions.
- **System Design Choices**: Relational database schema for Users, Collections, Documents, Conversations, Messages. Supports user authentication, document collections, AI chat with source attribution, and conversation history. Artifacts (educational tools, interactive content) are integrated and persisted within chat conversations. Stateless backend design for scalability.

### Technical Implementations
- **Document Management**: Supports various file types, collection-based organization, content extraction for AI.
- **AI Chat System**: Offers independent and collection-based chat, source attribution in AI responses, persistent conversation history.
- **Authentication**: Replit OpenID Connect authentication with PostgreSQL-based session storage.
- **Artifacts**: Dedicated `artifacts` table in DB, `artifacts` page with browse and create functionality. Educational tools like Code Playground, Math Visualizer, Quiz Builder are integrated. Artifacts can be embedded and managed within chat messages.
- **Layout System**: UnifiedLayout component provides consistent header and sidebar structure across all pages. Header uses full-width container with centered content layout. Body sections use max-width centered container with auto margins for consistent alignment. Left sidebar maintains standard width across all pages.

## External Dependencies

### Core Dependencies
- **OpenAI**: Used for GPT-4o model for AI responses and conversation generation.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database operations.
- **TanStack Query**: Server state management and caching.
- **Radix UI**: Accessible component primitives.
- **PostHog**: React SDK integration for analytics and event tracking.

### Development Tools
- **Vite**: Build tool.
- **TypeScript**: For type safety.
- **Tailwind CSS**: Utility-first styling.
- **ESBuild**: Fast JavaScript bundling.