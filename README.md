# TIMS - Tennessine Information Management System

A modern CRM and database management system built with React, TypeScript, and Supabase.

## Features

- **Database Module**: Manage Contacts, Companies, Products, and Manufacturers
- **CRM Module**: Kanban-style pipeline with drag-and-drop opportunities
- **Document Management**: Upload and manage files for any entity
- **Global Search**: Search across all entities from the header
- **Nested Forms**: Create related entities inline without leaving the current form
- **Internationalization**: English and Portuguese (Brazil) support
- **Dark/Light Theme**: Toggle between themes in Settings

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: @dnd-kit
- **i18n**: react-i18next

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase account with project configured

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/fwlemos/TIMS.git
cd TIMS
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

The application requires the following Supabase setup:
- Authentication enabled (Email + Google OAuth)
- Database tables: contacts, companies, products, opportunities, pipeline_stages, documents, etc.
- Row Level Security (RLS) policies for authenticated users
- Storage bucket named "documents" for file uploads

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin permission management
│   ├── crm/            # CRM module components
│   ├── database/       # Database module components
│   ├── documents/      # Document upload/list
│   ├── layout/         # App shell, sidebar, header
│   └── shared/         # Reusable components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom hooks for data fetching
├── i18n/               # Internationalization
│   └── locales/        # en.json, pt-BR.json
├── lib/                # Utilities and Supabase client
├── pages/              # Page components
└── types/              # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

Proprietary - Tennessine
