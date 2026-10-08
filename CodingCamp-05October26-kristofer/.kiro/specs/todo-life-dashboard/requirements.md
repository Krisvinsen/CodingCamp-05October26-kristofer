# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and vanilla JavaScript. It provides a personal productivity hub featuring a time-aware greeting, a Pomodoro-style focus timer, a persistent task list, and a customizable quick-links panel. All user data is persisted in the browser's Local Storage with no backend or external dependencies. The application must run correctly in Chrome, Firefox, Edge, and Safari.

## Glossary

- **Dashboard**: The single-page application rendered in `index.html`.
- **User**: The person using the Dashboard in a browser.
- **Greeting_Widget**: The section of the Dashboard that displays the current time, date, and a personalized greeting.
- **Focus_Timer**: The Pomodoro-style countdown timer widget on the Dashboard.
- **Task_List**: The widget that manages to-do items.
- **Task**: A single to-do item stored in Local Storage.
- **Quick_Links**: The widget that displays and manages shortcut buttons to external URLs.
- **Link**: A single quick-link entry containing a label and a URL, stored in Local Storage.
- **Local_Storage**: The browser's `localStorage` API used for all persistent data.
- **Theme**: The visual color scheme of the Dashboard — either `light` or `dark`.
- **Custom_Name**: The user-supplied name displayed in the greeting, stored in Local Storage.
- **Duplicate_Task**: A task whose title, after trimming whitespace and case-normalizing, matches an existing active task title exactly.

---

## Requirements

### Requirement 1: Time and Date Display

**User Story:** As a User, I want to see the current time and date at a glance, so that I always know when I am without switching apps.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM:SS format, updated every second.
2. THE Greeting_Widget SHALL display the current full date in a human-readable format (e.g., "Sunday, 26 October 2025").
3. WHEN the Dashboard loads, THE Greeting_Widget SHALL render the time and date immediately without a visible delay.

---

### Requirement 2: Time-of-Day Greeting

**User Story:** As a User, I want to receive a greeting that matches the time of day, so that the Dashboard feels personal and contextually aware.

#### Acceptance Criteria

1. WHEN the current hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the greeting prefix "Good Morning".
2. WHEN the current hour is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the greeting prefix "Good Afternoon".
3. WHEN the current hour is between 18:00 and 21:59 (inclusive), THE Greeting_Widget SHALL display the greeting prefix "Good Evening".
4. WHEN the current hour is between 22:00 and 04:59 (inclusive), THE Greeting_Widget SHALL display the greeting prefix "Good Night".

---

### Requirement 3: Custom Name in Greeting

**User Story:** As a User, I want to set my name so the greeting addresses me personally, so that the Dashboard feels like my own space.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display an editable name field alongside the greeting prefix.
2. WHEN the User submits a non-empty name, THE Greeting_Widget SHALL display the name as part of the greeting (e.g., "Good Morning, Kristofer!").
3. WHEN the User submits a non-empty name, THE Dashboard SHALL persist the name in Local_Storage under the key `userName`.
4. WHEN the Dashboard loads and Local_Storage contains a `userName` value, THE Greeting_Widget SHALL display that stored name without prompting the User to re-enter it.
5. WHEN the User clears the name field and submits, THE Greeting_Widget SHALL revert to displaying only the greeting prefix without a name, and THE Dashboard SHALL remove the `userName` key from Local_Storage.

---

### Requirement 4: Focus Timer — Countdown

**User Story:** As a User, I want a 25-minute countdown timer, so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25:00 (minutes:seconds).
2. WHEN the User activates the Start control, THE Focus_Timer SHALL begin counting down one second at a time.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the Focus_Timer reaches 00:00, THE Focus_Timer SHALL stop counting down automatically.
5. WHEN the Focus_Timer reaches 00:00, THE Dashboard SHALL emit an audible or visual alert to notify the User that the session has ended.

---

### Requirement 5: Focus Timer — Controls

**User Story:** As a User, I want Start, Stop, and Reset controls on the timer, so that I can manage my focus sessions flexibly.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide a Start control, a Stop control, and a Reset control.
2. WHEN the User activates the Start control, THE Focus_Timer SHALL begin or resume the countdown and THE Start control SHALL become disabled until the timer is stopped or reset.
3. WHEN the User activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current remaining time.
4. WHEN the User activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the display to 25:00.
5. WHILE the Focus_Timer is not running, THE Stop control SHALL be disabled.
6. WHILE the Focus_Timer is running, THE Start control SHALL be disabled.

---

### Requirement 6: Task Creation

**User Story:** As a User, I want to add tasks to my to-do list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input field and an Add control for creating new tasks.
2. WHEN the User submits a non-empty task title via the Add control or the Enter key, THE Task_List SHALL create a new Task and append it to the list.
3. WHEN the User submits a non-empty task title via the Add control or the Enter key, THE Task_List SHALL persist the updated task collection in Local_Storage under the key `tasks`.
4. IF the submitted task title, after trimming whitespace, is empty, THEN THE Task_List SHALL not create a task and SHALL display an inline validation message.
5. IF the submitted task title matches an existing active Task title (case-insensitive, whitespace-trimmed), THEN THE Task_List SHALL not create a duplicate Task and SHALL display an inline warning indicating the task already exists.
6. WHEN a new task is created, THE Task_List SHALL clear the text input field.

---

### Requirement 7: Task Editing

**User Story:** As a User, I want to edit an existing task's title, so that I can correct mistakes or refine my task descriptions.

#### Acceptance Criteria

1. THE Task_List SHALL provide an Edit control for each Task.
2. WHEN the User activates the Edit control on a Task, THE Task_List SHALL replace the Task's title display with an editable input field pre-filled with the current title.
3. WHEN the User confirms the edit with a non-empty title, THE Task_List SHALL update the Task title and persist the change to Local_Storage.
4. IF the User confirms an edit with an empty title, THEN THE Task_List SHALL not save the change and SHALL display an inline validation message.
5. WHEN the User cancels the edit, THE Task_List SHALL restore the original title without making any changes.

---

### Requirement 8: Task Completion

**User Story:** As a User, I want to mark tasks as done, so that I can track my progress and feel a sense of accomplishment.

#### Acceptance Criteria

1. THE Task_List SHALL provide a completion toggle (checkbox or equivalent) for each Task.
2. WHEN the User activates the completion toggle on an incomplete Task, THE Task_List SHALL mark the Task as completed and visually distinguish it (e.g., strikethrough text).
3. WHEN the User activates the completion toggle on a completed Task, THE Task_List SHALL mark the Task as incomplete and restore its standard visual style.
4. WHEN the completion state of a Task changes, THE Task_List SHALL persist the updated task collection in Local_Storage.

---

### Requirement 9: Task Deletion

**User Story:** As a User, I want to delete tasks I no longer need, so that my list stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Task_List SHALL provide a Delete control for each Task.
2. WHEN the User activates the Delete control on a Task, THE Task_List SHALL remove that Task from the list permanently.
3. WHEN a Task is deleted, THE Task_List SHALL persist the updated task collection in Local_Storage.

---

### Requirement 10: Task Persistence

**User Story:** As a User, I want my tasks to survive a page reload, so that I don't lose my task list when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Task_List SHALL read the `tasks` key from Local_Storage and render all stored Tasks.
2. IF Local_Storage contains no `tasks` key, THEN THE Task_List SHALL render an empty list without errors.

---

### Requirement 11: Quick Links Management

**User Story:** As a User, I want to add and delete shortcut buttons to my favorite websites, so that I can navigate quickly without typing URLs.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL provide a form with a label input and a URL input for adding new Links.
2. WHEN the User submits a new Link with a non-empty label and a valid URL, THE Quick_Links widget SHALL add a new Link button to the panel.
3. WHEN the User submits a new Link, THE Quick_Links widget SHALL persist the updated link collection in Local_Storage under the key `quickLinks`.
4. IF the User submits a Link with an empty label or empty URL, THEN THE Quick_Links widget SHALL not create the Link and SHALL display an inline validation message.
5. IF the User submits a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links widget SHALL prepend `https://` to the URL before saving.
6. THE Quick_Links widget SHALL provide a Delete control on each Link button.
7. WHEN the User activates the Delete control on a Link, THE Quick_Links widget SHALL remove that Link from the panel and persist the updated collection in Local_Storage.

---

### Requirement 12: Quick Links Navigation

**User Story:** As a User, I want to click a quick-link button to open the target website, so that I can navigate to my favorites with a single click.

#### Acceptance Criteria

1. WHEN the User activates a Link button, THE Quick_Links widget SHALL open the associated URL in a new browser tab.
2. WHEN the Dashboard loads, THE Quick_Links widget SHALL read the `quickLinks` key from Local_Storage and render all stored Links.
3. IF Local_Storage contains no `quickLinks` key, THEN THE Quick_Links widget SHALL render an empty panel without errors.

---

### Requirement 13: Light / Dark Mode

**User Story:** As a User, I want to switch between light and dark color schemes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a theme toggle control visible at all times.
2. WHEN the User activates the theme toggle, THE Dashboard SHALL switch the active Theme between `light` and `dark`.
3. WHEN the Theme changes, THE Dashboard SHALL apply the corresponding color scheme to all visible UI elements without a page reload.
4. WHEN the Theme changes, THE Dashboard SHALL persist the selected Theme in Local_Storage under the key `theme`.
5. WHEN the Dashboard loads, THE Dashboard SHALL read the `theme` key from Local_Storage and apply the stored Theme before rendering content, preventing a flash of incorrect theme.
6. IF Local_Storage contains no `theme` key, THEN THE Dashboard SHALL apply the `light` Theme as the default.

---

### Requirement 14: Cross-Browser Compatibility

**User Story:** As a User, I want the Dashboard to work correctly regardless of which modern browser I use, so that I'm not locked into a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render and function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
2. THE Dashboard SHALL use only standard HTML5, CSS3, and ECMAScript 2015+ (ES6+) features with broad browser support, without relying on any external libraries or frameworks.
3. THE Dashboard SHALL use only the `localStorage` Web API for persistence, without cookies, IndexedDB, or server-side storage.

---

### Requirement 15: File and Folder Structure

**User Story:** As a developer, I want the project to follow a specific file structure, so that the codebase is organized and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly three files: `index.html`, `css/style.css`, and `js/script.js`.
2. THE Dashboard SHALL load all styles from `css/style.css` only, with no inline `<style>` blocks or additional external stylesheets.
3. THE Dashboard SHALL load all JavaScript from `js/script.js` only, with no inline `<script>` blocks containing logic and no additional external scripts.
