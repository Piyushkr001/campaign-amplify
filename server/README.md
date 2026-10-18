# Campaign Amplify API Server

A high-performance Node.js backend built with Express, TypeScript, Drizzle ORM, and Neon PostgreSQL for the **Campaign Amplify** mobile application.

---

## 🛠️ Technology Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Framework**: Express.js
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL
- **ORM & Migrations**: Drizzle ORM & Drizzle Kit
- **Validation**: Zod
- **Security**: Helmet, CORS

---

## 📋 Requirements

- Bun 1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- Neon PostgreSQL database instance (or any standard PostgreSQL 15+ database)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd server
bun install
```

### 2. Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:8081
DATABASE_URL=postgresql://<user>:<password>@<ep-pooler-xyz>.neon.tech/campaign_amplify?sslmode=require
```

> **Security Note:** Never commit `.env` or expose `DATABASE_URL` inside client-facing Expo bundles.

---

## 🗄️ Database Migrations & Seeds

### Generate Migrations (Drizzle Kit)

```bash
bun run db:generate
```

### Apply Migrations to Neon Database

```bash
bun run db:migrate
```

Or push the schema directly in rapid prototyping:

```bash
bun run db:push
```

### Seed Demo Campaigns

Populate 3–5 realistic public demo campaigns with mixed lifecycle states (`FUNDING`, `PROMOTING`, `COMPLETED`):

```bash
bun run db:seed
```

---

## 💻 Running the Server

### Development Mode (with hot-reload)

```bash
bun run dev
```

### Type Checking

```bash
bun run typecheck
```

### Production Build & Run

```bash
bun run build
bun run start
```

---

## 🌐 API Base URL & Endpoints

Default Base URL: `http://localhost:5001/api/v1`

### 1. Health Check
- **Endpoint**: `GET /api/v1/health`
- **Auth**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "service": "campaign-amplify-api",
      "environment": "development",
      "timestamp": "2026-10-18T07:44:02.575Z"
    }
  }
  ```

### 2. List Public Campaigns
- **Endpoint**: `GET /api/v1/campaigns`
- **Auth**: None
- **Query Parameters**:
  - `category` (optional, string)
  - `status` (optional, public status enum)
  - `search` (optional, string: searches title, creator, summary, category)
  - `sort` (optional: `featured` | `newest` | `most_funded` | `ending_soon`)
  - `limit` (optional, integer: 1–50, default: 20)
  - `offset` (optional, integer: default 0)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "camp-1",
        "title": "Clean Water for Every Village",
        "category": "Environment",
        "creator": "WaterFirst Foundation",
        "status": "FUNDING",
        "raised": 18450,
        "goal": 25000,
        ...
      }
    ]
  }
  ```

### 3. Public Campaign Detail
- **Endpoint**: `GET /api/v1/campaigns/:id`
- **Auth**: None
- **Security Guarantee**: Only returns public campaigns (`FUNDING`, `FUNDING_GOAL_REACHED`, `FUNDING_ENDED`, `DISTRIBUTION_PREPARATION`, `PROMOTING`, `COMPLETED`). Private drafts or review states return `404 Not Found`.

---

## 📱 Mobile Client Integration

In the root React Native / Expo application:
1. Set `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5001/api/v1` (or `10.0.2.2:5001/api/v1` for Android emulator).
2. Set `EXPO_PUBLIC_USE_API=true` to route queries through the backend API.
3. If the server is unreachable, `CampaignService` automatically falls back to local prototype state without interrupting the mobile experience.
