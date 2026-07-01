# BidNest 🏠

**A hostel bidding marketplace that helps Nigerian university students find off-campus accommodation without relying on agents and landlords directly.**

Live demo: [bidnest-hostel.vercel.app](https://bidnest-hostel.vercel.app)
API: [bidnest-n8qu.onrender.com](https://bidnest-n8qu.onrender.com)

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Core Process Flows](#core-process-flows)
- [Key Technical Decisions](#key-technical-decisions)
- [Feature List](#feature-list)
- [API Overview](#api-overview)
- [Challenges & Solutions](#challenges--solutions)
- [Local Setup](#local-setup)
- [Future Improvements](#future-improvements)

---

## The Problem

Finding off-campus housing as a Nigerian university student is typically slow, opaque, and stressful:

- Students physically visit multiple agents/landlords, spending time and transport money
- Prices aren't transparent — the same room can be quoted differently to different people
- There's no easy way to compare hostels or verify a landlord is legitimate
- Finding a roommate to split costs happens entirely through word of mouth
- Communication with landlords is scattered across calls and informal visits

## The Solution

BidNest moves the entire process online:

1. Landlords list hostels with photos, pricing, and amenities
2. Students browse, filter, and **place bids** instead of accepting a fixed price
3. Landlords accept, reject, or counter each bid
4. Once a bid is accepted, the student pays securely through Paystack and the booking is confirmed
5. Students can find roommates, message landlords directly, and leave reviews after their stay

The bidding mechanic is the core differentiator — it gives students negotiating power they wouldn't have walking into a landlord's office alone, and gives landlords a transparent way to see real demand for a room.

---

## Tech Stack

**Backend**
- Django 5.2 + Django REST Framework — REST API
- PostgreSQL — primary database
- Simple JWT — stateless authentication
- Cloudinary — image storage/CDN
- Paystack — payment processing
- WhiteNoise — static file serving in production

**Frontend**
- React 19 (Vite) — SPA
- Tailwind CSS — styling
- React Router — client-side routing
- Axios — HTTP client
- Lucide React — icons

**Infrastructure**
- Render — backend hosting + PostgreSQL
- Vercel — frontend hosting
- GitHub — version control

---

## System Architecture

BidNest is a **decoupled client-server application**. The React frontend and Django backend are two separate deployments that communicate exclusively through a REST API over HTTPS. They don't share a server or a codebase.

```
┌─────────────────┐         HTTPS / REST API        ┌──────────────────┐
│                  │ ───────────────────────────────▶│                  │
│  React Frontend  │                                  │  Django Backend  │
│   (Vercel)       │ ◀─────────────────────────────── │   (Render)       │
│                  │         JSON + JWT                │                  │
└─────────────────┘                                   └────────┬─────────┘
                                                                 │
                                  ┌──────────────────────────────┼──────────────────────┐
                                  │                               │                       │
                          ┌───────▼───────┐              ┌────────▼────────┐    ┌─────────▼────────┐
                          │  PostgreSQL    │              │   Cloudinary     │    │     Paystack      │
                          │  (Render)      │              │  (image storage) │    │  (payments)       │
                          └────────────────┘              └──────────────────┘    └───────────────────┘
```

**Why decoupled instead of a Django monolith with templates?**
A separate API means the same backend could power a future mobile app (React Native) without any changes. It also forces a clean contract between frontend and backend — every interaction has to go through a defined endpoint, which keeps the codebase organized as features grow.

**Why JWT instead of Django sessions?**
Sessions rely on cookies and server-side state, which becomes awkward once frontend and backend live on different domains (Vercel vs Render). JWT is stateless — the token itself carries the user's identity, so the backend doesn't need to remember anything between requests. This also means the same auth system would work unmodified if a mobile app was added later.

---

## Database Design

The data model is split across seven Django apps, each owning one part of the domain:

| App | Responsibility |
|---|---|
| `users` | Custom user model (email-based, role field), Student/Landlord profiles |
| `hostels` | Hostel listings, images, reviews, favorites |
| `bids` | The bidding system |
| `roommates` | Roommate groups and join requests |
| `messaging` | Direct messages and conversations |
| `notifications` | In-app notification feed |
| `payments` | Bookings and Paystack transaction handling |

### Core relationships

```
User (1) ──────┬──── (1) StudentProfile
                └──── (1) LandlordProfile

User [Landlord] (1) ──── (many) Hostel
Hostel (1) ──── (many) HostelImage
Hostel (1) ──── (many) HostelReview
Hostel (1) ──── (many) Bid
Hostel (1) ──── (many) RoommateGroup

User [Student] (1) ──── (many) Bid
Bid (1) ──── (0..1) Booking
Booking (many) ──── (1) Hostel

User (many) ──── (many) Conversation ──── (many) Message
User (1) ──── (many) Notification
```

**Why a custom User model from the start?** Django's default user model uses `username` for login. BidNest needed email-based login and a `role` field (student/landlord) baked into the user itself, since almost every permission check in the app depends on it. Retrofitting a custom user model after migrations exist is painful in Django, so it was set up correctly from the first commit.

**Why separate `StudentProfile`/`LandlordProfile` instead of one big User table?** Students and landlords need fundamentally different fields (school + student ID vs business name + ID document). Keeping them in one-to-one related tables avoids a User model full of nullable fields that only apply to one role.

---

## Core Process Flows

### 1. The Bidding Flow

This is the central mechanic of the app.

```
Student finds hostel
        │
        ▼
Student places bid (amount + optional message)
        │
        ▼
Backend checks: does student already have a PENDING bid on this hostel?
   │ yes → reject with error          │ no → create Bid (status=pending)
                                              │
                                              ▼
                                   Notification created for landlord
                                              │
                                              ▼
                              Landlord sees bid on Dashboard → 3 choices
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              ▼                               ▼                               ▼
          ACCEPT                          REJECT                         COUNTER
   status=accepted                  status=rejected              status=countered
   Notify student                   Notify student              counter_amount set
              │                                                  Notify student
              ▼                                                          │
   Student sees "Pay Now"                                                ▼
   button on Dashboard                                        Student can pay the
              │                                                counter amount, or
              ▼                                               place a new bid instead
        Payment flow (see below)
```

**Why allow only one pending bid per student per hostel?** Without this constraint, a student could spam a landlord with multiple bids on the same room, making the landlord's dashboard noisy and the "demand signal" meaningless. The constraint is enforced at the view level before the bid is created.

### 2. The Payment Flow

```
Student clicks "Pay Now" on an accepted/countered bid
        │
        ▼
POST /api/payments/initiate/  { bid_id }
        │
        ▼
Backend verifies the bid belongs to this student AND is accepted/countered
        │
        ▼
Backend creates a Booking record (status=pending) with a unique reference
        │
        ▼
Backend calls Paystack's /transaction/initialize endpoint
   with amount (in kobo) + reference + callback_url
        │
        ▼
Paystack returns an authorization_url
        │
        ▼
Frontend redirects the browser to that URL (Paystack's hosted checkout)
        │
        ▼
Student completes payment on Paystack
        │
        ▼
Paystack redirects back to /payment/callback?reference=xxx
        │
        ▼
Frontend calls POST /api/payments/verify/ { reference }
        │
        ▼
Backend calls Paystack's /transaction/verify/{reference} endpoint
   (never trusts the frontend's claim that payment succeeded —
    always re-confirms directly with Paystack's servers)
        │
        ▼
If Paystack confirms success:
   - Booking.payment_status = paid
   - Hostel.status = occupied
   - Notification sent to landlord
```

**Why verify server-to-server instead of trusting the frontend redirect?** A user could manually navigate to `/payment/callback?reference=fake` without ever paying. The backend re-checks the transaction status directly against Paystack's API using the secret key, which only the server has access to. This is the standard security pattern for any payment integration — the frontend redirect is just a UX signal, never a source of truth.

### 3. Roommate Matching Flow

```
Student creates a RoommateGroup on a hostel
   (creator is automatically added as an ACCEPTED member)
        │
        ▼
Other students browse the hostel and see open roommate groups
        │
        ▼
A second student clicks "Request to Join"
   → RoommateMember created with status=pending
   → Notification sent to group creator
        │
        ▼
Group creator sees the pending request and Accepts or Rejects
        │
        ▼
If accepted: member count recalculated (counting only ACCEPTED members)
   if count == max_members → group marked is_full=True
```

**Why does joining require approval instead of being instant?** An instant-join system would let anyone join any group, which defeats the purpose of "matching" — the whole point is the group creator gets to vet who they'll be living with. This mirrors how the bidding system also requires landlord approval rather than first-come-first-served.

### 4. Authentication Flow (JWT)

```
User submits email/password (or Google credential)
        │
        ▼
Backend validates credentials
        │
        ▼
Backend issues two tokens:
   - access token  (short-lived, ~1 day) — sent with every API request
   - refresh token (longer-lived, ~7 days) — used to get a new access token
        │
        ▼
Frontend stores both in localStorage
        │
        ▼
Axios interceptor attaches "Authorization: Bearer <access_token>"
   to every outgoing request automatically
        │
        ▼
Protected Django views check the token via DRF's JWTAuthentication
   and read request.user — used everywhere for permission checks
   (e.g. "is this user the landlord who owns this hostel?")
```

**Why Google OAuth on top of email/password?** Reduces signup friction — Nigerian students are more likely to complete a one-click Google signup than fill out a form. On the backend, Google sign-in reuses the exact same `get_or_create` user logic and JWT issuance as regular registration, so there's no separate "Google user" code path to maintain — it just creates a normal User row with an unusable password.

---

## Key Technical Decisions

| Decision | Reasoning |
|---|---|
| Django REST Framework over Flask/FastAPI | Built-in admin panel, ORM, and auth scaffolding meant less boilerplate for a solo-built project with a tight feature list |
| PostgreSQL over SQLite | SQLite doesn't handle concurrent writes well and isn't meant for production; PostgreSQL also supports JSON fields, used for the `amenities` list on Hostel |
| Cloudinary over local file storage | Render's filesystem is ephemeral — anything saved locally disappears on redeploy. Cloudinary persists images independently of the app server |
| Polling over WebSockets for chat | A 3-second polling interval gives a "live enough" feel for a portfolio project without the added infrastructure complexity of Django Channels + Redis, which would be harder to deploy on Render's free tier and harder to explain/debug |
| Separate Django apps per domain | Keeps `bids`, `hostels`, `messaging` etc. independently testable and readable, rather than one giant app with everything in it |
| dj-database-url for DB config | Render provides a single `DATABASE_URL` connection string; parsing it directly avoids juggling five separate host/port/user/password environment variables |

---

## Feature List

- Email/password and Google OAuth authentication with JWT
- Role-based access (Student / Landlord) enforced at the API level
- Hostel listings with multi-image upload via Cloudinary
- Search and filtering by location, price range, and category
- Bidding system: place, accept, reject, counter-offer
- Secure payments via Paystack with server-side verification
- Roommate finder with join-request approval
- Direct messaging between students and landlords
- In-app notifications for bids, messages, payments, and roommate requests
- Favorites/bookmarking
- Reviews and star ratings
- Landlord dashboard for managing listings and responding to bids
- Django admin panel for oversight (verify hostels, manage users)

---

## API Overview

All endpoints are prefixed with `/api/`. Authentication uses `Authorization: Bearer <token>`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /users/register/`, `POST /users/login/`, `POST /users/google/`, `GET/PUT /users/profile/` |
| Hostels | `GET/POST /hostels/`, `GET/PUT/DELETE /hostels/{id}/`, `POST /hostels/{id}/images/`, `POST /hostels/{id}/favorite/`, `POST /hostels/{id}/reviews/` |
| Bids | `POST /bids/`, `GET /bids/my-bids/`, `GET /bids/hostel/{id}/`, `PUT /bids/{id}/respond/` |
| Roommates | `GET/POST /roommates/`, `POST /roommates/{id}/join/`, `PUT /roommates/requests/{id}/respond/` |
| Messages | `GET /messages/`, `GET /messages/with/{user_id}/`, `GET/POST /messages/{id}/messages/` |
| Notifications | `GET /notifications/`, `PUT /notifications/{id}/read/`, `PUT /notifications/mark-all-read/` |
| Payments | `POST /payments/initiate/`, `POST /payments/verify/`, `GET /payments/my-bookings/` |

---

## Challenges & Solutions

A few of the harder problems solved while building this:

- **Cloudinary images not appearing after upload** — Django 5.1+ replaced `DEFAULT_FILE_STORAGE` with a `STORAGES` dict; the old setting was silently ignored, so uploads were falling back to local (ephemeral) storage. Fixed by migrating to the new `STORAGES` configuration.
- **Database connection failing on Render** — the internal PostgreSQL hostname only resolves between services in the same Render region; switched to using Render's full `DATABASE_URL` parsed via `dj-database-url` instead of manually assembling host/port/user/password.
- **Roommate group showing as "full" prematurely** — the member count was including pending join requests, not just accepted ones; fixed by filtering `status='accepted'` in the count property.
- **Payment trust boundary** — initially considered marking a booking as paid based on the frontend redirect alone; corrected to always re-verify the transaction server-side against Paystack's API before updating any booking status.

---

## Local Setup

**Backend**
```bash
cd BidNest
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
# create a .env file with SECRET_KEY, DB credentials, CLOUDINARY_*, PAYSTACK_*, GOOGLE_CLIENT_ID
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Future Improvements

- Native mobile app (React Native) reusing the existing REST API
- WebSocket-based real-time chat (Django Channels) instead of polling
- ID verification workflow for landlords with admin approval queue
- University partnership integrations for official housing listings
- Automated rent reminders and recurring payment scheduling

---

*Built by Gbolahan (me) as a project to solve a real, lived problem for Nigerian university students.*
