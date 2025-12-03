# 🎓 Farewell Management System

A comprehensive Next.js application for managing school farewell events with features for contributions, galleries, chat messaging, and administrative controls.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.81.1-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38bdf8)

## ✨ Features

### 🔐 Authentication & Authorization
- **Supabase Authentication** with email/password and magic links
- **Role-based Access Control** (Student, Teacher, Parallel Admin, Main Admin)
- **JWT Claims** for fast authorization checks (2-5ms)
- **Session Management** with secure cookie handling

### 💬 Real-time Chat System
- **Direct Messages (DMs)** - Global chat across all users
- **Group Chats** - Farewell-specific channels
- **Real-time Updates** via Supabase Realtime
- **Message Features**: Edit, delete, pin, typing indicators
- **Request System** for new chat connections

### 💰 Contribution Management
- Track student contributions for farewell events
- Payment status tracking and history
- Admin dashboard for managing contributions
- Automated notifications

### 📸 Gallery & Memories
- Photo album creation and management
- Image upload with optimization
- Farewell-specific galleries
- Public/private album controls

### 👥 User Management
- Multi-farewell membership support
- Role assignment and permissions
- User profiles and settings
- Approval workflows for new members

### 📊 Admin Dashboard
- Farewell creation and management
- User role administration
- Analytics and reporting
- System settings

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm**, **yarn**, **pnpm**, or **bun**
- **Supabase** account and project

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Secret (for application-level tokens)
JWT_SECRET=your_jwt_secret

# Magic Link Configuration (optional)
MAGICLINK_REDIRECT_URL=http://localhost:3000/auth/callback

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farewell-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations from `supabase/migrations/`
   - Configure RLS policies (included in migrations)

4. **Generate Supabase types** (optional)
   ```bash
   npm run types
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
farewell-system/
├── app/                          # Next.js App Router
│   ├── actions/                  # Server Actions
│   │   ├── auth-actions.ts      # Authentication operations
│   │   ├── chat-actions.ts      # Chat operations
│   │   ├── contribution-actions.ts
│   │   ├── farewell-admin-actions.ts
│   │   └── gallery-actions.ts
│   ├── api/                      # API Routes
│   │   └── auth/                 # Auth endpoints
│   ├── auth/                     # Auth pages (signin, signup, etc.)
│   ├── dashboard/                # Main app dashboard
│   │   ├── [id]/                 # Dynamic farewell routes
│   │   │   ├── contributions/
│   │   │   ├── memories/
│   │   │   ├── messages/
│   │   │   └── debug/
│   │   └── admin/                # Admin-only pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── auth/                     # Auth-related components
│   ├── chat/                     # Chat system components
│   ├── contributions/
│   ├── gallery/
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   └── auth/                     # Auth utilities
│       ├── authServices.ts       # Core auth functions
│       ├── claims.ts             # JWT claims management
│       ├── current-user.ts       # Session utilities
│       ├── roles.ts              # Role definitions
│       └── roles-db.ts           # Role database operations
├── utils/                        # Shared utilities
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── admin.ts              # Admin client
│   └── errors.ts                 # Error handling
├── types/                        # TypeScript definitions
│   └── supabase.ts               # Generated Supabase types
├── supabase/                     # Supabase configuration
│   └── migrations/               # Database migrations
└── public/                       # Static assets
```

## 🏗️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library  
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Framer Motion](https://www.framer.com/motion/)** - Animations
- **[Lucide React](https://lucide.dev/)** - Icons

### Backend
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
  - Storage for file uploads

### State & Data
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation
- **[@tanstack/react-table](https://tanstack.com/table)** - Table management

### Developer Tools
- **ESLint** - Code linting
- **PostCSS & Autoprefixer** - CSS processing

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **JWT-based authentication** with secure cookies
- **Server-side session validation**
- **Role-based permissions** with claim-based authorization
- **CSRF protection** via same-site cookies
- **SQL injection protection** through Supabase parameterized queries

## 📚 Key Concepts

### Roles & Permissions

The system uses a hierarchical role structure:

1. **Student** - Basic access (view content, make contributions, chat)
2. **Teacher** - Elevated permissions (content moderation, gallery management)
3. **Parallel Admin** - Co-administrator (most admin features)
4. **Main Admin** - Full system control (user management, farewells creation)

### Farewell-Specific Roles

Users can have different roles in different farewells. Roles are stored as **claims** in the JWT token for fast authorization:

```typescript
{
  farewells: {
    "farewell-abc-123": "student",
    "farewell-xyz-456": "main_admin"
  }
}
```

### Chat System Architecture

- **Global DMs**: `farewell_id = null` for cross-farewell messaging
- **Group Chats**: Linked to specific farewell IDs
- **Real-time**: Uses Supabase Realtime for instant updates
- **Optimistic UI**: Client-side state updates for responsive UX

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy

3. **Configure Supabase**
   - Update allowed redirect URLs in Supabase dashboard
   - Add production URL to CORS settings

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

Ensure you configure environment variables and update Supabase settings for each platform.

## 🛠️ Development

### Useful Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint

# Supabase
npm run types        # Generate TypeScript types from Supabase
```

### Database Migrations

Migrations are located in `supabase/migrations/`. To apply migrations:

```bash
supabase db push
```

To create a new migration:

```bash
supabase migration new migration_name
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database & Auth by [Supabase](https://supabase.com/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Made with ❤️ for better farewell management**