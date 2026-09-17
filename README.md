# Boards — a Trello-style project tracker

Internal tool for a PM to create projects, assign employees, and track task
status on drag-and-drop boards — built with React + Tailwind (frontend) and
Express + MongoDB + Socket.IO (backend).

## Structure
```
trello-clone/
  backend/    Express API + MongoDB models + Socket.IO
  frontend/   React (Vite) + Tailwind client
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string (local `mongodb://127.0.0.1:27017/trello_clone` or an Atlas URI)
- `JWT_SECRET` — any long random string

Run MongoDB locally (or use MongoDB Atlas), then:

```bash
npm run dev
```

API runs on `http://localhost:5000`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App runs on `http://localhost:5173`.

## 3. Try it out

1. Go to `http://localhost:5173/register`, create an account with role
   "Project manager" — this is you.
2. Create a project (board) from the dashboard. Four default lists
   (To Do / In Progress / Review / Done) are created automatically.
3. Register a second account (role "Employee") in an incognito window, or
   just create more test users the same way.
4. As the PM, open the project → "Manage team" → add the employee.
5. Add cards, assign them to the employee, drag cards between lists.
   Open two browser windows side by side — moving a card in one updates
   the other in real time via Socket.IO.

## What's included

- JWT auth with two roles: `admin` (PM) and `member` (employee)
- Projects (boards) with per-board membership and manager/member roles
- Lists (columns) and cards with drag-and-drop reordering, persisted via
  an `order` field on each document
- Card details: description, assignees, priority, due date, checklist,
  comments
- "My tasks" view — every card assigned to the logged-in user across all
  projects
- Real-time sync via Socket.IO — board changes appear live for everyone
  viewing that project, no refresh needed

## What to build next

- Notifications when a card is assigned to you
- File attachments on cards (e.g. via S3 or Cloudinary)
- Activity log per card/board
- Board-level filters (by assignee, label, due date)
- Invite-by-email flow instead of open self-registration

## Notes on the code

- Card/list ordering uses a simple numeric `order` field, re-numbered on
  every move. This is simplest to reason about; if boards get very large
  (hundreds of cards per list), consider fractional indexing instead so a
  drag doesn't need to touch every sibling document.
- `POST /api/auth/register` is open so you can try the app immediately.
  Before shipping internally, you'll likely want to restrict it (e.g. PM
  invites employees by email) rather than allowing open self-registration.
