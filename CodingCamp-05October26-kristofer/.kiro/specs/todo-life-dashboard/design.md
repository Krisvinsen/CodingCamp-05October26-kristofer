# Design Document — To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page web application (SPA) delivered as three static files — `index.html`, `css/style.css`, and `js/script.js`. It has no build step, no external dependencies, and no backend. The entire runtime state is maintained in memory via a plain JavaScript module pattern, and all persistent state is serialized to and deserialized from `localStorage`.

The application is composed of five self-contained widgets rendered inside one HTML page:

| Widget | Responsibility |
|---|---|
| Greeting_Widget | Current time, date, and personalized greeting |
| Focus_Timer | Pomodoro-style 25-minute countdown |
| Task_List | CRUD task management with persistence |
| Quick_Links | Bookmark shortcuts with persistence |
| Theme_Toggle | Light / dark color-scheme switch |

All DOM manipulation is done imperatively with vanilla DOM APIs (`querySelector`, `createElement`, `addEventListener`). No virtual DOM, no reactive framework.

---

## Architecture

### Single-File Module Pattern

`js/script.js` is organized as an IIFE (Immediately Invoked Function Expression) to avoid polluting the global namespace. Inside, each widget maps to one module object with `init()`, and optionally `render()` / `update()` methods.

```
(function () {
  const Storage   = { ... };   // localStorage read/write helpers
  const Greeting  = { init, update };
  const Timer     = { init, start, stop, reset };
  const TaskList  = { init, render, add, edit, toggle, remove };
  const QuickLinks= { init, render, add, remove };
  const Theme     = { init, toggle };

  document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
    Theme.init();       // must run first — prevents FOCT (flash of correct theme)
    Greeting.init();
    Timer.init();
    TaskList.init();
    QuickLinks.init();
  });
})();
```

### Initialization Order

Theme.init() must run before any other widget because it applies the stored color scheme to `<html>` before the browser paints, preventing a flash of incorrect theme (FOCT).

### Tick Loop

The live clock and the countdown timer both rely on `setInterval`. Two separate intervals are used:

- **Clock interval** — started once at page load, fires every 1 000 ms, updates the time display.
- **Timer interval** — started/stopped by user controls, fires every 1 000 ms, decrements the countdown.

Using `Date.now()` drift correction is recommended for the clock so accumulated drift over minutes stays negligible.

### Data Flow

```
User interaction
      │
      ▼
DOM Event Handler
      │
      ├─► In-memory state update  (JS objects)
      │
      ├─► DOM render update       (innerHTML / textContent)
      │
      └─► localStorage.setItem()  (JSON serialization)

Page load
      │
      ├─► localStorage.getItem()  (JSON deserialization)
      │
      └─► DOM render              (initial paint)
```

---

## Components and Interfaces

### 1. Storage Module

Provides a thin, typed wrapper around `localStorage` to keep serialization logic in one place.

```js
Storage = {
  get(key)         // returns parsed JSON value or null
  set(key, value)  // serializes value to JSON and stores
  remove(key)      // removes key from localStorage
}
```

Keys used:

| Key | Type | Description |
|---|---|---|
| `userName` | `string` | User's display name for greeting |
| `tasks` | `Task[]` | Array of task objects |
| `quickLinks` | `Link[]` | Array of quick-link objects |
| `theme` | `"light" \| "dark"` | Active color theme |

---

### 2. Greeting Module

**DOM targets:**
- `#clock` — HH:MM:SS live time
- `#date-display` — full human-readable date
- `#greeting-text` — e.g. "Good Morning, Kristofer!"
- `#name-input` — text input for custom name
- `#name-save-btn` — confirm name button

**Behavior:**
- On `init()`, reads `userName` from Storage and starts the clock interval.
- `updateClock()` runs every second via `setInterval`, updates `#clock` using `Date` methods, computes the greeting band, and sets `#greeting-text`.
- Greeting bands:

| Hours | Prefix |
|---|---|
| 05–11 | Good Morning |
| 12–17 | Good Afternoon |
| 18–21 | Good Evening |
| 22–04 | Good Night |

- Name save: on click of `#name-save-btn` (or Enter in `#name-input`), trims input value. If non-empty → `Storage.set('userName', name)` then re-render greeting. If empty → `Storage.remove('userName')` then show prefix only.

---

### 3. Focus Timer Module

**DOM targets:**
- `#timer-display` — MM:SS string
- `#timer-start` — Start button
- `#timer-stop` — Stop button
- `#timer-reset` — Reset button

**Internal state:**
```js
Timer = {
  remaining: 25 * 60,  // seconds
  intervalId: null,
  running: false,
}
```

**Control logic:**

| State | Start enabled | Stop enabled |
|---|---|---|
| Not running | ✅ | ❌ |
| Running | ❌ | ✅ |

- `start()` — sets `running = true`, starts interval, disables Start, enables Stop.
- `stop()` — clears interval, sets `running = false`, enables Start, disables Stop.
- `reset()` — calls `stop()`, sets `remaining = 1500`, updates display to `25:00`.
- On each tick: decrement `remaining`. If `remaining <= 0` → call `stop()`, display `00:00`, trigger alert (visual flash or `window.alert` as fallback).

---

### 4. Task List Module

**DOM targets:**
- `#task-input` — text input for new task title
- `#task-add-btn` — Add button
- `#task-validation-msg` — inline validation/warning message area
- `#task-list` — `<ul>` container for task items

**Task item HTML template:**
```html
<li data-id="{id}" class="task-item [completed]">
  <input type="checkbox" class="task-check" [checked]>
  <span class="task-title">{title}</span>
  <button class="task-edit-btn">Edit</button>
  <button class="task-delete-btn">Delete</button>
</li>
```

**Edit mode replaces `<span>` with:**
```html
<input class="task-edit-input" value="{current title}">
<button class="task-save-btn">Save</button>
<button class="task-cancel-btn">Cancel</button>
```

**Operations:**

| Operation | Validation | Side Effects |
|---|---|---|
| `add(title)` | trim + non-empty; case-insensitive duplicate check | push to array, persist, render, clear input |
| `edit(id, newTitle)` | trim + non-empty | update in array, persist, render |
| `toggle(id)` | — | flip `completed`, persist, update class |
| `remove(id)` | — | splice array, persist, re-render |

**Event delegation:** a single `click` listener on `#task-list` dispatches by `closest` class match, avoiding per-item listeners.

---

### 5. Quick Links Module

**DOM targets:**
- `#link-label-input` — label field
- `#link-url-input` — URL field
- `#link-add-btn` — Add button
- `#link-validation-msg` — inline validation message
- `#quick-links-panel` — container for link buttons

**Link button HTML template:**
```html
<div class="link-item" data-id="{id}">
  <a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>
  <button class="link-delete-btn">×</button>
</div>
```

**URL normalization:** if the submitted URL does not start with `http://` or `https://` (checked via `/^https?:\/\//i`), prepend `https://`.

**Event delegation:** single `click` listener on `#quick-links-panel`.

---

### 6. Theme Module

**DOM target:** `<html>` element (the root)

**Behavior:**
- `init()` — reads `theme` from Storage (default `"light"`), applies `data-theme="light|dark"` attribute to `<html>`.
- `toggle()` — flips current theme, updates attribute, persists new value.
- CSS variables are scoped to `[data-theme="dark"]` selectors in `style.css`.

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  title:     string,   // trimmed, non-empty
  completed: boolean,  // default false
  createdAt: number    // Date.now() timestamp
}
```

### Link

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // trimmed, non-empty display text
  url:   string   // normalized URL (always starts with http:// or https://)
}
```

### LocalStorage Schema

```
localStorage = {
  "userName":   "Kristofer",
  "theme":      "dark",
  "tasks":      "[{\"id\":\"...\",\"title\":\"...\",\"completed\":false,\"createdAt\":...}]",
  "quickLinks": "[{\"id\":\"...\",\"label\":\"GitHub\",\"url\":\"https://github.com\"}]"
}
```

All values are stored as JSON strings and parsed on read. Absent keys are treated as `null` and default-handled gracefully.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time formatting is always valid HH:MM:SS

*For any* `Date` object, the `formatTime(date)` function shall return a string that matches the pattern `HH:MM:SS` where each component is zero-padded to two digits and hours, minutes, seconds are within their respective valid ranges.

**Validates: Requirements 1.1**

---

### Property 2: Date formatting always contains the required components

*For any* `Date` object, the `formatDate(date)` function shall return a string that contains a valid weekday name (Monday–Sunday), a numeric day, a month name (January–December), and a four-digit year that matches the input date.

**Validates: Requirements 1.2**

---

### Property 3: Greeting band is determined solely by hour

*For any* integer hour in `[0, 23]`, `getGreeting(hour)` shall return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"` — with Morning for `[5..11]`, Afternoon for `[12..17]`, Evening for `[18..21]`, and Night for `[22..23]` and `[0..4]`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 4: Name save persists and appears in greeting

*For any* non-empty string `name`, after saving the name, `Storage.get("userName")` shall equal `name` and the rendered greeting text shall contain `name`.

**Validates: Requirements 3.2, 3.3**

---

### Property 5: Name loaded on init appears in greeting

*For any* non-empty string `name` stored in `localStorage` under `"userName"` before `Greeting.init()` is called, the resulting greeting text shall contain `name` without the user re-entering it.

**Validates: Requirements 3.4**

---

### Property 6: Timer display string is always valid MM:SS

*For any* integer `remaining` in `[0, 1500]` seconds, `formatTimer(remaining)` shall return a string of the form `MM:SS` where minutes and seconds are zero-padded, minutes are in `[00..25]`, and seconds are in `[00..59]`.

**Validates: Requirements 4.3**

---

### Property 7: Each timer tick decrements remaining by exactly one second

*For any* running timer with `remaining > 0`, after one simulated tick, `remaining` shall equal its previous value minus `1` and the display shall reflect the new value.

**Validates: Requirements 4.2, 4.3**

---

### Property 8: Timer button state machine is always consistent

*For any* timer state (running or not running), the Start button shall be disabled if and only if the timer is running, and the Stop button shall be disabled if and only if the timer is not running.

**Validates: Requirements 5.2, 5.5, 5.6**

---

### Property 9: Adding a valid task grows the list and persists

*For any* non-empty task title `t`, after `TaskList.add(t)`, the in-memory tasks array length shall be exactly `previous_length + 1`, the new task shall have `title === t.trim()` and `completed === false`, and `Storage.get("tasks")` shall contain the new task.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 10: Whitespace-only task titles are always rejected

*For any* string composed entirely of whitespace characters (including the empty string), `TaskList.add()` shall not increase the tasks array length, shall not write a new task to `localStorage`, and shall make the validation message visible.

**Validates: Requirements 6.4**

---

### Property 11: Duplicate task titles are always rejected

*For any* non-empty task title `t` already present in the active task list, attempting `TaskList.add(t')` where `t'.trim().toLowerCase() === t.trim().toLowerCase()` shall not increase the tasks array length.

**Validates: Requirements 6.5**

---

### Property 12: Input field is empty after every successful add

*For any* non-empty task title `t`, after a successful `TaskList.add(t)`, the text input field's value shall be the empty string `""`.

**Validates: Requirements 6.6**

---

### Property 13: Edit pre-fills with the current task title

*For any* task `t` in the list, activating the Edit control on `t` shall produce an edit input whose `.value` equals `t.title` exactly.

**Validates: Requirements 7.2**

---

### Property 14: Saving a valid edit updates task and persists

*For any* task `t` and any non-empty string `newTitle`, after confirming the edit with `newTitle`, `t.title` in the in-memory array shall equal `newTitle.trim()` and `Storage.get("tasks")` shall reflect the updated title.

**Validates: Requirements 7.3**

---

### Property 15: Completion toggle is an idempotent involution

*For any* task `t`, toggling completion twice shall return `t.completed` to its original value. Equivalently, for any task, `toggle(toggle(t)).completed === t.completed`. After each toggle, `Storage.get("tasks")` shall reflect the current `completed` state.

**Validates: Requirements 8.2, 8.3, 8.4**

---

### Property 16: Deleting a task removes it from state and localStorage

*For any* task `t` in the list, after `TaskList.remove(t.id)`, the in-memory array shall contain no task with `id === t.id`, the array length shall be `previous_length - 1`, and `Storage.get("tasks")` shall likewise contain no task with that id.

**Validates: Requirements 9.2, 9.3**

---

### Property 17: Task list loads exactly the stored tasks on init

*For any* array of task objects written to `localStorage["tasks"]`, after `TaskList.init()`, the number of rendered task items in the DOM shall equal the length of that array, and each task's title shall appear in the list.

**Validates: Requirements 10.1**

---

### Property 18: Adding a valid link grows the collection and persists

*For any* non-empty label and any URL, after `QuickLinks.add(label, url)`, the in-memory links array length shall be `previous_length + 1` and `Storage.get("quickLinks")` shall contain the new link entry.

**Validates: Requirements 11.2, 11.3**

---

### Property 19: Links with missing label or URL are always rejected

*For any* call to `QuickLinks.add(label, url)` where `label.trim() === ""` or `url.trim() === ""`, the links array shall not grow and the validation message shall be visible.

**Validates: Requirements 11.4**

---

### Property 20: URL normalization always produces an http(s) prefix

*For any* URL string `u` that does not already begin with `http://` or `https://` (case-insensitive), `normalizeUrl(u)` shall return `"https://" + u`.  
*For any* URL string `u` that already begins with `http://` or `https://`, `normalizeUrl(u)` shall return `u` unchanged.

**Validates: Requirements 11.5**

---

### Property 21: Deleting a link removes it from state and localStorage

*For any* link `l` in the collection, after `QuickLinks.remove(l.id)`, the links array shall contain no entry with `id === l.id` and `Storage.get("quickLinks")` shall likewise not contain that id.

**Validates: Requirements 11.7**

---

### Property 22: Quick links panel loads exactly the stored links on init

*For any* array of link objects written to `localStorage["quickLinks"]`, after `QuickLinks.init()`, the number of rendered link buttons in the panel shall equal the length of that array.

**Validates: Requirements 12.2**

---

### Property 23: Theme toggle is an involution (double-toggle restores original)

*For any* initial theme `T ∈ {"light", "dark"}`, after calling `Theme.toggle()` twice, the `data-theme` attribute on `<html>` shall equal `T` and `Storage.get("theme")` shall equal `T`.

**Validates: Requirements 13.2, 13.4**

---

## Error Handling

### Malformed localStorage Data

`localStorage` may contain invalid JSON (written by another tab, browser extension, or a previous buggy version). Every `Storage.get()` call wraps `JSON.parse` in a `try/catch`. On parse failure, the method returns `null` and the calling widget falls back to its default empty state — no unhandled exceptions propagate to the user.

```js
get(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
```

### Missing localStorage Keys

All four keys (`userName`, `tasks`, `quickLinks`, `theme`) may be absent on first load. Each widget checks for `null` from `Storage.get()` and initializes to its safe default:

| Key | Missing → default |
|---|---|
| `userName` | Show greeting prefix only |
| `tasks` | Render empty list |
| `quickLinks` | Render empty panel |
| `theme` | Apply `"light"` |

### Input Validation Errors

All user inputs are validated before any state mutation. Validation errors are surfaced as inline messages in the DOM (not `alert()`), which keeps UX non-blocking. Validation messages are cleared on the next successful action.

| Widget | Condition | Message |
|---|---|---|
| Task add | Empty/whitespace title | "Task title cannot be empty." |
| Task add | Duplicate title | "This task already exists." |
| Task edit | Empty/whitespace title | "Title cannot be empty." |
| Link add | Empty label | "Label is required." |
| Link add | Empty URL | "URL is required." |

### Timer Edge Cases

- If `setInterval` fires after the tab is suspended and then restored (browser throttling), the countdown may skip ticks. This is acceptable for a Pomodoro tool; a production-grade solution would use `Date.now()` drift correction, which is documented in the Architecture section.
- The Reset control is always available (not disabled), so the user can always recover a stuck timer.

### Cross-Browser `crypto.randomUUID()`

`crypto.randomUUID()` is available in all modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+). As a fallback for older environments, the ID generator can fall back to `Date.now().toString(36) + Math.random().toString(36).slice(2)`. This is included in the implementation as a guard:

```js
function generateId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
```

---

## Testing Strategy

### Dual Testing Approach

Testing uses two complementary layers:

1. **Unit / example-based tests** — verify specific concrete behaviors (DOM structure, specific state transitions, error messages).
2. **Property-based tests** — verify universal invariants across generated inputs.

Both are run as part of a local test suite. The recommended PBT library is **[fast-check](https://fast-check.dev/)** (JavaScript), which integrates with any test runner (Jest, Vitest, plain Node).

### Property-Based Test Configuration

- **Minimum 100 iterations per property** (fast-check default is 100 runs).
- Each property test file is tagged with a comment in this format:

```js
// Feature: todo-life-dashboard, Property {N}: {property title}
```

- Each property maps one-to-one to a `fc.assert(fc.property(...))` call.

### Unit Test Coverage

Unit tests focus on:
- DOM structure (required elements are present on load)
- State transitions that are specific and non-generalizable (Reset always goes to 25:00, Cancel edit restores original value)
- Edge cases that PBT generators cover implicitly but should be pinned explicitly (empty string, `null` localStorage, timer reaching 00:00)
- Side-effect verification (alert called on timer completion, `target="_blank"` on link anchors)

### Property Test List

Each property from the Correctness Properties section maps to one `fc.property` test:

| Test | Arbitrary |
|---|---|
| P1 – Time formatting | `fc.date()` |
| P2 – Date formatting | `fc.date()` |
| P3 – Greeting band | `fc.integer({ min: 0, max: 23 })` |
| P4 – Name save round-trip | `fc.string({ minLength: 1 })` |
| P5 – Name load on init | `fc.string({ minLength: 1 })` |
| P6 – Timer display format | `fc.integer({ min: 0, max: 1500 })` |
| P7 – Tick decrements remaining | `fc.integer({ min: 1, max: 1500 })` |
| P8 – Button state machine | `fc.boolean()` (isRunning) |
| P9 – Add task grows list + persists | `fc.string({ minLength: 1 })` |
| P10 – Whitespace rejected | `fc.stringMatching(/^\s*$/)` |
| P11 – Duplicate rejected | `fc.string({ minLength: 1 })` |
| P12 – Input cleared after add | `fc.string({ minLength: 1 })` |
| P13 – Edit pre-fill | `fc.record({ id: fc.uuid(), title: fc.string({ minLength: 1 }), completed: fc.boolean(), createdAt: fc.integer() })` |
| P14 – Save edit round-trip | same as P13 + `fc.string({ minLength: 1 })` (newTitle) |
| P15 – Toggle involution | same task record |
| P16 – Delete removes task | `fc.array(task record, { minLength: 1 })` |
| P17 – Load tasks from storage | `fc.array(task record)` |
| P18 – Add link grows collection | `fc.string({ minLength: 1 })` (label) + `fc.webUrl()` (url) |
| P19 – Empty link rejected | `fc.constant("")` or `fc.string()` with empty url |
| P20 – URL normalization | `fc.string({ minLength: 1 })` (non-http-prefixed) + `fc.webUrl()` (already prefixed) |
| P21 – Delete link removes entry | `fc.array(link record, { minLength: 1 })` |
| P22 – Load links from storage | `fc.array(link record)` |
| P23 – Theme toggle involution | `fc.constantFrom("light", "dark")` |

### Test File Organization

Since the project ships as three static files, tests live in a separate `__tests__/` directory (not shipped). The pure logic functions (`formatTime`, `formatDate`, `getGreeting`, `formatTimer`, `normalizeUrl`, task/link CRUD helpers) are extracted as plain functions that can be imported or loaded by the test runner without a browser environment (using `jsdom` for DOM-dependent tests).

### Manual / Smoke Tests

The following require manual verification or a real browser:

- Cross-browser rendering (Chrome, Firefox, Edge, Safari)
- No flash of incorrect theme on load
- Timer interval accuracy over 25 minutes
- Audible/visual alert fires at 00:00
- Links open in a new tab
- No inline `<style>` or `<script>` blocks in delivered HTML
