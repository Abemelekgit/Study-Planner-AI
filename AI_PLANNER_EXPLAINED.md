# 🤖 How the AI Study Planner Works

## **Simple Explanation**

The AI planner takes your tasks and **spreads them across the week** so you study at a sustainable pace.

### **What Happens When You Click "Generate Plan":**

1. **You input:** Daily study hours (e.g., 3 hours per day)
2. **The planner collects:** All your tasks with their titles and courses
3. **The AI distributes:** Tasks across Monday-Sunday, trying to fill your daily study time
4. **Result:** A visual table showing exactly what to study each day

---

## **Example Walkthrough**

### **Your Input:**
- **Daily Hours:** 3 hours/day
- **Your Tasks:**
  - Math: "Solve calculus problems" (2 hours)
  - Math: "Read chapter 5" (1.5 hours)
  - History: "Essay on WW2" (3 hours)
  - History: "Study dates" (1 hour)

### **What the Planner Does:**

```
Monday:     Math problems (2h) + History dates (1h) = 3h ✓
Tuesday:    Math reading (1.5h) + History essay (1.5h) = 3h ✓
Wednesday:  History essay continues (3h) = 3h ✓
Thursday-Sunday: (No more tasks)
```

### **The Result Table Shows:**
| Day | Course | Tasks | Duration |
|-----|--------|-------|----------|
| Monday | Math | ✓ Solve calculus problems, ✓ Read chapter 5 | 3.5h |
| Tuesday | History | ✓ Essay on WW2, ✓ Study dates | 4h |
| Wednesday | (empty or padded) | - | - |

---

## **How the Algorithm Works (Technical)**

### **Step 1: Collect Tasks**
- Takes all your tasks (except completed ones)
- Lists them in order

### **Step 2: Distribute Across Days**
- Loops through Monday → Sunday
- For each day, assigns tasks totaling ~3 hours (or your input value)
- Groups tasks by course (so Math tasks appear together)

### **Step 3: Create Blocks**
- A "study block" = a group of tasks for a course on a specific day
- Example block:
  ```
  Course: "Math 101"
  Tasks: ["Problem set 5", "Practice exam"]
  Duration: 2 hours
  ```

### **Step 4: Display**
- Shows the schedule in a **table** with:
  - Day of week
  - Course name
  - List of specific tasks
  - Duration in hours

---

## **Current Limitations**

❌ **What it does NOT do:**
1. **No AI analysis** (uses fallback algorithm, not OpenAI)
   - It's not "intelligent" — just distributes tasks evenly
   - Could add OpenAI later for smarter scheduling

2. **Doesn't prioritize**
   - Doesn't check which tasks are due soon vs. later
   - Just distributes all tasks equally

3. **Doesn't balance difficulty**
   - Doesn't put hard tasks early in the week
   - Just spreads them out

4. **Ignores estimated hours sometimes**
   - If a task says "2 hours" but your daily limit is "3 hours", it might group multiple tasks

---

## **What's Missing (Why It Might Feel "Not Smart")**

### **Problem 1: Not "AI" Yet**
- Current system: Simple **mathematical distribution**
- Real AI would: Analyze due dates, priority, difficulty, and create an intelligent schedule

### **Problem 2: All Tasks Treated Equally**
- Your urgent task due tomorrow = same as task due in 2 weeks
- A 10-minute task = same weight as a 3-hour project

### **Problem 3: No Smart Grouping**
- Doesn't say "Do reading before problems"
- Just shows tasks in the order they appear

---

## **How to Make It "Smarter"**

### **Option A: Enable OpenAI (Requires API Key)**
```
1. Get OpenAI API key from platform.openai.com
2. Add to .env.local:
   AI_API_KEY=sk-proj-xxxxx
3. Restart server
→ Now creates human-like, intelligent plans
```

### **Option B: Improve the Algorithm (No API Key Needed)**
```
Changes needed:
- Prioritize by due date (urgent tasks first)
- Prioritize by priority flag (high > medium > low)
- Respect task types (reading before problems)
- Suggest specific times (morning vs. afternoon)
```

---

## **What You're Actually Seeing**

### **Table Columns Explained:**

| Column | What It Means | Example |
|--------|---------------|---------|
| **Day** | Which day of the week | Monday, Tuesday, etc. |
| **Course** | Which class/subject | Math 101, History 201 |
| **Tasks** | What you need to do | ✓ Problem set, ✓ Reading |
| **Duration** | How many hours to spend | 3h, 1.5h, 2.5h |

### **Summary Stats Explained:**

- **Days Planned:** How many days have tasks (e.g., 3 days out of 7)
- **Study Sessions:** Total number of study blocks (e.g., 8 blocks)
- **Total Hours:** Sum of all hours (e.g., 15 hours total)
- **Courses:** How many different classes you're studying (e.g., 3 courses)

### **Daily Breakdown Explained:**

The progress bars show:
```
Monday:    ████████████░░ 3h / 3h target ✓ (Full)
Tuesday:   ████░░░░░░░░░░ 1.5h / 3h target ⚠ (Partial)
Wednesday: ░░░░░░░░░░░░░░ 0h / 3h target ✗ (Empty)
```

---

## **Real Example from Your App**

If you created:
- Course: **"Biology 101"**
- Task 1: **"Read chapter 3"** (1 hour)
- Task 2: **"Lab report"** (2 hours)
- Daily target: **3 hours**

### **Generated Plan Would Show:**

```
┌─────────┬──────────┬────────────────────┬──────────┐
│ Day     │ Course   │ Tasks              │ Duration │
├─────────┼──────────┼────────────────────┼──────────┤
│ Monday  │ Biology  │ ✓ Read chapter 3   │ 1h       │
│         │ Biology  │ ✓ Lab report       │ 2h       │
│ Tuesday │ (empty)  │ -                  │ -        │
│ ...     │ ...      │ ...                │ ...      │
└─────────┴──────────┴────────────────────┴──────────┘

📊 Summary:
  Days Planned: 1
  Study Sessions: 2
  Total Hours: 3h
  Courses: 1
```

---

## **Should You Use OpenAI?**

### **Without OpenAI (Current):**
✅ Free, no setup needed
✅ Simple, predictable schedule
❌ Not smart, treats all tasks the same

### **With OpenAI:**
✅ Intelligent, respects priorities
✅ Understands task types
✅ Creates natural study sequences
❌ Costs money (~$0.01 per plan)
❌ Needs API key setup

---

## **What You Should Expect**

1. **Generator creates a plan** → Takes 1-3 seconds
2. **Shows table with schedule** → Monday-Sunday with your tasks
3. **Stats cards display** → Shows how much you're studying
4. **Daily bars show balance** → Visual check if load is fair

**The planner is working correctly if:**
- Tasks are spread across the week ✓
- Total hours match your input ✓
- Each day has ~3 hours (or your target) ✓
- Tasks are organized by course ✓

---

## **Next Steps to Improve**

Would you like me to:

1. **Enable OpenAI** → (Need your API key)
2. **Improve algorithm** → Add priority sorting, due-date awareness
3. **Add more features** → Export to PDF, email reminders, repeat plans
4. **Change display** → Time-of-day suggestions, difficulty ratings

Let me know which one you'd prefer!

Tip: You can save generated plans locally in the app and export them as a text file — this helps keep snapshots before making changes.
