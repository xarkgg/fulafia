# FULafia Student Portal: redesigned frontend

A redesigned, mobile-first frontend for the Federal University of Lafia student portal ([my.fulafia.edu.ng](https://my.fulafia.edu.ng)). It covers every feature of the current portal, but with labeled navigation, sensible defaults (the current session is always preselected), consistent styling and screens that work properly on a 360px Android phone.

It runs entirely on **mock data** for a fictional demo student, behind a typed data layer, so the university's developers can connect the real backend without touching the UI.

> Demo build: any username and password signs you in. All data is fictional.

## Screens

| Area | What's there |
| --- | --- |
| **Login** | Username/email + password (show toggle), student / applicant switch, forgot password, "Start your application", WhatsApp support |
| **Dashboard** | Greeting, CGPA with progress and class of degree, registered courses and units, school fee status, current session/semester/registration status, quick actions, recent wallet activity |
| **Fees** | School fee / Standalone / Association dues tabs, session selector (defaults to current), fee breakdown, paid vs outstanding, pay with Wallet or Remita, invoices and receipts |
| **Wallet** | Balance, total credits and debits, transactions as readable cards on mobile and a table on desktop, search and filters |
| **Self service** | Payment verification against Remita with loading and result states; semester registration checklist |
| **Bio data** | Bio info, Health info, Next of kin, Sponsorship; clear view and edit modes; date of birth locked; download as PDF |
| **Academics** | Course registration (add/drop, unit meter, draft, submit, print course form), Results (GPA per semester, CGPA, grades), Choice of programme (details, transfer requirements, notes, fee notice, apply), E-learning registration |
| **Documents** | Admission letter, application summary, screening fee invoice, course forms, bio data form and fee receipts, all printable / saveable as PDF |
| **Support** | Ticket list with status and category filters, new ticket form with attachment, conversation thread with replies |
| **Account** | Profile photo upload, contact details, change password with strength meter |

The flows are connected: paying the school fee from the wallet lowers the balance, adds a receipt, and unlocks course registration submission; submitting registration makes the course form available, and so on. Changes persist in the browser (Account → Reset demo restores the starting data).

## What it fixes from the current portal

- **Navigation:** a labeled, grouped, collapsible sidebar on desktop; a bottom tab bar (Home, Academics, Payments, Support, More) on phones. No floating flyouts over content.
- **No dead "Select session" states:** every page opens on the current session (2026/2027, First Semester).
- **Consistent design:** one light theme (plus dark mode) in FULafia gold and navy, with no stray black dropdowns or mismatched balance cards.
- **Readable on mobile:** wallet transactions become cards, tables collapse sensibly, and inputs never trigger iOS zoom.
- **Real loading, empty and error states, plus toasts for every action.**

## Tech

- [Next.js 15](https://nextjs.org) (App Router, TypeScript), React 19
- Tailwind CSS v4, [lucide-react](https://lucide.dev) icons
- No backend required; deploys as-is to Vercel

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

Requires Node.js 18.18 or newer.

## Plugging in the real API

All data access goes through **`lib/api.ts`**. Every function is typed against **`lib/types.ts`** and documents the endpoint it expects, for example:

```ts
export async function getWallet(): Promise<Wallet> {
  if (LIVE) return http("GET", "/wallet");
  return mock(() => { /* … */ });
}
```

To switch from mock data to the real backend:

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (for example `https://api.my.fulafia.edu.ng/v1`).
2. Serve the endpoints referenced in `lib/api.ts`, returning the shapes in `lib/types.ts`. Requests are sent with `credentials: "include"`, so cookie sessions work; errors should return `{ "message": "…" }`.
3. Optionally delete `lib/mock/`.

The UI does not change. Mock data lives in `lib/mock/data/*.json` and is a good reference for the expected payloads.

Institution settings (WhatsApp number, support email, application link) are in **`lib/config.ts`**. The WhatsApp number is a placeholder.

## Project structure

```
app/
  login/                 Sign-in screen
  (portal)/              Authenticated screens inside the app shell
    dashboard/  biodata/  documents/  support/  account/
    academics/           registration, results, programme, e-learning
    (payments)/          fees, wallet, self-service
  print/                 Printable documents (letters, forms, receipts)
components/
  shell/                 Sidebar, top bar, bottom tabs, navigation config
  ui/                    Buttons, fields, cards, tabs, sheets, toasts, states
lib/
  api.ts                 Typed data layer (mock ↔ real API)
  types.ts               Domain types
  mock/                  Seed JSON + in-browser mock database
```

## Deploy

Import the repository on [Vercel](https://vercel.com/new). No settings or environment variables are needed for the demo.

## Note

This is an independent redesign proposal built by a FULafia student. It is not affiliated with or endorsed by the university. The FULafia name and crest belong to the Federal University of Lafia.
