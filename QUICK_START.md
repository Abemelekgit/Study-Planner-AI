# 🚀 QUICK START - Study Planner

## What's Happening Right Now

✅ **npm install** is running - Installing all dependencies (takes 2-3 minutes)

## Once Installation is Complete

### ⏰ Time to Get Running: 10 minutes

### Step 1️⃣: Create Environment File (30 seconds)
```bash
cp .env.local.example .env.local
```

### Step 2️⃣: Set Up Supabase (5 minutes)

1. **Create Supabase Account**
   - Go to: https://supabase.com
   - Click "Sign Up"
   - Create free account

2. **Create Project**
   - Name it: `study-planner`
   - Pick a region near you
   - Wait for project to initialize (~2 min)

3. **Get Your Credentials**
   - Click **Settings** (bottom left)
   - Click **API** tab
   - Copy **Project URL**
   - Copy **Anon (public) key**

4. **Add to .env.local**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=paste_your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_key_here
   AI_API_KEY=your_openai_api_key  # Optional - fallback planner works without it
   AI_PROVIDER=openai
   AI_MODEL=gpt-4o-mini
   ```

### Step 3️⃣: Set Up Database (2 minutes)

1. In Supabase, click **SQL Editor**
2. Click **New Query**
3. Open file: `DATABASE_SETUP.sql`
4. Copy entire content
5. Paste in Supabase SQL Editor
6. Click **Run** button
7. ✅ Done! Database is ready

### Step 4️⃣: Start Development Server (1 minute)

```bash
npm run dev
```

You'll see:
```
▲ Next.js 14.0.4
  - Local:        http://localhost:3000
```

### Step 5️⃣: Open in Browser (10 seconds)

Visit: **http://localhost:3000** ✨

---

## 🎯 First Time Using the App?

1. Click **Sign Up**
2. Enter email: `test@example.com`
3. Enter password: `Test123456` (6+ chars)
4. Click **Sign Up**
5. Login with same credentials
6. **Boom!** You're on the dashboard

---

## 📋 What You Can Do

### Create a Course
1. Click **Courses** → **+ New Course**
2. Enter: `Test Course`
3. Pick a color
4. Click **Save Course**

### Create a Task
1. Click the course
2. Click **+ New Task**
3. Enter: `Read Chapter 1`
4. Set priority, due date
5. Click **Save Task**

### View All Tasks
1. Click **Tasks** in navbar
2. See all your tasks
3. Filter by course or status
4. Sort by priority

### Generate AI Plan
1. Click **AI Planner**
2. Set daily hours (e.g., 3)
3. Click **Generate Plan with AI**
4. 💡 See your weekly schedule!

---

## 🔧 Troubleshooting

### npm install still running?
- That's normal! Takes 2-3 minutes first time

### Cannot find module errors?
- Wait for npm install to fully complete
- Then try: `npm run dev` again

### Supabase connection errors?
- Check `.env.local` has correct URLs
- Make sure to use the **Anon Key** (not service role)

### Database setup failed?
- Make sure you ran ALL of DATABASE_SETUP.sql
- Check there are no errors in Supabase

### App shows "Loading..." forever?
- Check browser console (F12)
- Make sure you're logged in
- Check `.env.local` is correctly set

---

## 📚 Need More Help?

- **Setup Guide**: Read `GETTING_STARTED.md` (detailed checklist)
- **Full Reference**: Read `README.md`
- **Architecture**: Read `SETUP_GUIDE.md`
- **Overview**: Read `PROJECT_SUMMARY.md`

---

## ✨ That's It!

You now have a **complete AI-powered Study Planner** running locally! 🎉

**Next**: Open `http://localhost:3000` and start managing your studies!
