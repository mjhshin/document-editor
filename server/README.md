# Sandstone Server

Express.js backend with TypeScript, Prisma, and SQLite.

## Setup

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Initialize database:
```bash
npm run db:push
```

## Development

```bash
npm run dev
```

## Database

```bash
# Push schema changes without migrations (development)
npm run db:push

# Create and run migrations (production-ready)
npm run db:migrate

# Open Prisma Studio to view/edit data
npm run db:studio

# Regenerate Prisma client after schema changes
npm run db:generate
```

## Build

```bash
npm run build
```

## Production

```bash
npm run start
```

## API Endpoints

### Documents
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get a specific document
- `POST /api/documents` - Create a new document
- `PUT /api/documents/:id` - Update a document
- `DELETE /api/documents/:id` - Delete a document

### Changes
- `POST /api/documents/:id/changes` - Record a change to a document

## Database Schema

### Document
- `id`: UUID
- `title`: String
- `content`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `changes`: Change[] (one-to-many relationship)

### Change
- `id`: UUID
- `documentId`: String (foreign key)
- `content`: String (the change content)
- `operation`: String (e.g., "insert", "delete", "update")
- `position`: Int (optional, position in document)
- `createdAt`: DateTime
- `document`: Document (many-to-one relationship)

