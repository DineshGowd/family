# Family Tree Full-Stack App

A modern, interactive family tree application built with Next.js 14, TypeScript, Prisma, PostgreSQL, and Cloudinary. Features a beautiful tree visualization, image uploads, and comprehensive relationship management.

## ✨ Features

- **Interactive Tree Visualization**: Beautiful D3-powered family tree with pan/zoom support
- **Mobile Responsive**: Fallback list view for mobile devices
- **Image Upload**: Cloudinary integration for profile photos with automatic optimization
- **Relationship Management**: Add/remove parent-child and spouse relationships
- **CRUD Operations**: Full create, read, update, delete functionality for family members
- **Real-time Updates**: Optimistic UI updates with React Query
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **TypeScript**: Full type safety throughout the application

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker (for PostgreSQL)
- Cloudinary account (free tier available)

### 1. Clone and Install

```bash
git clone <repository-url>
cd family-tree-app
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://familytree:password@localhost:5432/familytree"

# Cloudinary (Required for image uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
IMAGE_STORAGE_PROVIDER="cloudinary"
```

### 3. Database Setup

Start PostgreSQL with Docker:

```bash
docker-compose up -d
```

Run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

Seed the database with sample data:

```bash
npm run db:seed
```

### 4. Cloudinary Setup

1. Create a free account at [Cloudinary](https://cloudinary.com)
2. Go to your Dashboard and copy:
   - Cloud Name
   - API Key
   - API Secret
3. Create an unsigned upload preset:
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set Mode to "Unsigned"
   - Configure folder as "family-tree"
   - Save and copy the preset name

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your family tree!

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── people/        # Person CRUD operations
│   │   ├── relationships/ # Parent-child relationships
│   │   ├── spouses/       # Spouse relationships
│   │   └── upload/        # Image upload endpoints
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── family-tree-view.tsx
│   ├── person-modal.tsx
│   ├── person-badge.tsx
│   └── ...
├── lib/                  # Utilities
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
└── types/                # TypeScript definitions
```

## 🗄️ Database Schema

The application uses a normalized PostgreSQL schema with three main entities:

- **Person**: Core family member data (name, dates, bio, image)
- **Relationship**: Parent-child relationships with support for adoption/step relationships
- **SpouseRelation**: Marriage/partnership relationships with date ranges

## 🎨 UI Components

Built with Tailwind CSS and Radix UI components:

- **PersonBadge**: Circular profile photo with name and age
- **PersonModal**: Full-featured form for creating/editing people
- **RelationshipManager**: Interface for managing family connections
- **FamilyTreeView**: D3-powered tree visualization
- **MobileTreeView**: Mobile-friendly list layout

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed with sample data
npm run db:studio       # Open Prisma Studio
npm run db:reset        # Reset database (destructive)

# Utilities
npm run lint            # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```env
DATABASE_URL="your_production_database_url"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
CLOUDINARY_UPLOAD_PRESET="your_upload_preset"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
IMAGE_STORAGE_PROVIDER="cloudinary"
```

### Database Migration in Production

After deployment, run migrations:

```bash
npx prisma migrate deploy
```

## 🔄 Alternative: AWS S3 Setup

To use S3 instead of Cloudinary:

1. Update `.env`:
```env
IMAGE_STORAGE_PROVIDER="s3"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"
```

2. Create S3 upload route (implementation not included in this version)

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL format
- Verify database exists: `docker-compose exec postgres psql -U familytree -d familytree`

### Image Upload Issues
- Verify Cloudinary credentials
- Check upload preset is "unsigned"
- Ensure file size is under 5MB

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Regenerate Prisma client: `npm run db:generate`
- Check TypeScript errors: `npm run lint`

## 📝 Commit History Suggestions

Following Conventional Commits:

```bash
git commit -m "feat(app): initial family-tree scaffold with Next.js 14"
git commit -m "feat(db): add Prisma schema with Person and Relationship models"
git commit -m "feat(api): implement CRUD endpoints for people and relationships"
git commit -m "feat(ui): add interactive D3 tree visualization"
git commit -m "feat(upload): integrate Cloudinary image upload"
git commit -m "feat(mobile): add responsive mobile tree view"
git commit -m "docs: add comprehensive README with setup instructions"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://radix-ui.com/) - Accessible components
- [React D3 Tree](https://github.com/bkrem/react-d3-tree) - Tree visualization
- [Cloudinary](https://cloudinary.com/) - Image management