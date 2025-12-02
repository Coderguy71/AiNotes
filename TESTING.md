# StudyForge Testing Guide

This document provides a comprehensive manual QA checklist for testing all StudyForge functionality.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Resetting State](#resetting-state)
3. [XP Integration Tests](#xp-integration-tests)
4. [Level Progression Tests](#level-progression-tests)
5. [Upgrade System Tests](#upgrade-system-tests)
6. [Mission System Tests](#mission-system-tests)
7. [Daily Streak Tests](#daily-streak-tests)
8. [Passive XP Tests](#passive-xp-tests)
9. [Settings Tests](#settings-tests)
10. [UI/UX Tests](#uiux-tests)
11. [Activity Log Tests](#activity-log-tests)
12. [Edge Cases](#edge-cases)
13. [Performance Tests](#performance-tests)
14. [Accessibility Tests](#accessibility-tests)

---

## Quick Start

### Testing Pages

1. **Main App**: `http://localhost:3000` - Test XP integration in real workflow
2. **StudyForge Hub**: `http://localhost:3000/studyforge` - Test upgrades, missions, settings
3. **Test Console**: `http://localhost:3000/studyforge-test` - Manual testing with state visibility

### Browser DevTools

Open DevTools (F12) to:
- Monitor console logs for StudyForge operations
- Inspect IndexedDB: Application → IndexedDB → EasyNotesAI → studyForge
- Check network requests for API calls
- View React component state with React DevTools

---

## Resetting State

To start fresh for testing:

### Method 1: Clear IndexedDB (Recommended)
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **EasyNotesAI**
4. Right-click **EasyNotesAI** database
5. Select **Delete database**
6. Refresh page (F5)

### Method 2: Browser Clear Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check **IndexedDB**
5. Click **Clear site data**
6. Refresh page (F5)

### Method 3: Incognito/Private Window
- Open new incognito/private window
- Navigate to app
- Fresh state automatically

---

## XP Integration Tests

Test all points where users earn XP. Each test should verify:
- XP badge appears with correct amount
- Toast notification shows
- XP is added to state (check StudyForge test page)
- Mission progress increments (if applicable)

### ✅ Transform Notes (15 XP)

**Location**: Home page (`/`)

**Steps**:
1. Enter text in input field
2. Click "Generate" button
3. Wait for output to appear
4. Verify "+15 XP" badge appears in top-right corner of output card
5. Verify toast notification: "Generated notes! (+15 XP)"
6. Navigate to `/studyforge-test` and verify `totalXP` increased by 15 (or more with multipliers)
7. Check that 'create_notes' mission progress incremented by 1

**Expected Results**:
- [ ] Badge appears and fades after 3 seconds
- [ ] Toast notification appears
- [ ] XP added to state
- [ ] Mission progress increments

---

### ✅ Save Note to History (50 XP)

**Location**: Home page (`/`) - Smart Structure Card

**Steps**:
1. Generate notes (follow "Transform Notes" test above)
2. Wait for Smart Structure card to appear below output
3. Expand card if collapsed
4. Click "Save to History" button
5. Verify "+50 XP" badge appears next to button
6. Verify toast notification: "Note saved successfully! (+50 XP)"
7. Navigate to `/studyforge-test` and verify `totalXP` increased by 50 (or more)
8. Check that 'create_notes' mission progress incremented by 1

**Expected Results**:
- [ ] Badge appears and fades after 3 seconds
- [ ] Toast notification appears
- [ ] Button changes to "Saved ✓" state
- [ ] XP added to state
- [ ] Mission progress increments
- [ ] Note appears in dashboard history

---

### ✅ Generate Flashcard Set (40 XP)

**Location**: Dashboard page (`/dashboard`)

**Prerequisites**: At least one saved note in history

**Steps**:
1. Navigate to `/dashboard`
2. Scroll to "Recent Notes" section
3. Expand a note by clicking on it
4. Click the flashcard icon button (dusty-mauve)
5. Wait for flashcard generation
6. Verify toast notification: "Generated 10 flashcards! (+65 XP)" (40 + 25)
7. Verify automatic redirect to flashcard viewer
8. Navigate to `/studyforge-test` and verify `totalXP` increased by 65 (or more)
9. Check that 'generate_flashcards' mission progress incremented by 1

**Expected Results**:
- [ ] Toast shows combined XP (40 + 25 = 65 XP)
- [ ] Redirect to flashcard viewer
- [ ] XP added to state
- [ ] Mission progress increments
- [ ] Flashcard set appears in `/flashcards` list

---

### ✅ Save Flashcard Set (25 XP)

**Location**: Flashcard viewer (`/flashcards/[id]`)

**Prerequisites**: Unsaved flashcard set (generated from dashboard but not explicitly saved)

**Steps**:
1. Navigate to an unsaved flashcard set
2. Click "Save Set" button (sage-green, top-right area)
3. Verify toast notification: "Flashcard set saved! (+25 XP)"
4. Verify button changes to disabled "Saved ✓" state
5. Navigate to `/studyforge-test` and verify `totalXP` increased by 25 (or more)

**Expected Results**:
- [ ] Toast notification appears
- [ ] Button becomes disabled
- [ ] XP added to state
- [ ] Set persists in `/flashcards` list

**Note**: If set is already saved (e.g., generated from dashboard), button will be disabled from start.

---

### ✅ Review Flashcard - Mark as Known (10 XP)

**Location**: Flashcard viewer (`/flashcards/[id]`)

**Prerequisites**: Any flashcard set

**Steps**:
1. Navigate to any flashcard set
2. Click "I knew this" button (sage-green, large button below card)
3. Verify "+10 XP" floating indicator appears above card
4. Verify XP sound effect plays (if sound enabled)
5. Verify card auto-advances after 1.5 seconds
6. Verify session XP counter increments in metadata panel
7. Repeat for 5 different cards
8. Navigate to `/studyforge-test` and verify `totalXP` increased by 50+ (10 × 5)
9. Check that 'review_flashcards' mission progress incremented by 5

**Expected Results**:
- [ ] Floating indicator appears
- [ ] Sound effect plays (if enabled)
- [ ] Auto-advance after 1.5s
- [ ] Session XP counter updates
- [ ] XP added to state
- [ ] Mission progress increments
- [ ] Card marked (button shows "Already Reviewed ✓" on return)

---

### ✅ Keyboard Shortcut - Mark as Known (K key)

**Location**: Flashcard viewer (`/flashcards/[id]`)

**Steps**:
1. Navigate to any flashcard set
2. Press **K** key on keyboard
3. Verify same results as clicking "I knew this" button
4. Press **K** again on the same card
5. Verify no additional XP awarded (button shows "Already Reviewed ✓")

**Expected Results**:
- [ ] K key triggers mark as known
- [ ] Same XP and animations as button click
- [ ] Cannot mark same card twice

---

## Level Progression Tests

### ✅ Level Up Trigger

**Steps**:
1. Reset state (see "Resetting State" above)
2. Navigate to `/studyforge-test`
3. Click "Award 100 XP" button repeatedly until level increases
4. Verify LevelUpModal appears with confetti
5. Verify toast notification: "Level up! You're now level X"
6. Verify level badge updates in StudyForge header
7. Verify progress bar resets to 0% and starts filling for next level

**Expected Results**:
- [ ] Modal appears when level threshold reached
- [ ] Confetti animation plays (if enabled)
- [ ] Toast notification
- [ ] Level badge updates
- [ ] Progress bar resets
- [ ] Activity log shows level-up entry

---

### ✅ XP Progress Bar

**Location**: StudyForge header on any page

**Steps**:
1. Navigate to any page
2. Observe XP progress bar in header (or `/studyforge` page)
3. Perform action that awards XP (e.g., transform notes)
4. Verify progress bar advances smoothly
5. Verify percentage label updates
6. Verify "X / Y XP" label shows correct values

**Expected Results**:
- [ ] Progress bar fills proportionally
- [ ] Percentage updates in real-time
- [ ] Labels show correct XP values
- [ ] Smooth animation (respects prefers-reduced-motion)

---

### ✅ XP Curve Accuracy

**Steps**:
1. Reset state
2. Navigate to `/studyforge-test`
3. Verify "XP Curve Reference" section shows:
   - Level 1: 100 XP
   - Level 2: 283 XP
   - Level 3: 520 XP
   - Level 5: 1,118 XP
   - Level 10: 3,162 XP
4. Award XP until each level and verify thresholds are correct

**Expected Results**:
- [ ] Level thresholds match formula: 100 × (level^1.5)
- [ ] Progress bar shows correct percentage at each stage

---

## Upgrade System Tests

### ✅ Purchase Upgrade

**Location**: `/studyforge` - Shop section

**Steps**:
1. Ensure you have at least 100 XP (award via test page if needed)
2. Navigate to `/studyforge`
3. Scroll to "Shop" section
4. Click "Buy" on "Note Mastery I" (100 XP)
5. Verify button changes to "Owned"
6. Verify toast notification: "Purchased Note Mastery I!"
7. Verify `availableXP` decreased by 100
8. Verify "Owned" badge appears on card
9. Verify multiplier increases (check `/studyforge-test` multiplier breakdown)

**Expected Results**:
- [ ] Purchase successful
- [ ] XP deducted
- [ ] Button state changes
- [ ] Toast appears
- [ ] Multiplier updates

---

### ✅ Prerequisites Enforcement

**Steps**:
1. Navigate to `/studyforge`
2. Scroll to "Shop" section
3. Find "Note Mastery II" (requires Note Mastery I)
4. Verify red ✗ badge shows "Note Mastery I" requirement
5. Verify button is disabled if Note Mastery I not owned
6. Purchase Note Mastery I
7. Verify Note Mastery II now shows green ✓ badge
8. Verify Note Mastery II button becomes enabled (if affordable)

**Expected Results**:
- [ ] Prerequisites shown as badges
- [ ] Button disabled when prerequisites not met
- [ ] Button enabled after prerequisites purchased
- [ ] Visual feedback (✗ → ✓) updates in real-time

---

### ✅ Insufficient XP

**Steps**:
1. Reset state (you'll have 0 XP)
2. Navigate to `/studyforge`
3. Verify all upgrade buttons are disabled
4. Verify button shows disabled state (opacity, cursor)
5. Try clicking a disabled button
6. Verify nothing happens (no error, no purchase)

**Expected Results**:
- [ ] Buttons disabled when XP insufficient
- [ ] No error on click
- [ ] Visual disabled state

---

### ✅ Multiplier Stacking

**Steps**:
1. Purchase multiple multiplier upgrades:
   - Note Mastery I (+10%)
   - Flashcard Grinder I (+20%)
   - Review Efficiency I (+12%)
2. Navigate to `/studyforge-test`
3. Check "Multiplier Breakdown" section
4. Verify "Upgrades" shows 0.42 (10% + 20% + 12%)
5. Verify "Total" shows 1.42 (1.0 base + 0.42 upgrades)
6. Award 50 XP
7. Verify effective XP = 50 × 1.42 = 71 XP

**Expected Results**:
- [ ] Multipliers stack additively
- [ ] Breakdown shows correct values
- [ ] Effective XP calculation is accurate

---

### ✅ Passive XP Upgrades

**Steps**:
1. Purchase "Small Furnace" (200 XP)
2. Navigate to `/studyforge`
3. Verify header shows "0.5 XP/sec" passive rate
4. Close browser tab
5. Wait 60 seconds
6. Reopen tab and navigate to `/studyforge`
7. Verify "Collect Idle XP" button shows ~30 XP pending
8. Click "Collect Idle XP"
9. Verify XP added to state
10. Purchase "Bigger Furnace" (800 XP)
11. Verify passive rate increases to "2.0 XP/sec" (0.5 + 1.5)

**Expected Results**:
- [ ] Passive rate displays correctly
- [ ] Idle XP accumulates while away
- [ ] Collection button appears when pendingIdleXP > 0
- [ ] Rates stack additively (0.5 + 1.5 = 2.0)

---

### ✅ Theme Unlock

**Steps**:
1. Purchase "Mindforge Theme Pack" (600 XP)
2. Navigate to `/studyforge`
3. Scroll to "Owned Themes" section
4. Verify "Mindforge Dark" card is now unlocked
5. Click on "Mindforge Dark" card
6. Verify theme selection toast appears
7. Verify theme in `ownedThemes` array (DevTools or test page)

**Expected Results**:
- [ ] Theme unlocks after purchase
- [ ] Theme card shows "Active" or clickable state
- [ ] Theme persists across sessions
- [ ] Settings update correctly

---

### ✅ Auto-Collect Upgrade

**Steps**:
1. Purchase "Small Furnace" (200 XP)
2. Close and reopen app
3. Verify "Collect Idle XP" button appears
4. Purchase "Auto-Collect" (1000 XP)
5. Close browser tab
6. Wait 60 seconds
7. Reopen app
8. Verify idle XP automatically credited (no button)
9. Verify toast: "Collected X idle XP"
10. Verify no "Collect Idle XP" button (auto-collected)

**Expected Results**:
- [ ] Auto-collect eliminates manual collection
- [ ] Toast notification on auto-collection
- [ ] XP credited immediately on app load
- [ ] Button does not appear

---

## Mission System Tests

### ✅ Daily Mission Display

**Location**: `/studyforge` - Daily Missions section

**Steps**:
1. Navigate to `/studyforge`
2. Verify 3 missions are displayed
3. Verify each mission shows:
   - Icon (📝, 🎴, 👀, ⭐, 📅, or 🔥)
   - Title and description
   - Progress bar (0/target initially)
   - Reward XP amount
   - Claim button (disabled)

**Expected Results**:
- [ ] 3 missions displayed
- [ ] All mission data visible
- [ ] Progress bar at 0%
- [ ] Claim button disabled

---

### ✅ Mission Progress Tracking

**Steps**:
1. Check which missions are active (e.g., "Create 3 notes")
2. Perform action linked to mission:
   - Create notes: Transform and save notes
   - Generate flashcards: Generate flashcard sets
   - Review flashcards: Mark cards as known
3. Return to `/studyforge`
4. Verify mission progress bar updated
5. Verify progress label shows "X/Y"

**Expected Results**:
- [ ] Progress increments automatically
- [ ] Progress bar fills proportionally
- [ ] Label updates in real-time (may need refresh)

---

### ✅ Mission Completion and Claiming

**Steps**:
1. Complete a mission (e.g., create 3 notes)
2. Navigate to `/studyforge`
3. Verify progress shows "3/3" (or target)
4. Verify progress bar is full (100%)
5. Verify "Claim" button is enabled (sage-green)
6. Click "Claim" button
7. Verify toast notification: "Mission completed! +X XP"
8. Verify button changes to "Claimed ✓"
9. Verify XP added to state

**Expected Results**:
- [ ] Claim button enables at 100% progress
- [ ] Toast appears on claim
- [ ] XP awarded (no multipliers for mission rewards)
- [ ] Button shows "Claimed" state
- [ ] Activity log shows mission completion

---

### ✅ Mission Reset at Midnight

**Prerequisites**: Ability to change system time or wait until midnight

**Steps**:
1. Note current missions
2. Complete at least one mission
3. Change system time to next day (or wait until midnight)
4. Refresh page
5. Verify new set of 3 missions (different from previous)
6. Verify all progress bars reset to 0/target
7. Verify claimed missions are now new unclaimed missions

**Expected Results**:
- [ ] Missions reset at midnight local time
- [ ] New random selection from pool
- [ ] All progress reset to 0
- [ ] Old claimed missions replaced

---

### ✅ Earn XP Mission (Special Tracking)

**Steps**:
1. Check if "XP Hunter" mission is active (Earn 100 XP)
2. If not, reset state and reload until it appears
3. Award XP through any action (e.g., transform notes)
4. Navigate to `/studyforge`
5. Verify "XP Hunter" progress increased by effective XP amount
6. Continue earning XP until reaching 100 XP
7. Claim mission and verify reward

**Expected Results**:
- [ ] Mission tracks ALL XP gains (not just specific actions)
- [ ] Progress reflects effective XP (after multipliers)
- [ ] Completable through any XP source

---

## Daily Streak Tests

### ✅ Streak Increment

**Prerequisites**: Clean state (0 streak)

**Steps**:
1. Reset state
2. Perform any XP-earning action (e.g., transform notes)
3. Navigate to `/studyforge`
4. Verify streak badge shows "1 day"
5. Change system time to next day
6. Perform another XP-earning action
7. Verify streak badge shows "2 days"
8. Repeat for 3+ days

**Expected Results**:
- [ ] Streak starts at 1 on first XP earn
- [ ] Streak increments on consecutive days
- [ ] Streak badge displays correct number

---

### ✅ Streak Maintenance (Same Day)

**Steps**:
1. Earn XP to start a streak
2. Earn XP again on the same day
3. Verify streak does NOT increment twice
4. Verify streak stays at current value

**Expected Results**:
- [ ] Streak only increments once per day
- [ ] Multiple XP gains on same day maintain streak

---

### ✅ Streak Reset (Broken Streak)

**Steps**:
1. Establish a 3-day streak
2. Change system time to 3 days later (skip 2 days)
3. Earn XP
4. Verify streak resets to 1
5. Verify toast notification (if applicable)

**Expected Results**:
- [ ] Streak resets to 1 after missing a day
- [ ] No penalty, just reset
- [ ] User notified of reset

---

### ✅ Streak Booster Upgrade

**Steps**:
1. Establish a 3-day streak
2. Purchase "Streak Booster" upgrade (400 XP)
3. Verify multiplier breakdown shows streak bonus
4. Award 50 XP
5. Verify effective XP = 50 × 2.0 = 100 XP (base + upgrade bonuses + streak)
6. Drop streak below 3 (reset state or skip days)
7. Award 50 XP
8. Verify NO streak multiplier applied

**Expected Results**:
- [ ] Streak Booster grants 2x when streak ≥ 3
- [ ] Multiplier breakdown shows "Streak: 1.0" (100%)
- [ ] No bonus when streak < 3
- [ ] Stacks with upgrade multipliers

---

## Passive XP Tests

### ✅ Idle XP Accumulation (No Auto-Collect)

**Prerequisites**: Small Furnace purchased, Auto-Collect NOT purchased

**Steps**:
1. Purchase "Small Furnace" (0.5 XP/sec)
2. Close browser tab
3. Wait 120 seconds (2 minutes)
4. Reopen app
5. Navigate to `/studyforge`
6. Verify "Collect Idle XP" button shows ~60 XP pending
7. Verify button pulses (animated)
8. Click button
9. Verify toast: "Collected 60 idle XP!"
10. Verify XP added to state
11. Verify button disappears

**Expected Results**:
- [ ] Idle XP accumulates at correct rate (0.5 XP/sec)
- [ ] Button appears when pendingIdleXP > 0
- [ ] Manual collection required
- [ ] XP credited on collection

---

### ✅ Idle XP Cap (24 Hours)

**Steps**:
1. Purchase "Small Furnace" (0.5 XP/sec)
2. Set `lastActiveAt` to 48 hours ago (DevTools → IndexedDB)
3. Refresh page
4. Verify idle XP capped at 43,200 XP (24 hours × 0.5 XP/sec × 3600 sec/hr)
5. Verify no XP beyond 24 hours awarded

**Expected Results**:
- [ ] Idle XP capped at 24 hours
- [ ] Calculation: 86,400 seconds × passiveXPPerSec
- [ ] No "infinite" XP exploit

---

### ✅ Auto-Collect Behavior

**Prerequisites**: Small Furnace + Auto-Collect purchased

**Steps**:
1. Purchase "Small Furnace" and "Auto-Collect"
2. Close browser tab
3. Wait 60 seconds
4. Reopen app
5. Verify NO "Collect Idle XP" button
6. Verify toast: "Collected X idle XP!" appears on load
7. Verify XP immediately added to state
8. Check activity log for idle XP entry

**Expected Results**:
- [ ] XP auto-credited on app load
- [ ] No manual button required
- [ ] Toast notification appears
- [ ] Activity log tracks auto-collection

---

## Settings Tests

### ✅ Sound Toggle

**Location**: `/studyforge` - Settings panel (gear icon)

**Steps**:
1. Navigate to `/studyforge`
2. Click gear icon (⚙) in header
3. Toggle "Sound Effects" to OFF
4. Navigate to `/flashcards/[id]`
5. Mark a card as known
6. Verify NO sound plays
7. Return to `/studyforge`
8. Toggle "Sound Effects" to ON
9. Mark another card as known
10. Verify sound DOES play

**Expected Results**:
- [ ] Sound toggle works immediately (no refresh needed)
- [ ] XP chime respects setting
- [ ] Setting persists across sessions

---

### ✅ Notifications Toggle

**Steps**:
1. Navigate to `/studyforge` → Settings
2. Toggle "Notifications" to OFF
3. Award XP (transform notes, etc.)
4. Verify NO toast notifications appear
5. Verify NO level-up modal appears (if leveling up)
6. Verify NO floating XP indicators (in flashcard viewer)
7. Toggle "Notifications" to ON
8. Award XP
9. Verify toasts and indicators appear

**Expected Results**:
- [ ] Notifications toggle disables:
  - XP toasts
  - Level-up modal
  - Floating XP indicators
- [ ] XP still awarded (just no visual feedback)
- [ ] Re-enabling shows feedback again

---

### ✅ Confetti Toggle

**Steps**:
1. Navigate to `/studyforge` → Settings
2. Toggle "Confetti Effects" to OFF
3. Award enough XP to level up
4. Verify level-up modal appears WITHOUT confetti
5. Toggle "Confetti Effects" to ON
6. Award XP to level up again
7. Verify level-up modal WITH confetti

**Expected Results**:
- [ ] Confetti toggle controls CSS animation
- [ ] Modal still appears (just no confetti)
- [ ] Setting persists

---

### ✅ Theme Selection

**Steps**:
1. Navigate to `/studyforge` → Owned Themes
2. Click on "Default Light" theme card
3. Verify active badge appears on card
4. Verify toast: "Theme changed to Default Light"
5. Unlock and select "Mindforge Dark"
6. Verify active badge moves to new theme
7. Refresh page
8. Verify theme persists

**Expected Results**:
- [ ] Theme selection works instantly
- [ ] Active badge shows current theme
- [ ] Setting persists across sessions

---

## UI/UX Tests

### ✅ StudyForgeNavLink Badge

**Location**: Header of all major pages (home, dashboard, flashcards)

**Steps**:
1. Ensure you have pending idle XP (close app and reopen after 60s)
2. Navigate to home page
3. Verify StudyForge link shows badge with pendingIdleXP amount
4. Verify badge has terracotta background and pulses
5. Collect idle XP
6. Verify badge changes to "Lv X" (current level)
7. Verify badge has sage-green background

**Expected Results**:
- [ ] Badge shows pending XP when available
- [ ] Badge shows level when no pending XP
- [ ] Pulse animation on pending XP badge
- [ ] Consistent across all pages

---

### ✅ XP Toast Notifications

**Steps**:
1. Perform any XP-earning action
2. Verify toast appears in top-right corner
3. Verify toast shows:
   - Message with action description
   - XP amount (e.g., "+15 XP")
   - Sage-green to soft-pink gradient background
   - Slide-in animation from right
4. Wait 3 seconds
5. Verify toast auto-dismisses with slide-out animation

**Expected Results**:
- [ ] Toast appears on all XP gains
- [ ] Correct XP amount shown (after multipliers)
- [ ] Auto-dismiss after 3 seconds
- [ ] Smooth animations

---

### ✅ Level-Up Modal

**Steps**:
1. Award XP to trigger level up
2. Verify full-screen modal appears
3. Verify modal shows:
   - "Level Up!" heading
   - New level number
   - Confetti animation (if enabled)
   - "Continue" button
4. Click "Continue" or wait 5 seconds
5. Verify modal auto-dismisses
6. Verify modal can be manually dismissed before timer

**Expected Results**:
- [ ] Modal appears immediately on level up
- [ ] Confetti respects settings
- [ ] Auto-dismiss after 5 seconds
- [ ] Manual dismiss works

---

### ✅ XPFloatingBadge (Inline Indicator)

**Locations**: Home page (transform notes), SmartStructureCard (save note)

**Steps**:
1. Transform notes on home page
2. Verify "+15 XP" badge appears in top-right of output card
3. Verify badge has gradient background
4. Verify fade + scale animation
5. Wait 3 seconds
6. Verify badge disappears

**Expected Results**:
- [ ] Badge appears on action completion
- [ ] Correct XP amount shown
- [ ] Smooth animation
- [ ] Auto-hides after 3s

---

### ✅ FloatingXPIndicator (Card Indicator)

**Location**: Flashcard viewer mastery controls

**Steps**:
1. Navigate to flashcard viewer
2. Mark card as known
3. Verify "+10 XP" indicator appears ABOVE card
4. Verify gradient background
5. Verify slide-up + fade animation
6. Wait 3 seconds
7. Verify indicator disappears

**Expected Results**:
- [ ] Indicator positioned correctly
- [ ] Respects notificationsEnabled setting
- [ ] Respects enableAnimations prop
- [ ] Auto-hides after 3s

---

### ✅ Activity Feed

**Location**: `/studyforge` - Activity Feed section

**Steps**:
1. Perform various actions to populate log:
   - Award XP
   - Level up
   - Purchase upgrade
   - Claim mission
2. Navigate to `/studyforge`
3. Scroll to "Activity Feed"
4. Verify last 10 entries shown (newest first)
5. Verify each entry shows:
   - Timestamp
   - Type icon (✨, 🎉, 🛒, ✅)
   - Message
   - XP amount (if applicable)
6. Click "Export CSV"
7. Verify CSV downloads with correct data

**Expected Results**:
- [ ] Last 10 entries displayed
- [ ] Correct order (newest first)
- [ ] Icons and formatting correct
- [ ] CSV export works
- [ ] CSV opens in Excel with UTF-8 encoding

---

## Activity Log Tests

### ✅ Activity Logging

**Steps**:
1. Perform multiple actions:
   - Award XP (any source)
   - Level up (award enough XP)
   - Purchase upgrade
   - Claim mission
2. Check activity log (DevTools → IndexedDB → studyForge → activityLog)
3. Verify each action creates a log entry with:
   - `timestamp` (ISO string)
   - `type` ('xp_earned', 'level_up', 'upgrade_purchased', 'mission_completed')
   - `message` (human-readable description)
   - `xpAmount` (for XP-related entries)
   - `level` (for level-up entries)

**Expected Results**:
- [ ] All actions logged correctly
- [ ] Correct entry types
- [ ] Timestamps accurate
- [ ] Log capped at 10 entries (oldest removed)

---

### ✅ CSV Export Content

**Steps**:
1. Populate activity log with various events
2. Navigate to `/studyforge`
3. Click "Export CSV" in Activity Feed
4. Open downloaded CSV in text editor
5. Verify headers: "Timestamp,Type,Message,XP Amount,Level"
6. Verify UTF-8 BOM present (first 3 bytes: EF BB BF)
7. Open CSV in Excel
8. Verify proper formatting (no garbled characters)

**Expected Results**:
- [ ] CSV format correct
- [ ] UTF-8 BOM ensures Excel compatibility
- [ ] All fields properly escaped (commas, quotes, newlines)
- [ ] Timestamp in ISO format

---

## Edge Cases

### ✅ Zero XP Award

**Steps**:
1. Navigate to `/studyforge-test`
2. Click "Award 0 XP"
3. Verify no errors in console
4. Verify state unchanged
5. Verify no toast appears

**Expected Results**:
- [ ] Handles 0 XP gracefully
- [ ] No errors
- [ ] No visual feedback (correct behavior)

---

### ✅ Negative XP Award (Should Fail)

**Steps**:
1. Open DevTools console
2. Run: `awardXP(-50, 'Test')`
3. Verify error or clamped to 0
4. Verify XP does not decrease

**Expected Results**:
- [ ] Negative XP rejected or clamped
- [ ] State integrity maintained
- [ ] No exploit possible

---

### ✅ Double Purchase Prevention

**Steps**:
1. Purchase an upgrade (e.g., Note Mastery I)
2. Try to purchase again (via test page or UI)
3. Verify purchase rejected
4. Verify XP not deducted twice
5. Verify console warning logged

**Expected Results**:
- [ ] Second purchase blocked
- [ ] XP not deducted
- [ ] UI shows "Owned" state
- [ ] Console logs warning

---

### ✅ Mission Double Claim Prevention

**Steps**:
1. Complete a mission
2. Claim the mission
3. Try to claim again (via test page)
4. Verify claim rejected
5. Verify XP not awarded twice
6. Verify console warning logged

**Expected Results**:
- [ ] Second claim blocked
- [ ] XP not awarded twice
- [ ] UI shows "Claimed" state
- [ ] Console logs warning

---

### ✅ Simultaneous XP Awards

**Steps**:
1. Open DevTools console
2. Run multiple awardXP() calls in quick succession:
   ```javascript
   awardXP(10, 'Test 1');
   awardXP(20, 'Test 2');
   awardXP(30, 'Test 3');
   ```
3. Verify all XP awards processed
4. Verify final state shows sum of all awards
5. Verify no race conditions

**Expected Results**:
- [ ] All awards processed correctly
- [ ] No lost XP
- [ ] State consistency maintained

---

### ✅ Very High XP Values

**Steps**:
1. Navigate to `/studyforge-test`
2. Award 1,000,000 XP
3. Verify level calculated correctly (should be very high)
4. Verify no overflow errors
5. Verify UI handles large numbers gracefully

**Expected Results**:
- [ ] Large XP values handled
- [ ] Level calculation accurate
- [ ] No JavaScript number limits hit
- [ ] UI displays large numbers without breaking

---

## Performance Tests

### ✅ Database Write Performance

**Steps**:
1. Open DevTools Performance tab
2. Start recording
3. Award XP 50 times rapidly (use test page loop)
4. Stop recording
5. Analyze for:
   - Frame drops
   - Long tasks (>50ms)
   - IndexedDB write bottlenecks

**Expected Results**:
- [ ] No significant UI lag
- [ ] Writes batched or throttled appropriately
- [ ] App remains responsive

---

### ✅ Event Bus Scaling

**Steps**:
1. Subscribe 10 event listeners (use console):
   ```javascript
   for (let i = 0; i < 10; i++) {
     subscribeStudyForge(e => console.log(i, e));
   }
   ```
2. Award XP
3. Verify all listeners called
4. Verify no performance degradation

**Expected Results**:
- [ ] All listeners notified
- [ ] No duplicate events
- [ ] Minimal overhead

---

## Accessibility Tests

### ✅ Keyboard Navigation

**Steps**:
1. Navigate to `/studyforge`
2. Use **Tab** key to navigate through interactive elements
3. Verify focus indicators visible on:
   - Upgrade buy buttons
   - Mission claim buttons
   - Settings toggles
   - Theme cards
4. Press **Enter** or **Space** to activate focused element
5. Verify actions trigger correctly

**Expected Results**:
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible
- [ ] Enter/Space triggers actions
- [ ] Focus order logical

---

### ✅ Screen Reader Compatibility

**Steps**:
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate to `/studyforge`
3. Verify screen reader announces:
   - Current level and XP
   - Upgrade names and costs
   - Mission progress
   - Button states (disabled, owned, claimed)
4. Verify ARIA labels present on icon-only buttons

**Expected Results**:
- [ ] All content announced
- [ ] ARIA labels correct
- [ ] Button states communicated
- [ ] No "clickable" divs (use buttons)

---

### ✅ Color Contrast

**Steps**:
1. Use DevTools Lighthouse audit
2. Run accessibility audit
3. Verify no color contrast issues
4. Check key areas:
   - Badge text on backgrounds
   - Button text on gradients
   - Disabled button text

**Expected Results**:
- [ ] All text meets WCAG AA (4.5:1 for normal text)
- [ ] Important UI meets WCAG AAA (7:1 for critical text)
- [ ] Lighthouse accessibility score ≥90

---

### ✅ Reduced Motion Preferences

**Steps**:
1. Open OS accessibility settings
2. Enable "Reduce motion" preference
3. Refresh app
4. Verify animations disabled or simplified:
   - XP badges fade without scale
   - Level-up modal appears without elaborate animation
   - Progress bars transition instantly
   - Confetti disabled (even if setting ON)

**Expected Results**:
- [ ] Respects prefers-reduced-motion
- [ ] Core functionality unaffected
- [ ] Smooth experience without motion

---

## Summary Checklist

Use this high-level checklist for regression testing:

### Core Features
- [ ] All 5 XP integration points work (transform, save, generate, save set, review)
- [ ] Level progression triggers correctly
- [ ] All 9 upgrades purchasable and functional
- [ ] Daily missions track progress and award rewards
- [ ] Daily streaks increment and reset correctly
- [ ] Passive XP accumulates and collects

### UI/UX
- [ ] All toasts and modals appear as expected
- [ ] XP badges and indicators show correct amounts
- [ ] Activity feed displays and exports correctly
- [ ] Settings panel toggles work
- [ ] Navigation badge shows pending XP / level

### Data Integrity
- [ ] IndexedDB saves state correctly
- [ ] State persists across sessions
- [ ] No data loss on refresh
- [ ] Activity log caps at 10 entries

### Edge Cases
- [ ] No double purchases/claims
- [ ] Negative XP rejected
- [ ] Large XP values handled
- [ ] Simultaneous awards processed correctly

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen readers announce content
- [ ] Color contrast meets standards
- [ ] Reduced motion respected

---

**Last Updated**: December 2024  
**Maintainer**: EasyNotesAI Team
