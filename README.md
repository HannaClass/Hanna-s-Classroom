# Hanna's Classroom

A simple 1-to-1 online English teaching classroom: video call, screen share,
shared whiteboard, saved lesson materials, and each student's Google Doc,
all in one place with a permanent link per student.

This is v1 — the core only (video + screen share + whiteboard + saved work +
Google Docs). Booking, payments, quizzes etc. are deliberately left out for now.

## What you'll need (all free to start)

1. A **GitHub** account — to hold the code
2. A **Vercel** account — hosts the app (vercel.com, sign up with GitHub)
3. A **Supabase** account — the database (supabase.com)
4. A **Daily.co** account — the video calling (daily.co)

None of these need a credit card to start. Total setup time: about 20-30 minutes.

---

## Step 1 — Put the code on GitHub

1. Go to github.com, create a new empty repository, e.g. `hanna-classroom`.
2. On your computer, in this project folder, run:
   ```
   git init
   git add .
   git commit -m "Initial version"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/hanna-classroom.git
   git push -u origin main
   ```
   (If you're not comfortable with these commands, GitHub Desktop does the same thing with buttons instead of typing.)

## Step 2 — Set up Supabase (the database)

1. Create a new project at supabase.com (any name, any region close to the UK).
2. Once it's ready, open the **SQL Editor** (left sidebar) and paste in the
   entire contents of `supabase-schema.sql` from this project, then click Run.
   This creates the tables the app needs.
3. Go to **Storage** (left sidebar) → Create a new bucket called `materials`
   → make it **Public**. This is where uploaded PDFs/PPTs/images live.
4. Go to **Project Settings → API**. You'll need two values from here in Step 4:
   - Project URL
   - anon / public API key

## Step 3 — Set up Daily.co (the video calling)

1. Sign up at daily.co. You'll get a subdomain like `hanna-jp.daily.co` —
   note the part before `.daily.co`.
2. Go to **Developers → API Keys** and copy your API key.

## Step 4 — Deploy to Vercel

1. Go to vercel.com → **Add New Project** → import the GitHub repo you made in Step 1.
2. Before clicking Deploy, open **Environment Variables** and add these
   (see `.env.local.example` in this project for the full list with notes):
   - `TEACHER_PASSWORD` — a password you'll use to log in
   - `SESSION_SECRET` — any random string
   - `NEXT_PUBLIC_SUPABASE_URL` — from Step 2
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Step 2
   - `DAILY_API_KEY` — from Step 3
   - `NEXT_PUBLIC_DAILY_DOMAIN` — your Daily subdomain from Step 3
3. Click **Deploy**. After a minute or two you'll get a live URL like
   `hanna-classroom.vercel.app`.

## Step 5 — Try it

1. Visit your Vercel URL, log in with your `TEACHER_PASSWORD`.
2. Add a student on the dashboard — this automatically creates their
   permanent video room and classroom link.
3. Click **Open classroom** to see the teacher view (video + whiteboard +
   Google Doc + materials + notes, all in tabs on the right).
4. Copy the student link shown under their name and open it in a different
   browser (or send it to yourself on your phone) to see exactly what the
   student sees: click the link → allow camera/mic → they're in, with the
   video and the shared whiteboard.

## How it works day to day

- **Every student's link is permanent.** Bookmark it, or send it once —
  it never changes and always opens the same classroom.
- **Everything saves itself.** The whiteboard autosaves as you draw (roughly
  every 1-2 seconds), materials stay uploaded, notes stay logged, so next
  lesson picks up exactly where you left off.
- **The whiteboard sync is "near-live"**, not frame-by-frame — there's
  normally a second or so of catch-up when the other person draws. For a
  1-to-1 lesson where you're mostly taking turns rather than both scribbling
  at the exact same instant, this is unnoticeable in practice.
- **Screen sharing** (Google Docs, websites, slides, videos) happens through
  the video panel itself — the screen-share button is part of the Daily
  call controls.

## Known trade-offs of keeping this simple

- No calendar/booking — you send students their link directly.
- No payments.
- The teacher password is a single shared password, not individual logins —
  fine for one teacher, would need proper accounts if you ever add other tutors.
- Free tiers: Daily.co gives ~80 hours of lessons/month free, Supabase pauses
  a project after 7 days completely unused (just click "resume" in its
  dashboard), and Vercel's free tier is technically for non-commercial
  projects — worth knowing since this supports paid tutoring, even though
  enforcement on small tools like this is rare in practice.

## If you want to add later

The database already has an empty `lesson_templates` table ready for
"reusable lesson templates," and `uploaded_materials`/`lesson_notes` are
already keyed by student, so booking, homework, or a template picker can be
added without changing the foundations.
