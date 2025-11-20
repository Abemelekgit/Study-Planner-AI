# Study Planner - Getting Started Checklist

## Pre-Setup (5 minutes)

- [ ] Have Node.js 18+ installed (`node --version` to check)
- [ ] Have npm installed (`npm --version` to check)
- [ ] Have a code editor ready (VS Code recommended)
- [ ] Create a free account at [supabase.com](https://supabase.com)
- [ ] Read through this checklist

## Step 1: Install Dependencies (2 minutes)

```bash
cd /home/abemelek/Documents/nextjs/studyplannerApp
npm install
```

Wait for installation to complete. This creates `node_modules/` folder.

- [ ] `npm install` completed successfully
- [ ] `node_modules/` folder created
- [ ] No major error messages in terminal

## Step 2: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign Up" and create account
3. Create a new project:
   - Project name: `study-planner` (or your choice)
   - Database password: Create a strong one and save it
   - Region: Choose nearest to you
   - Click "Create new project"
4. Wait for project to initialize (takes 1-2 minutes)

- [ ] Supabase account created
- [ ] New project created
- [ ] Project dashboard accessible

## Step 3: Get Supabase Credentials (2 minutes)

1. In Supabase dashboard, click **Settings** (bottom left)
2. Click **API** tab
3. You'll see:
   - **Project URL** - Copy this
   - **Anon (public) key** - Copy this
4. Save both somewhere safe (notepad, etc.)

- [ ] **Project URL** copied
- [ ] **Anon Key** copied
- [ ] Both credentials saved

## Step 4: Create Environment File (2 minutes)

In the project directory:

```bash
cp .env.local.example .env.local
```

Open `.env.local` in your editor and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=paste_your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here

# Optional - for AI plan generation
# AI_API_KEY=your_openai_api_key
# AI_PROVIDER=openai
```

**Note:** Leave `AI_API_KEY` commented out for now. The app works without it.

- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_SUPABASE_URL` filled in
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` filled in
- [ ] File saved

## Step 5: Set Up Database (3 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `DATABASE_SETUP.sql` from project folder
4. Copy the entire file content
5. Paste into Supabase SQL Editor
6. Click **Run** button
7. Wait for execution to complete

- [ ] SQL Editor opened
- [ ] DATABASE_SETUP.sql content copied
- [ ] Query executed successfully
- [ ] No error messages

**What was created:**
- `courses` table ✓
- `tasks` table ✓
- `study_sessions` table ✓
- Security policies ✓
- Indexes ✓

## Step 6: Verify Database Setup (2 minutes)

In Supabase, go to **Table Editor** (left sidebar):

- [ ] See `courses` table
- [ ] See `tasks` table
- [ ] See `study_sessions` table

Click on each table to see the schema is correct.

## Step 7: Start Development Server (1 minute)

In project directory:

```bash
npm run dev
```

You should see:
```
> study-planner@0.1.0 dev
> next dev

  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Environments: .env.local
```

- [ ] Development server started
- [ ] "Local: http://localhost:3000" message shown
- [ ] No error messages

## Step 8: Open App in Browser (1 minute)

1. Open browser (Chrome, Firefox, Safari, Edge)
2. Go to `http://localhost:3000`
3. You should see the landing page with "AI-Powered Study Planner"

- [ ] Landing page loads
- [ ] Can see title and feature cards
- [ ] Sign Up and Log In buttons visible

## Step 9: Test Authentication (3 minutes)

1. Click **Sign Up** button
2. Enter an email address: `test@example.com`
3. Enter a password: `Test123456` (must be 6+ chars)
4. Confirm password
5. Click **Sign Up**
6. Should see "Sign up successful! Redirecting to login..."
7. After redirect, login page shows
8. Enter same email and password
9. Click **Log In**
10. Should redirect to dashboard

- [ ] Sign up page works
- [ ] Can create account
- [ ] Login page works
- [ ] Can log in successfully
- [ ] Dashboard loads

## Step 10: Test Course Management (3 minutes)

1. After logging in, click **View Courses** (or go to `/courses`)
2. Click **+ New Course**
3. Fill in:
   - Course Name: `Test Course`
   - Course Code: `CS 101`
   - Select a color
   - Target Hours: `5`
4. Click **Save Course**
5. Should see course card on list
6. Click the course card to view details

- [ ] Create Course form works
- [ ] Course appears in list
- [ ] Course detail page loads
- [ ] Statistics section shows

## Step 11: Test Task Management (3 minutes)

1. On course detail page, click **+ New Task**
2. Fill in:
   - Title: `Test Task`
   - Type: `Homework`
   - Priority: `Medium`
   - Due Date: Pick tomorrow's date
   - Estimated Hours: `2`
3. Click **Save Task**
4. Task should appear in the list
5. Try clicking status buttons to change from "To Do" → "In Progress" → "Done"

- [ ] Create Task form works
- [ ] Task appears in list
- [ ] Status buttons work
- [ ] Task updates without page refresh

## Step 12: Test Dashboard (2 minutes)

1. Click **Dashboard** in navbar
2. You should see:
   - Stats cards (Total Tasks, Completed, This Week, Total Courses)
   - Upcoming Tasks section
   - Your test task should appear

- [ ] Dashboard loads
- [ ] Stats display correct numbers
- [ ] Test task appears in upcoming tasks
- [ ] Quick action buttons present

## Step 13: Test Tasks View (2 minutes)

1. Click **Tasks** in navbar
2. You should see your test task
3. Try filtering:
   - Select course filter
   - Select status filter
   - Change sort order
4. Filters should update the list

- [ ] Tasks page loads
- [ ] Test task visible
- [ ] Course filter works
- [ ] Status filter works
- [ ] Sort works

## Step 14: Test AI Planner (3 minutes)

1. Click **AI Planner** in navbar
2. You should see:
   - "Daily Study Hours" input
   - "Generate Plan with AI" button
   - Message saying "No plan generated yet"
3. Change daily hours to 3 (or leave as is)
4. Click **Generate Plan with AI**
5. Should see loading state "Generating plan…"
6. After a moment, should see weekly plan with days and tasks
7. Plan should be organized by days and courses

**Note:** First time might take 5-10 seconds as it generates the plan.

- [ ] AI Planner page loads
- [ ] Can input daily hours
- [ ] Generate button works
- [ ] Plan displays (even if just fallback)
- [ ] Shows structured weekly schedule

## Step 15: Test All Navigation (2 minutes)

1. Use navbar to navigate between:
   - Dashboard ✓
   - Courses ✓
   - Tasks ✓
   - AI Planner ✓
2. Each page should load and display data

- [ ] All navbar links work
- [ ] Can navigate between all pages
- [ ] No broken links

## Step 16: Test Logout (1 minute)

1. Click your email in top right
2. Click **Logout** button
3. Should be redirected to landing page
4. Try going to `/dashboard` - should redirect to `/login`

- [ ] Logout button works
- [ ] Logged out successfully
- [ ] Protected routes redirect to login

## 🎉 Congratulations! You're Done!

The app is fully set up and working. You can now:

✅ Create courses  
✅ Create tasks  
✅ Manage task status  
✅ View dashboard  
✅ Generate AI study plans  
✅ Filter and sort tasks  
✅ Log in and out  

## Next Steps

### If Everything Works:
1. Start using the app to manage your study tasks
2. Customize colors and courses for your needs
3. Generate study plans regularly
4. Explore the code to understand how it works

### Want to Add OpenAI Integration?
1. Get an API key from [openai.com](https://platform.openai.com/account/api-keys)
2. Add to `.env.local`:
   ```env
   AI_API_KEY=your_api_key_here
   ```
3. Restart dev server
4. AI plans will now use GPT-3.5 for smarter scheduling

### Want to Deploy?
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Connect your GitHub repo
4. Add environment variables
5. Deploy with one click

## Troubleshooting

### "Cannot find module" errors
**Solution:** Run `npm install` again
```bash
npm install
```

### Supabase connection errors
**Solution:** Check `.env.local`:
```bash
# Make sure these are correct:
NEXT_PUBLIC_SUPABASE_URL=your_actual_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key
```

### Page shows "Loading..." and doesn't change
**Solution:** 
1. Check browser console for errors (F12)
2. Check that you're logged in
3. Verify database setup was successful
4. Check `.env.local` variables

### Landing page works but dashboard is blank
**Solution:**
1. Try creating a course first
2. Try creating a task
3. Check browser console for errors
4. Make sure you're logged in

### "Not authenticated" or redirect to login
**Solution:**
1. Log out and log back in
2. Clear browser cookies for localhost
3. Try creating a new test account

### AI Planner shows "No tasks found"
**Solution:**
1. Go to courses and create a task first
2. Make sure task is not marked as "Done"
3. Generate plan again

## Questions or Issues?

1. Check the **README.md** for more details
2. Check browser console for error messages (F12)
3. Check Supabase dashboard for data
4. Verify `.env.local` variables are correct

---

## Quick Reference

### Important Files
- `app/` - All pages and routes
- `components/` - Reusable components
- `lib/types.ts` - TypeScript types
- `.env.local` - Your secrets (don't share!)
- `DATABASE_SETUP.sql` - Database schema

### Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality
```

### Key URLs
- App: `http://localhost:3000`
- Supabase: `https://supabase.com`
- OpenAI: `https://platform.openai.com`

---

**You're all set! Enjoy using Study Planner! 🎓**
