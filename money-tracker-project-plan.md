# Money Tracker — Project Plan

October 6, 2026

## Mission brief

A personal finance platform focused on hostel students, for recording income and expenses, categorizing transactions, and setting budgets and savings goals, visualized through an interactive dashboard — built as a PWA with notifications and automatic transaction capture.

Key features:
- Built for hostel students — everyday spending categories and habits specific to hostel life
- SMS parsing — automatically pull past transaction history from bank/payment SMS
- Budgets, savings goals, and an interactive spending dashboard with smart insights
- PWA with notifications — installable app experience with budget/spending alerts

## Overview

Money Tracker is a personal finance app for hostel students. It is built as an installable web app (PWA) that runs on laptops, iPhones and Android phones, plus an Android APK that adds automatic SMS reading. It records income and expenses, sorts them into categories, tracks budgets and savings goals, and shows everything on an interactive dashboard with insights.

The aim is to make recording money almost effortless. Transactions are captured automatically from bank SMS (Android), bank emails (all platforms, including iPhone) and scanned bills, and can always be added by hand in a few seconds. One account works the same way on web, Android and iPhone.

## Features

All features below are part of the product and work on web, Android and iPhone unless a platform is named.

### Tracking

- Add income or an expense in a few seconds: amount, category, account, date, note
- Accounts for cash, bank, UPI and wallet, with transfers between them
- Edit, delete, search and filter by date, category, account or amount
- Recurring entries for the mess fee, subscriptions or the monthly allowance
- Bill and receipt scanning (OCR) to fill an entry from a photo
- Split expenses and IOUs with roommates, with a running balance of who owes whom
- Shared group budgets, for example for a trip

### Categories

- Hostel-focused defaults: mess, canteen and snacks, food delivery, laundry, mobile recharge, printouts and stationery, local transport, travel home, outings, subscriptions, medical
- Income types: allowance, scholarship, stipend, refund, friend paid back
- Custom categories with icons
- Automatic categorisation by merchant that learns from the user's corrections

### Budgets and goals

- Overall and per-category budgets, weekly or monthly
- Budget cycle that starts on the user's own date, such as the day the allowance arrives
- Savings goals with a target, a deadline and the amount to save per day
- Alerts at 50%, 80% and 100% of a budget.

### Dashboard and insights

- Spending by category, daily and weekly trend, budget progress, month-over-month comparison
- Safe to spend today: remaining budget minus upcoming recurring payments, divided by days left
- Runway: the date the money runs out at the current pace
- Pattern insights, such as weekend food-delivery spending or categories that jumped since last month
- Goal pace: how much to save per day to reach each goal

### Automatic capture

- Bank and UPI SMS on Android
- Bank alert emails from Gmail on web, Android and iPhone
- A review list for anything the parser is unsure about

### Offline and notifications

- Entries can be added without internet and sync when the connection returns
- Push notifications for budget alerts, goal reminders, recurring payments due and a weekly summary

### Account and privacy

- Email and password login, plus Google sign-in
- Optional PIN lock, with biometric unlock on the Android app
- Export of all data as CSV
- Delete the account and all data from settings

## Availability by platform

| Capability | Web (PWA) | iPhone (PWA) | Android (APK) |
|---|---|---|---|
| Manual entry, budgets, goals, dashboard, insights | Yes | Yes | Yes |
| SMS capture | No | No | Yes |
| Email capture (Gmail) | Yes | Yes | Yes |
| Bill scanning | Upload an image | Camera or upload | Camera or upload |
| Offline entry | Yes | Yes | Yes |
| Push notifications | Yes | Yes, after adding to the home screen | Yes |
| Install | Add to home screen | Add to home screen | APK |

## Automatic capture

Three sources feed the same transaction list, next to manual entry. Email capture is what gives iPhone users automatic tracking, since iOS does not allow apps to read SMS.

| Source | Platforms | How it works | Where it is read |
|---|---|---|---|
| Bank and UPI SMS | Android APK | After the user grants SMS permission, the app reads past messages and listens for new ones. A small Kotlin plugin reads the inbox. Per-bank rules, written in TypeScript, extract amount, debit or credit, merchant, last 4 digits and reference number. | On the phone. Raw SMS text never leaves the device; only the extracted fields are sent. |
| Bank alert emails | Web, iPhone, Android | The user connects Gmail with read-only access. The server checks alert emails from known bank senders and extracts the same fields. | On the server. Email bodies are not stored, only the extracted fields. |
| Bill and receipt scan | Web, iPhone, Android | The user photographs or uploads a bill. An OCR service reads amount, merchant and date, and the result opens as a pre-filled entry to confirm. | On the server (AWS Textract). The image is deleted after extraction unless the user keeps it. |

Duplicates are caught across all sources using a hash of amount, time (to the minute), last 4 digits and reference number, so one payment seen in an SMS, an email and a manual entry is counted once. Anything the parser cannot read with confidence goes to a review list instead of straight into the transaction list.

## Tech stack

TypeScript across the web app, API and SMS parsing rules, with Kotlin only for the small Android SMS plugin. All server components run in Docker.

| Part | Choice | Note |
|---|---|---|
| Web app and API | Next.js (App Router) + TypeScript | One project: PWA pages plus API route handlers |
| Web UI | Tailwind CSS + shadcn/ui, Recharts | Components and charts |
| Offline storage | IndexedDB (Dexie) | Entries made offline sync later, on web and in the APK |
| Android app | Capacitor | Packages the same web app (static export) as an APK |
| Android SMS | Kotlin plugin + TypeScript wrapper | Kotlin reads the inbox; parsing rules run in TypeScript |
| Database | PostgreSQL + Prisma | Schema and migrations through Prisma |
| Auth | JWT in request headers, bcrypt, Google sign-in | Same account on every device; tokens instead of cookies so the APK and browser behave alike |
| Email capture | Gmail API (read-only OAuth) | Bank alert emails |
| Bill scanning | AWS Textract | OCR for receipts and bills |
| Push | Web Push (web, iPhone), Firebase Cloud Messaging (Android) | Budget and goal alerts |
| Scheduled jobs | Small worker container with cron | Nightly alerts, recurring entries |
| Containers | Docker + Docker Compose | Same setup on laptops and on AWS |
| Cloud | AWS: EC2, RDS, S3, Textract | See architecture |
| CI/CD | GitHub Actions | Tests, deploys and APK builds |
| Repository | Monorepo: `web/`, `android/`, `infra/` | Web app and API in `web/`, Capacitor project and SMS plugin in `android/` |

## Architecture

**Architecture: 3 clients, 1 API, 5 supporting services**

The laptop and iPhone users open the PWA in the browser. Android users install the APK, which is the same web app packaged with Capacitor and talks to the API over HTTPS. The Android app reads and parses SMS on the phone and sends only the extracted fields. Gmail emails and scanned bills are processed on the server. The Next.js app and a small scheduled worker run as Docker containers on one AWS EC2 instance behind Nginx, defined in a single Docker Compose file, with data in RDS PostgreSQL.

## Team

Six developers, each owning one area end to end. Work that touches two areas is agreed between their owners before it starts.

| Role | Owns | Backup |
|---|---|---|
| Frontend 1 | Web app shell, login, transaction entry, offline sync, PWA install and push, bill upload | Frontend 2 |
| Frontend 2 | Dashboard, charts, budgets, goals, insights and settings screens, Gmail connect screen | Frontend 1 |
| Backend 1 | Auth, accounts, categories, transactions, duplicate detection, sync, API route handlers for SMS ingestion | Backend 2 |
| Backend 2 | Budgets, goals, splits, insights, notifications, Gmail connection and email fetching, OCR integration | Backend 1 |
| Android | Capacitor project, Kotlin SMS plugin, SMS and bank-email parsing rules, Android push, APK builds, testing across phone brands | Frontend 1 |
| Cloud / DevOps | Docker setup, AWS, CI/CD, secrets, monitoring, backups, scheduled worker, APK build pipeline | Backend 1 |

## Working rules

- **Ownership:** every area has one accountable owner, who also keeps its README up to date.
- **API contract:** request and response types live in a shared package and are agreed before implementation. Web and Android both build against them.
- **Branching:** short-lived feature branches merged into `main` through pull requests. No direct pushes to `main`.
- **Reviews:** every pull request needs one approving review from another developer. Changes to the API contract also need approval from the Android owner and a web owner.
- **Quality gate:** CI runs lint, tests and builds on each pull request. `main` is always deployable.
- **Environments:** development and production, both deployed only through CI.
- **Secrets:** stored in AWS and never committed to the repository.
- **Cadence:** weekly planning, a short mid-week check-in and a weekly demo of working software.
- **Decisions:** technical decisions that affect more than one area are written down in a decisions log in the repository.

## Edge cases and how we handle them

| Situation | Approach |
|---|---|
| One payment appears as an SMS, an email and a manual entry | A shared duplicate hash (amount, time to the minute, last 4 digits, reference number) keeps one record. If the reference number is missing, a match on amount, account and a short time window is flagged for review instead of merged silently. |
| A bank changes its message format or a new bank appears | Unreadable messages go to the review list and are never dropped. Parsing rules are kept per bank and served by the API, so a new template is a rule update, not an app release. |
| OTPs, promotions and non-bank messages | Only senders that match known bank and UPI sender IDs are read. OTP and promotional messages are ignored and never stored. |
| Refunds, reversals and failed payments | Failed or declined messages are ignored. A reversal or refund creates an income entry linked to the original expense, so budgets stay correct. |
| User denies SMS permission, or Android stops background work | The app works fully without SMS, using manual entry, email and scanning. New messages are caught as they arrive and a catch-up scan runs each time the app opens. |
| iPhone users, who cannot read SMS | Email capture and scanning cover automatic tracking. Web push on iPhone works only after the PWA is added to the home screen, which the install prompt explains. |
| Gmail access limits and expired connections | Google restricts apps with Gmail access to a limited list of test users until the app passes its verification review. The rollout stays within that limit, and verification is completed before any public launch. If a connection expires or is revoked, the app asks the user to reconnect. |
| Users on other email providers | Gmail is supported first. Other users rely on manual entry, scanning and, on Android, SMS. |
| Offline edits and conflicts | Each entry gets an ID on the device, so a retried sync never creates a duplicate. If the same entry is edited on two devices, the latest edit wins and the earlier version is kept in history. Deleted entries are soft-deleted so they do not reappear. |
| Blurry, handwritten or multi-total bills | OCR output opens as a pre-filled form. Low-confidence fields are highlighted and nothing is saved until the user confirms. Scan images are deleted after extraction unless the user keeps them. |
| Wrong automatic category | The user corrects it once, and the app learns that merchant-to-category rule for that user. |
| Non-INR amounts | Amounts are handled in INR only. Messages in another currency are sent to the review list. |
| Month boundaries and time zones | The budget cycle starts on the user's chosen date. Times are stored in UTC and shown in local time. Money is stored in paise as whole numbers to avoid rounding errors. |
| Duplicate or repeated alerts | Each budget threshold alert is sent once per period. Scheduled jobs are safe to run twice. |
| Server downtime | Apps keep working offline from local storage and sync when the server returns. Database backups run on a schedule to S3. |
| Privacy and data deletion | Raw SMS text stays on the phone and email bodies are not stored. Deleting an account removes transactions, goals, email connections and scans. |
| App distribution | Google Play restricts the SMS permission, so Android is shared as an APK inside the college. iPhone users install the PWA from the browser, so no app store or Apple developer account is needed. |
| Older APKs after the server changes | The API is versioned, so older APKs keep working. The app shows an update prompt when a newer APK is available. |
| Login inside the APK versus the browser | Sessions use tokens sent in request headers instead of cookies, so the APK and the browser behave the same way. |
