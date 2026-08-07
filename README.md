# CREV Exam Platform — MVP

An Arabic (RTL), fully responsive educational exam platform built with React 19, Vite, Tailwind CSS v4, React Router, React Icons, and Framer Motion. Supabase is wired up as a client-only scaffold (no auth/data logic yet) — everything else runs on mock, in-memory data.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Supabase

Copy `.env.example` to `.env` and fill in your project credentials before using `src/services/supabase.js`:

```bash
cp .env.example .env
```

## Structure

```
src/
 ├── assets/
 ├── components/
 │   ├── auth/        # Reusable pieces for the public login pages
 │   ├── layout/       # Logo, Sidebar, Header (admin dashboard shell)
 │   ├── students/     # StudentTable, StudentFormModal, StudentCard, StudentCreatedModal
 │   ├── dashboard/     # WeeklyBarChart
 │   ├── ui/           # Button, Input, Select, Modal, ConfirmDialog, StatsCard,
 │   │                  # DashboardCard, Badge, SearchBar — the shared UI kit
 │   └── (Navbar, Hero, LoginCard, FeatureCard, Footer — public site)
 ├── data/             # mockData.js — the ONLY place fake data lives
 ├── hooks/            # useDisclosure, useStudents
 ├── layouts/          # MainLayout (public site), AdminLayout (dashboard shell)
 ├── pages/
 │   ├── admin/         # Dashboard, Students, Teachers, Subjects, Exams, Settings
 │   └── (Home, TeacherLogin, StudentLogin, StudentDashboard, ParentLogin)
 ├── routes/           # AppRoutes (route table)
 ├── services/         # supabase.js (client scaffold only)
 ├── utils/            # cn, generateCredentials, formatters
 ├── App.jsx
 └── main.jsx
```

## Routes

| Path                | Page                                         |
|---------------------|-----------------------------------------------|
| `/`                 | Public landing page                            |
| `/teacher`          | Teacher/Admin login (placeholder)              |
| `/student`          | Student login (working form, no real auth)     |
| `/student/dashboard`| Student placeholder dashboard                  |
| `/parent`           | Parent login (placeholder)                     |
| `/admin/dashboard`  | Admin dashboard — stats, charts, activity      |
| `/admin/students`   | Student management (core of this MVP)          |
| `/admin/teachers`   | Teacher management (mock data)                 |
| `/admin/subjects`   | Subject management (mock data)                 |
| `/admin/exams`      | Exams — placeholder table, "Coming Soon"       |
| `/admin/settings`   | Platform settings (local state only)           |

There's no login gate in front of `/admin/*` yet — visit it directly during review.

## Admin dashboard — Students page

The Students page is the most complete flow in this MVP:

- Search + status filter over the mock roster
- **Add Student** modal (name, educational stage, grade, parent phone, optional email, status)
- On save, a `CREV-100x` ID, a random 6-digit password, and a random 4-digit parent PIN are auto-generated (`utils/generateCredentials.js`) and the new student is added to the in-memory list
- A **"Student Created Successfully"** modal follows, showing the generated credentials with **Copy** and **Print Student Card** actions
- Table row actions: View, Edit, Delete (with confirmation), Print Card
- The printable **Student Card** (logo, name, ID, password, PIN, QR placeholder) uses a dedicated print stylesheet (`[data-print-area]` in `index.css`) so only the card prints, not the whole page

## Notes

- All data is mock/in-memory (`src/data/mockData.js`) and resets on refresh — no backend, no persistence, no authentication, as scoped.
- Theme tokens (colors incl. `success`/`danger`/`warning`, radius, shadows) live in `src/index.css` under `@theme` (Tailwind v4).
- The admin dashboard shell (`AdminLayout` + `Sidebar` + `Header`) is intentionally separate from the public `MainLayout`, since it has its own navigation model (collapsible sidebar on mobile, sticky header with page title).
