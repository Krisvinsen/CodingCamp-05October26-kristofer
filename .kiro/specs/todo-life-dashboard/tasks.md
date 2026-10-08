# Implementation Plan: To-Do List Life Dashboard

## Overview

Build the Dashboard as three static files — `index.html`, `css/style.css`, and `js/script.js` — with no build step and no external dependencies. Implementation progresses module by module, wiring everything together at the end. Each task builds directly on the previous ones so no code is left orphaned.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - [x] 1.1 Create folder structure and base `index.html`
    - Create `css/` and `js/` subdirectories
    - Write the `index.html` skeleton: `<!DOCTYPE html>`, `<html lang="en" data-theme="light">`, `<head>` with charset/viewport/title, `<link>` to `css/style.css`, `<script defer>` to `js/script.js`
    - Add placeholder `<section>` elements with the correct IDs for each widget: `#greeting-widget`, `#timer-widget`, `#task-widget`, `#quick-links-widget`, `#theme-toggle-widget`
    - _Requirements: 15.1, 15.2, 15.3_
  - [x] 1.2 Populate full HTML markup for all widgets
    - **Greeting widget:** `#clock`, `#date-display`, `#greeting-text`, `#name-input`, `#name-save-btn`
    - **Timer widget:** `#timer-display`, `#timer-start`, `#timer-stop`, `#timer-reset`
    - **Task widget:** `#task-input`, `#task-add-btn`, `#task-validation-msg`, `#task-list` (`<ul>`)
    - **Quick-links widget:** `#link-label-input`, `#link-url-input`, `#link-add-btn`, `#link-validation-msg`, `#quick-links-panel`
    - **Theme toggle:** a `<button id="theme-toggle-btn">` visible at all times
    - _Requirements: 1.1, 1.2, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 11.1, 13.1, 15.1_

- [x] 2. Implement CSS — layout, variables, and widget styles
  - [x] 2.1 Define CSS custom properties for light and dark themes
    - Declare `:root` variables for background, surface, text, accent, and border colors
    - Add `[data-theme="dark"]` rule overriding those variables with dark-mode values
    - _Requirements: 13.2, 13.3_
  - [x] 2.2 Write base layout and typography styles
    - Reset box-model, set `font-family`, `line-height`, and body background/color mapped to CSS variables
    - Lay out the dashboard grid/flex container so all five widgets display cleanly
    - _Requirements: 14.1, 14.2_
  - [x] 2.3 Style each widget and interactive states
    - Card styles for each widget section (padding, border-radius, shadow using CSS variables)
    - Input, button, checkbox styles
    - `.task-item.completed .task-title` — `text-decoration: line-through` and muted color
    - Disabled button appearance (`opacity`, `cursor: not-allowed`)
    - Inline validation message styles (visible/hidden states via a `.visible` utility class)
    - _Requirements: 6.4, 7.4, 8.2, 8.3, 11.4_

- [x] 3. Implement `js/script.js` IIFE shell and Storage module
  - [x] 3.1 Create the IIFE wrapper and `Storage` module
    - Wrap all code in `(function () { ... })();`
    - Implement `Storage.get(key)` — `JSON.parse` inside `try/catch`, return `null` on failure
    - Implement `Storage.set(key, value)` — `JSON.stringify` then `localStorage.setItem`
    - Implement `Storage.remove(key)` — `localStorage.removeItem`
    - Implement `generateId()` helper with `crypto.randomUUID()` fallback
    - _Requirements: 10.2, 12.3, 14.3_
  - [-]* 3.2 Write unit tests for Storage module
    - Test `get` with valid JSON, invalid JSON (should return `null`), and absent key
    - Test `set` round-trip: `set` then `get` returns the original value
    - Test `remove` clears the key
    - _Requirements: 10.2, 14.3_

- [x] 4. Implement Theme module
  - [x] 4.1 Implement `Theme.init()` and `Theme.toggle()`
    - `Theme.init()` — reads `Storage.get("theme")`, defaults to `"light"`, applies `data-theme` attribute to `document.documentElement` immediately
    - `Theme.toggle()` — flips the current theme, sets `data-theme`, calls `Storage.set("theme", ...)`
    - Wire `#theme-toggle-btn` click to `Theme.toggle()`
    - Call `Theme.init()` as the very first module call inside `DOMContentLoaded`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  - [-]* 4.2 Write property test for Theme toggle (Property 23)
    - **Property 23: Theme toggle is an involution (double-toggle restores original)**
    - **Validates: Requirements 13.2, 13.4**
    - Use `fc.constantFrom("light", "dark")` to seed initial theme; assert that toggling twice restores the original `data-theme` attribute and `Storage.get("theme")`
    - _Requirements: 13.2, 13.4_

- [x] 5. Implement Greeting module
  - [x] 5.1 Implement pure helper functions: `formatTime`, `formatDate`, `getGreeting`
    - `formatTime(date)` — returns `HH:MM:SS` string (zero-padded via `padStart(2, "0")`)
    - `formatDate(date)` — returns full human-readable date string (e.g. `"Sunday, 26 October 2025"`) using `toLocaleDateString` or manual construction
    - `getGreeting(hour)` — returns the correct prefix for hours 0–23 per the four bands defined in the design
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_
  - [-]* 5.2 Write property tests for time/date/greeting helpers (Properties 1, 2, 3)
    - **Property 1: Time formatting is always valid HH:MM:SS** — `fc.date()`, validate regex `/^\d{2}:\d{2}:\d{2}$/` and range constraints
    - **Property 2: Date formatting always contains required components** — `fc.date()`, validate weekday, day, month name, and 4-digit year are present
    - **Property 3: Greeting band is determined solely by hour** — `fc.integer({ min: 0, max: 23 })`, assert exactly one of the four prefixes
    - **Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4**
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_
  - [x] 5.3 Implement `Greeting.init()` and `Greeting.updateClock()`
    - `init()` — reads `userName` from Storage, starts `setInterval` calling `updateClock` every 1 000 ms, calls `updateClock` immediately
    - `updateClock()` — constructs a `new Date()`, writes `formatTime` result to `#clock`, `formatDate` result to `#date-display`, and the full greeting string (prefix + optional name) to `#greeting-text`
    - Wire `#name-save-btn` click and `keydown` Enter on `#name-input` to the name-save logic: trim → non-empty → `Storage.set`, empty → `Storage.remove`; then re-render greeting
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [-]* 5.4 Write property tests for name persistence (Properties 4, 5)
    - **Property 4: Name save persists and appears in greeting** — `fc.string({ minLength: 1 })`, save name, assert `Storage.get("userName") === name` and greeting text contains name
    - **Property 5: Name loaded on init appears in greeting** — `fc.string({ minLength: 1 })`, pre-seed localStorage, call `Greeting.init()`, assert greeting text contains name
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 6. Checkpoint — Greeting and Theme working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Focus Timer module
  - [x] 7.1 Implement `formatTimer(remaining)` pure helper
    - Accepts integer seconds in `[0, 1500]`, returns zero-padded `MM:SS` string
    - _Requirements: 4.3_
  - [ ]* 7.2 Write property test for timer display format (Property 6)
    - **Property 6: Timer display string is always valid MM:SS**
    - **Validates: Requirements 4.3**
    - Use `fc.integer({ min: 0, max: 1500 })`; assert regex `/^\d{2}:\d{2}$/`, minutes in `[0..25]`, seconds in `[0..59]`
    - _Requirements: 4.3_
  - [x] 7.3 Implement `Timer` internal state and tick logic
    - Declare `Timer = { remaining: 1500, intervalId: null, running: false }`
    - `Timer.tick()` — decrement `remaining`; if `<= 0`: call `Timer.stop()`, set display to `00:00`, trigger alert (visual flash + `window.alert` fallback)
    - `Timer.start()` — guard if already running; set `running = true`; start interval; update button disabled states
    - `Timer.stop()` — clear interval; set `running = false`; update button disabled states
    - `Timer.reset()` — call `stop()`, set `remaining = 1500`, update display to `25:00`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 7.4 Write property tests for timer tick and button states (Properties 7, 8)
    - **Property 7: Each timer tick decrements remaining by exactly one second** — `fc.integer({ min: 1, max: 1500 })`, simulate one tick, assert `remaining` decreased by 1 and display updated
    - **Property 8: Timer button state machine is always consistent** — `fc.boolean()` (isRunning), assert Start disabled ↔ running, Stop disabled ↔ not running
    - **Validates: Requirements 4.2, 4.3, 5.2, 5.5, 5.6**
    - _Requirements: 4.2, 4.3, 5.2, 5.5, 5.6_
  - [x] 7.5 Wire Timer controls to DOM
    - `Timer.init()` — query `#timer-start`, `#timer-stop`, `#timer-reset`; attach click listeners; render initial `25:00`; set initial button disabled states (Stop disabled)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8. Checkpoint — Focus Timer working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Task List module
  - [x] 9.1 Implement task CRUD pure logic helpers
    - `createTask(title)` — returns a new Task object `{ id, title: title.trim(), completed: false, createdAt: Date.now() }`
    - `isDuplicateTask(tasks, title)` — returns `true` if any existing task matches `title.trim().toLowerCase()`
    - `toggleTask(tasks, id)` — returns new array with the matched task's `completed` flipped
    - `removeTask(tasks, id)` — returns new array without the task matching `id`
    - `updateTask(tasks, id, newTitle)` — returns new array with matched task's `title` set to `newTitle.trim()`
    - _Requirements: 6.2, 6.4, 6.5, 7.3, 8.2, 8.3, 9.2_
  - [ ]* 9.2 Write property tests for task CRUD helpers (Properties 9–17)
    - **Property 9: Adding a valid task grows the list and persists** — `fc.string({ minLength: 1 })`
    - **Property 10: Whitespace-only titles are always rejected** — `fc.stringMatching(/^\s*$/)`
    - **Property 11: Duplicate task titles are always rejected** — `fc.string({ minLength: 1 })`
    - **Property 12: Input field is empty after every successful add** — `fc.string({ minLength: 1 })`
    - **Property 13: Edit pre-fills with the current task title** — task record arbitrary
    - **Property 14: Saving a valid edit updates task and persists** — task record + `fc.string({ minLength: 1 })`
    - **Property 15: Completion toggle is an idempotent involution** — task record arbitrary
    - **Property 16: Deleting a task removes it from state and localStorage** — `fc.array(task record, { minLength: 1 })`
    - **Property 17: Task list loads exactly the stored tasks on init** — `fc.array(task record)`
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 8.2, 8.3, 8.4, 9.2, 9.3, 10.1**
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 8.2, 8.3, 8.4, 9.2, 9.3, 10.1_
  - [x] 9.3 Implement `TaskList.render(tasks)` and DOM template
    - `render(tasks)` — clears `#task-list`, iterates tasks, builds `<li data-id>` per the HTML template in the design (checkbox, title span, Edit button, Delete button), appends to `#task-list`
    - Apply `completed` CSS class when `task.completed === true`
    - _Requirements: 8.2, 8.3, 10.1_
  - [x] 9.4 Implement `TaskList.init()`, `add()`, and event delegation
    - `init()` — loads tasks from `Storage.get("tasks") ?? []`, calls `render()`
    - `add()` — reads `#task-input`, validates (empty check → show `#task-validation-msg`; duplicate check → show `#task-validation-msg`), on success: `createTask`, push, `Storage.set("tasks", ...)`, `render()`, clear input, hide validation message
    - Wire `#task-add-btn` click and `keydown` Enter on `#task-input` to `add()`
    - Single `click` listener on `#task-list` using `event.target.closest(...)` to dispatch to `toggle`, `remove`, or `edit` actions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 10.1, 10.2_
  - [x] 9.5 Implement inline edit mode
    - On Edit click: replace `<span class="task-title">` + Edit/Delete buttons with `<input class="task-edit-input">` + Save/Cancel buttons; pre-fill input with current title
    - On Save click: validate non-empty; call `updateTask`, `Storage.set`, `render()`
    - On Cancel click: call `render()` to restore original display without any state change
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10. Checkpoint — Task List working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Quick Links module
  - [x] 11.1 Implement `normalizeUrl(url)` pure helper
    - If `url` does not match `/^https?:\/\//i`, prepend `"https://"`; otherwise return unchanged
    - _Requirements: 11.5_
  - [ ]* 11.2 Write property tests for URL normalization and link CRUD (Properties 18–22)
    - **Property 18: Adding a valid link grows the collection and persists** — `fc.string({ minLength: 1 })` + `fc.webUrl()`
    - **Property 19: Links with missing label or URL are always rejected** — empty string arbitraries
    - **Property 20: URL normalization always produces an http(s) prefix** — non-prefixed `fc.string({ minLength: 1 })` and already-prefixed `fc.webUrl()`
    - **Property 21: Deleting a link removes it from state and localStorage** — `fc.array(link record, { minLength: 1 })`
    - **Property 22: Quick links panel loads exactly the stored links on init** — `fc.array(link record)`
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.7, 12.2**
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.7, 12.2_
  - [x] 11.3 Implement `QuickLinks.render(links)` and DOM template
    - `render(links)` — clears `#quick-links-panel`, iterates links, builds `<div class="link-item" data-id>` containing `<a href target="_blank" rel="noopener noreferrer">` and `<button class="link-delete-btn">×</button>`, appends to panel
    - _Requirements: 12.1, 12.2_
  - [x] 11.4 Implement `QuickLinks.init()`, `add()`, and event delegation
    - `init()` — loads links from `Storage.get("quickLinks") ?? []`, calls `render()`
    - `add()` — reads `#link-label-input` and `#link-url-input`, validates both non-empty (show `#link-validation-msg` on failure), normalizes URL, creates Link object `{ id, label, url }`, pushes, `Storage.set("quickLinks", ...)`, `render()`, clears inputs
    - Wire `#link-add-btn` click to `add()`
    - Single `click` listener on `#quick-links-panel` using `event.target.closest(".link-delete-btn")` to dispatch delete
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 12.1, 12.2, 12.3_

- [x] 12. Wire all modules and final integration
  - [x] 12.1 Wire `DOMContentLoaded` initialization sequence
    - Inside the IIFE, add the `DOMContentLoaded` listener that calls modules in order: `Theme.init()`, `Greeting.init()`, `Timer.init()`, `TaskList.init()`, `QuickLinks.init()`
    - Confirm `Theme.init()` is the first call to prevent FOCT
    - _Requirements: 13.5, 1.3, 14.1_
  - [ ]* 12.2 Write integration tests for full page initialization
    - Use `jsdom` to simulate a page load with pre-seeded `localStorage` (tasks, links, theme, userName)
    - Assert: correct theme applied, greeting shows stored name, task items rendered, link buttons rendered
    - _Requirements: 3.4, 10.1, 12.2, 13.5_
  - [x] 12.3 Cross-browser compatibility verification
    - Audit all JS for ES6+ features used: ensure no APIs beyond `localStorage`, `crypto`, `setInterval`, `Date`, `querySelector`, `addEventListener`, `classList`, `dataset`, `closest`
    - Confirm `generateId()` fallback is in place for environments without `crypto.randomUUID()`
    - Confirm no inline `<script>` logic and no inline `<style>` blocks in `index.html`
    - _Requirements: 14.1, 14.2, 14.3, 15.2, 15.3_

- [x] 13. Final checkpoint — full dashboard working end-to-end
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests require [fast-check](https://fast-check.dev/) and a test runner such as Vitest or Jest; tests live in `__tests__/` and are not shipped with the three static files
- DOM-dependent tests (Tasks 9–12) require `jsdom` (provided by Vitest's `jsdom` environment or `jest-environment-jsdom`)
- Pure logic helpers (`formatTime`, `formatDate`, `getGreeting`, `formatTimer`, `normalizeUrl`, task/link CRUD helpers) must be exported from `js/script.js` or extracted into a separate testable module
- Each property test file must include the tag comment: `// Feature: todo-life-dashboard, Property {N}: {property title}`
- `Theme.init()` MUST be the first module initialized — this is the only way to prevent FOCT

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "7.1"] },
    { "id": 6, "tasks": ["5.4", "7.2", "7.3", "9.1"] },
    { "id": 7, "tasks": ["7.4", "7.5", "9.2", "9.3"] },
    { "id": 8, "tasks": ["9.4", "11.1"] },
    { "id": 9, "tasks": ["9.5", "11.2", "11.3"] },
    { "id": 10, "tasks": ["11.4"] },
    { "id": 11, "tasks": ["12.1"] },
    { "id": 12, "tasks": ["12.2", "12.3"] }
  ]
}
```
