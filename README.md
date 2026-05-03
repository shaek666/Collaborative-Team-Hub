# TeamHub

A real-time team collaboration platform where teams can manage shared goals, post announcements, track action items, and stay in sync — all in one place.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Tech Stack](https://img.shields.io/badge/Express-4.19-green?logo=express)
![Tech Stack](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Tech Stack](https://img.shields.io/badge/Socket.io-4.7-red?logo=socket.io)
![Tech Stack](https://img.shields.io/badge/Prisma-5.14-purple?logo=prisma)
![Tech Stack](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Deployment](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?logo=railway)

## 🚀 Live Demo

- **Frontend**: https://web-production-bbe80.up.railway.app
- **API**: https://api-production-bbe80.up.railway.app
- **Demo Login**: `demo@teamhub.dev` / `Demo1234!`

## ✨ Features

### 🔐 Authentication
- Email/password registration and login
- JWT access + refresh token rotation in httpOnly cookies
- Protected routes — dashboard accessible only after login
- User profile with avatar upload via Cloudinary
- Secure logout with token revocation

### 🏢 Workspaces
- Create and switch between multiple workspaces
- Invite members by email with email notifications (via Nodemailer)
- Role-based access: Admin, Manager, Member
- Each workspace has a name, description, and accent colour
- Real-time member presence (online/offline indicators)

### 🎯 Goals & Milestones
- Create goals with title, owner, due date, and status
- Nest milestones under goals with progress percentage
- Post progress updates on a goal's activity feed (real-time)
- Expandable goal cards with milestone tracking

### 📢 Announcements
- Rich-text announcements (bold, italic, underline, lists)
- File attachments (images, PDFs, text) via Cloudinary
- Emoji reactions with optimistic UI updates
- Comment threads on announcements
- Pin important announcements to the top
- **@Mention teammates** in comments — triggers in-app + email notifications

### ✅ Action Items
- Create tasks with assignee, priority, due date, and status
- Link action items to parent goals
- **Kanban board** (drag-and-drop) and **list view** toggle
- Real-time status updates via Socket.io

### 📊 Analytics
- Dashboard stats: total goals, items completed this week, overdue count
- Goal completion chart (Recharts AreaChart)
- Goal distribution by status (Recharts BarChart)
- Export workspace data as CSV

### 🔔 Real-time & Notifications
- Socket.io pushes new posts, reactions, and status changes live
- Online member presence per workspace
- In-app notifications for invites, comments, and @mentions
- Email notifications for workspace invites and @mentions

### 🎨 UI/UX
- Dark/light theme toggle with system preference detection
- Framer Motion animations throughout
- Responsive design (mobile sidebar, adaptive layouts)
- Keyboard-accessible components with focus-visible rings
- Loading states, empty states, and error toasts

---

## 🚀 Advanced Features Implemented

### 1. Advanced RBAC (Role-Based Access Control)
A full permission matrix controls granular access across workspaces:

| Permission | Admin | Manager | Member |
|-----------|-------|---------|--------|
| `workspace:view` | ✅ | ✅ | ✅ |
| `goals:create` | ✅ | ✅ | ✅ |
| `goals:delete` | ✅ | ✅ | ❌ |
| `announcements:create` | ✅ | ✅ | ❌ |
| `announcements:pin` | ✅ | ✅ | ❌ |
| `members:invite` | ✅ | ✅ | ❌ |
| `members:manageRoles` | ✅ | ❌ | ❌ |
| `reactions:create` | ✅ | ✅ | ✅ |
| `comments:create` | ✅ | ✅ | ✅ |
| `analytics:view` | ✅ | ✅ | ✅ |
| `actionItems:create` | ✅ | ✅ | ✅ |
| `actionItems:delete` | ✅ | ✅ | ❌ |

Defined in `packages/shared/src/index.js`, enforced via `rbac()` middleware on every protected route.

### 2. Optimistic UI
Actions reflect instantly before server confirmation with graceful rollback on error:

- **Emoji reactions**: Instant toggle, rolls back on failure
- **Comment posting**: Temporary comment appears immediately, replaced with server response
- **Goal creation**: Optimistic placeholder with loading state
- **Action item status changes**: Kanban drag-and-drop updates instantly
- **Goal status updates**: Immediate visual feedback

Implemented via `stores/optimistic.js` helper and Zustand store patterns (`addPendingId`/`removePendingId`).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Railway Cloud                     │
├──────────────────────────┬──────────────────────────┤
│     Next.js 14 (Web)     │    Express.js (API)      │
│     Port 3000            │    Port 4000             │
│                          │                          │
│  ┌────────────────────┐  │  ┌────────────────────┐  │
│  │  App Router        │  │  │  REST Routes       │  │
│  │  Client Components │  │  │  Socket.io Server  │  │
│  │  Zustand Store     │  │  │  Prisma ORM        │  │
│  │  Framer Motion     │  │  │  JWT Auth          │  │
│  │  Recharts          │  │  │  Nodemailer        │  │
│  └────────────────────┘  │  └────────────────────┘  │
│                          │                          │
└──────────┬───────────────┴────────────┬─────────────┘
           │                            │
           └────────────┬───────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL   │
                │   (Railway)    │
                └────────────────┘
```

### Monorepo Structure

```
Collaborative-Team-Hub/
├── apps/
│   ├── api/                 # Express.js + Socket.io backend (ESM)
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── middleware/  # Auth, RBAC, error handling
│   │   │   ├── routes/      # API route definitions + OpenAPI docs
│   │   │   ├── socket/      # Real-time event handling
│   │   │   ├── lib/         # Prisma client, Cloudinary, email
│   │   │   └── utils/       # Helpers
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/                 # Next.js 14 frontend (JavaScript)
│       ├── app/             # App Router pages & layouts
│       ├── components/      # UI components (Card, Button, Modal, etc.)
│       ├── stores/          # Zustand state management
│       └── lib/             # API client, socket helpers
├── packages/
│   └── shared/              # Shared constants, RBAC permissions
├── e2e/                     # Playwright end-to-end tests
├── turbo.json               # Turborepo pipeline config
└── package.json             # Root workspace config
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, JavaScript, Tailwind CSS, Framer Motion, Zustand, Recharts, Lucide Icons, @hello-pangea/dnd |
| **Backend** | Express.js 4, Socket.io 4, JWT (httpOnly cookies + refresh rotation), Helmet, Cloudinary, Nodemailer, Multer |
| **Database** | PostgreSQL 15, Prisma ORM |
| **Testing** | Jest + Supertest (API), Jest + Testing Library (Web), Playwright (E2E) |
| **Tooling** | Turborepo, ESLint, Prettier |
| **Deployment** | Railway (Docker multi-stage builds) |

## 📦 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 10
- PostgreSQL database

### Local Development

1. **Clone and install**

```bash
git clone <repo-url>
cd Collaborative-Team-Hub
npm install
```

2. **Set up environment variables**

**API** (`apps/api/.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/team_hub"
JWT_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Email (optional — enables invite and @mention emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Web** (`apps/web/.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

3. **Initialize the database**

```bash
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
npx prisma generate --schema=apps/api/prisma/schema.prisma
node apps/api/prisma/seed.js
```

4. **Start both apps**

```bash
npm run dev
```

- Web app: http://localhost:3000
- API server: http://localhost:4000
- Swagger docs: http://localhost:4000/api/docs

## 🧪 Testing

```bash
# Run all tests (API + Web)
npm run test

# Run API tests only
npm --workspace=api test

# Run Web tests only
npm --workspace=web test

# Run E2E tests
npx playwright test

# Run E2E with UI
npx playwright test --ui
```

## 🐳 Docker Deployment

Both apps use multi-stage Docker builds optimized for production:

```bash
# Build API image
docker build -f apps/api/Dockerfile -t teamhub-api .

# Build Web image
docker build -f apps/web/Dockerfile -t teamhub-web .
```

## 📡 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and set session cookies |
| `POST` | `/api/auth/refresh` | Rotate refresh token, get new access token |
| `POST` | `/api/auth/logout` | Revoke all tokens, clear cookies |
| `GET`  | `/api/auth/me` | Get current user profile |
| `GET`  | `/api/workspaces` | List user's workspaces |
| `POST` | `/api/workspaces` | Create a new workspace |
| `GET`  | `/api/workspaces/:id` | Get workspace details + members |
| `POST` | `/api/workspaces/:id/invite` | Invite a user by email |
| `PATCH`| `/api/workspaces/:id/members/:userId/role` | Change member role |
| `GET`  | `/api/workspaces/:id/announcements` | Get workspace announcements |
| `POST` | `/api/workspaces/:id/announcements` | Create an announcement |
| `POST` | `/api/workspaces/:id/attachments` | Upload file attachment |
| `PATCH`| `/api/workspaces/:id/announcements/:id/pin` | Pin/unpin announcement |
| `POST` | `/api/workspaces/:id/announcements/:id/reactions` | Add emoji reaction |
| `POST` | `/api/workspaces/:id/announcements/:id/comments` | Add a comment |
| `GET`  | `/api/workspaces/:id/goals` | List workspace goals |
| `POST` | `/api/workspaces/:id/goals` | Create a new goal |
| `PATCH`| `/api/workspaces/:id/goals/:id` | Update goal status/details |
| `GET`  | `/api/workspaces/:id/goals/:id/updates` | Get goal activity feed |
| `POST` | `/api/workspaces/:id/goals/:id/updates` | Post a progress update |
| `POST` | `/api/workspaces/:id/goals/:id/milestones` | Add milestone |
| `PATCH`| `/api/workspaces/:id/goals/:id/milestones/:id` | Update milestone |
| `GET`  | `/api/workspaces/:id/action-items` | List workspace action items |
| `POST` | `/api/workspaces/:id/action-items` | Create an action item |
| `PATCH`| `/api/workspaces/:id/action-items/:id` | Update status/assignee |
| `GET`  | `/api/workspaces/:id/analytics` | Get workspace analytics |
| `GET`  | `/api/workspaces/:id/export` | Export workspace data as CSV |
| `GET`  | `/api/notifications` | Get user notifications |
| `POST` | `/api/notifications` | Create notification (for @mentions) |
| `PATCH`| `/api/notifications/:id/read` | Mark notification as read |
| `PATCH`| `/api/notifications/read-all` | Mark all as read |

### Socket.io Events

**Client → Server**:
- `workspace:join` — Join a workspace room
- `workspace:leave` — Leave a workspace room
- `typing:start` — Start typing on an announcement
- `typing:stop` — Stop typing on an announcement

**Server → Client**:
- `members:online` — List of online user IDs in workspace
- `typing:start` / `typing:stop` — Typing indicators
- `notification:new` — Push notification
- `goal:created`, `goal:updated`, `goal:deleted` — Goal events
- `goal:update_posted` — New goal activity update
- `announcement:created`, `announcement:deleted`, `announcement:pinToggled` — Announcement events
- `announcement:reacted`, `announcement:commented` — Engagement events
- `actionItem:created`, `actionItem:updated`, `actionItem:deleted` — Action item events
- `milestone:created`, `milestone:updated` — Milestone events

## 🗄️ Database Schema

Key models: `User`, `Workspace`, `WorkspaceMember`, `Goal`, `Milestone`, `GoalUpdate`, `ActionItem`, `Announcement`, `AnnouncementReaction`, `Comment`, `Notification`, `RefreshToken`

Full schema: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

## 📝 Known Limitations

- **Email invites**: Require SMTP configuration. Without SMTP vars, invites create in-app notifications only (no error thrown).
- **Rich-text editor**: Uses `contentEditable` with `document.execCommand` (lightweight but deprecated). Suitable for MVP; consider migrating to TipTap or Quill for production.
- **@Mention parsing**: Simple regex-based. Works for exact name matches; does not support partial matching or display-name disambiguation.
- **Single session**: Login revokes all previous refresh tokens (one active session per user).
- **File attachments**: Limited to 10MB. Images render inline; PDFs/text files render as download links.
- **Kanban drag-and-drop**: Status updates are optimistic but do not support drag reordering within a column.

## 📝 License

This project is open source and available under the MIT License.
