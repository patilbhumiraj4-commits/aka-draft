# Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)

Nodevember 4.0. Users register, write posts or drafts, and improve them with Gemini AI.
Posts go to an admin for approval before they are publicly visible.

**Stack:** Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, Google Gemini (`@google/genai`)

## Setup (Local)

```bash
npm install
cp .env.example .env     # then fill in the values
npm run dev              # or: npm start
```

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `GEMINI_API_KEY` | Key from https://aistudio.google.com/apikey |
| `ADMIN_EMAIL` | Whoever registers with this email becomes `admin` |

## Deployment on Vercel

This project is configured for seamless deployment to Vercel Serverless Functions.

### 1. Deploy via Git (GitHub / GitLab / Bitbucket)
1. Push your repository to GitHub.
2. In your [Vercel Dashboard](https://vercel.com/dashboard), click **"Add New"** > **"Project"** and import the repository.
3. Keep default build settings (Framework Preset: **Other**, Root Directory: `./`).
4. Under **Environment Variables**, add:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (e.g., `7d`)
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (e.g., `gemini-2.5-flash`)
   - `ADMIN_EMAIL`
5. Click **Deploy**.

### 2. Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```
Add the environment variables in the Vercel dashboard or via `vercel env add`.

> **MongoDB Atlas Network Access Tip:** Ensure your MongoDB Atlas cluster has IP Whitelist set to `0.0.0.0/0` (Allow access from anywhere) so Vercel's dynamic serverless IPs can connect.

## Schemas

- **User:** `{ name, email, password, role: "admin" | "user" }`
- **Post:** `{ title, description, content, image, category, createdBy (ref User), status: "draft" | "pending" | "approved" | "rejected", createdAt }`
  (plus `improvedFrom`, which links an AI-improved draft to its original)

## API

Protected routes need `Authorization: Bearer <token>`.

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register `{ name, email, password }` |
| POST | `/auth/login` | Log in `{ email, password }`, returns JWT |
| GET | `/auth/me` | Current user (auth) |

### User: posts
| Method | Route | Description |
|---|---|---|
| POST | `/posts` | Create a draft; send `"status": "pending"` to submit directly (auth) |
| GET | `/posts` | All approved posts (`?category=`, `?search=`) |
| GET | `/posts/my-posts` | Your own posts and drafts (auth, `?status=`) |
| GET | `/posts/:id` | One approved post |
| PATCH | `/posts/:id` | Update your post; `"status": "pending"` submits for approval (auth) |
| DELETE | `/posts/:id` | Delete your post (auth) |

Editing an approved or rejected post moves it back to `draft`.

### Admin: approval (admin only)
| Method | Route | Description |
|---|---|---|
| GET | `/admin/posts/pending` | Posts awaiting approval |
| PATCH | `/admin/posts/approve/:id` | Approve |
| PATCH | `/admin/posts/reject/:id` | Reject |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/ai/improve/:postId` | Improve your post with Gemini and save as a **new draft** (new ID); original untouched. Optional body: `{ "instructions": "make it shorter" }` |

## Quick test

```bash
curl -X POST localhost:5000/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Itachi","email":"itachi@example.com","password":"secret123"}'
curl -X POST localhost:5000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"itachi@example.com","password":"secret123"}'
```
