/* To-Do List Life Dashboard — Application Logic */

(function () {
  'use strict';

  // ─── Storage Module ──────────────────────────────────────────────────────────
  // Thin wrapper around localStorage that keeps JSON serialization in one place.
  // Requirements: 10.2, 12.3, 14.3

  const Storage = {
    /**
     * Read and deserialize a value from localStorage.
     * Returns null if the key is absent or the stored value is invalid JSON.
     * @param {string} key
     * @returns {*} parsed value or null
     */
    get(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    },

    /**
     * Serialize a value to JSON and write it to localStorage.
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },

    /**
     * Remove a key from localStorage.
     * @param {string} key
     */
    remove(key) {
      localStorage.removeItem(key);
    },
  };

  // ─── generateId Helper ───────────────────────────────────────────────────────
  // Uses crypto.randomUUID() when available; falls back to a timestamp+random
  // string for older environments.

  function generateId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // ─── Greeting Helper Functions ───────────────────────────────────────────────
  // Pure functions used by the Greeting module. Extracted here so they can be
  // imported/tested independently without a browser environment.
  // Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4

  /**
   * Format a Date object as a zero-padded HH:MM:SS string.
   * @param {Date} date
   * @returns {string} e.g. "09:05:03"
   */
  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  /**
   * Format a Date object as a full human-readable date string.
   * Returns a string of the form "Sunday, 26 October 2025".
   * @param {Date} date
   * @returns {string}
   */
  function formatDate(date) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months   = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    const weekday = weekdays[date.getDay()];
    const day     = date.getDate();
    const month   = months[date.getMonth()];
    const year    = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  /**
   * Return the appropriate greeting prefix for a given hour (0–23).
   *   05–11 → "Good Morning"
   *   12–17 → "Good Afternoon"
   *   18–21 → "Good Evening"
   *   22–04 → "Good Night"
   * @param {number} hour  integer in [0, 23]
   * @returns {string}
   */
  function getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    return 'Good Night'; // covers 22–23 and 0–4
  }

  // ─── formatTimer Helper ──────────────────────────────────────────────────────
  // Pure helper: converts an integer number of seconds in [0, 1500] to a
  // zero-padded "MM:SS" string.
  // Requirement: 4.3

  /**
   * Format a countdown value in seconds as a MM:SS string.
   * @param {number} remaining - integer seconds in [0, 1500]
   * @returns {string} zero-padded "MM:SS" (e.g. 90 → "01:30")
   */
  function formatTimer(remaining) {
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
  }

  // ─── Task CRUD Pure Logic Helpers ───────────────────────────────────────────
  // Pure functions that operate on plain JS arrays/objects with no side-effects.
  // They never touch the DOM or localStorage — callers handle persistence and
  // re-rendering. This makes them straightforward to unit-test and property-test.
  // Requirements: 6.2, 6.4, 6.5, 7.3, 8.2, 8.3, 9.2

  /**
   * Create a new Task object with a generated id and the trimmed title.
   * @param {string} title  Raw task title from user input.
   * @returns {{ id: string, title: string, completed: boolean, createdAt: number }}
   */
  function createTask(title) {
    return {
      id: generateId(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now(),
    };
  }

  /**
   * Check whether a title already exists in the tasks array (case-insensitive).
   * @param {{ title: string }[]} tasks  Current task array.
   * @param {string} title              Raw title to check.
   * @returns {boolean}
   */
  function isDuplicateTask(tasks, title) {
    const normalized = title.trim().toLowerCase();
    return tasks.some(function (task) {
      return task.title.toLowerCase() === normalized;
    });
  }

  /**
   * Return a new tasks array with the matched task's `completed` property flipped.
   * The original array and its objects are never mutated.
   * @param {{ id: string, completed: boolean }[]} tasks
   * @param {string} id  Id of the task to toggle.
   * @returns {typeof tasks}
   */
  function toggleTask(tasks, id) {
    return tasks.map(function (task) {
      if (task.id !== id) return task;
      return Object.assign({}, task, { completed: !task.completed });
    });
  }

  /**
   * Return a new tasks array that excludes the task with the given id.
   * @param {{ id: string }[]} tasks
   * @param {string} id  Id of the task to remove.
   * @returns {typeof tasks}
   */
  function removeTask(tasks, id) {
    return tasks.filter(function (task) {
      return task.id !== id;
    });
  }

  /**
   * Return a new tasks array with the matched task's title replaced by
   * `newTitle.trim()`. The original array and its objects are never mutated.
   * @param {{ id: string, title: string }[]} tasks
   * @param {string} id        Id of the task to update.
   * @param {string} newTitle  New raw title value.
   * @returns {typeof tasks}
   */
  function updateTask(tasks, id, newTitle) {
    return tasks.map(function (task) {
      if (task.id !== id) return task;
      return Object.assign({}, task, { title: newTitle.trim() });
    });
  }

  // ─── normalizeUrl Helper ─────────────────────────────────────────────────────
  // Pure helper: ensures a URL string always begins with http:// or https://.
  // Requirement: 11.5

  /**
   * Ensure a URL has an http(s) prefix.
   * If url does not begin with http:// or https:// (case-insensitive), prepend "https://".
   * @param {string} url
   * @returns {string}
   */
  function normalizeUrl(url) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return 'https://' + url;
  }

  // ─── Theme Module ────────────────────────────────────────────────────────────
  // Manages light/dark color scheme by toggling a `data-theme` attribute on
  // <html>. Must be initialized before any other module to prevent FOCT.
  // Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6

  const Theme = {
    /**
     * Read the persisted theme from Storage (default "light") and apply it to
     * the root <html> element immediately, before the browser paints.
     */
    init() {
      const stored = Storage.get('theme');
      const theme = (stored === 'light' || stored === 'dark') ? stored : 'light';
      document.documentElement.setAttribute('data-theme', theme);
    },

    /**
     * Flip the current theme between "light" and "dark", update the attribute
     * on <html>, and persist the new value.
     */
    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      Storage.set('theme', next);
    },
  };

  // ─── Greeting Module ────────────────────────────────────────────────────────
  // Manages the live clock, date display, and personalized greeting.
  // Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5

  const Greeting = (function () {
    // Module-level variable — keeps the current user name in sync with Storage.
    let userName = null;

    return {
      /**
       * Bootstrap the greeting widget.
       * - Loads userName from Storage.
       * - Renders the clock immediately.
       * - Starts a 1 000 ms interval to keep the clock live.
       * - Wires name-save actions (#name-save-btn click, Enter key on #name-input).
       */
      init() {
        userName = Storage.get('userName') || null;

        // Render once immediately so there is no blank flash on load.
        this.updateClock();

        // Keep the clock ticking every second.
        setInterval(() => this.updateClock(), 1000);

        // ── Name-save logic ──────────────────────────────────────────────────
        const nameInput = document.getElementById('name-input');
        const nameSaveBtn = document.getElementById('name-save-btn');

        const saveName = () => {
          if (!nameInput) return;
          const trimmed = nameInput.value.trim();
          if (trimmed) {
            Storage.set('userName', trimmed);
            userName = trimmed;
          } else {
            Storage.remove('userName');
            userName = null;
          }
          this.updateClock();
        };

        if (nameSaveBtn) {
          nameSaveBtn.addEventListener('click', saveName);
        }

        if (nameInput) {
          nameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') saveName();
          });
        }
      },

      /**
       * Write the current time, date, and greeting string to the DOM.
       * Called once on init and then every second by the interval.
       */
      updateClock() {
        const now = new Date();

        const clockEl = document.getElementById('clock');
        if (clockEl) clockEl.textContent = formatTime(now);

        const dateEl = document.getElementById('date-display');
        if (dateEl) dateEl.textContent = formatDate(now);

        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) {
          const prefix = getGreeting(now.getHours());
          greetingEl.textContent = prefix + (userName ? ', ' + userName + '!' : '!');
        }
      },
    };
  })();

  // ─── Timer Module ────────────────────────────────────────────────────────────
  // Pomodoro-style 25-minute countdown timer.
  // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 5.6

  const Timer = {
    /** Remaining seconds. Starts at 25 * 60 = 1500. */
    remaining: 1500,
    /** Reference to the active setInterval handle, or null when stopped. */
    intervalId: null,
    /** Whether the timer is currently counting down. */
    running: false,

    /**
     * Called once per second while running.
     * Decrements remaining; fires the completion alert when it hits zero.
     */
    tick() {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stop();
        // Show 00:00 explicitly (stop() does not call updateDisplay).
        const display = document.getElementById('timer-display');
        if (display) {
          display.textContent = '00:00';
          // Visual flash: CSS class the stylesheet can animate/highlight.
          display.classList.add('timer-complete');
          setTimeout(() => display.classList.remove('timer-complete'), 2000);
        }
        // Audible / fallback alert (Requirement 4.5).
        window.alert('Focus session complete!');
        return;
      }
      this.updateDisplay();
    },

    /**
     * Start the countdown. No-ops if already running (Requirement 5.2).
     */
    start() {
      if (this.running) return;
      this.running = true;
      this.intervalId = setInterval(this.tick.bind(this), 1000);
      this.updateDisplay();
      this.updateButtonStates();
    },

    /**
     * Pause the countdown (Requirement 5.3).
     * Clears the interval but leaves `remaining` untouched.
     */
    stop() {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.running = false;
      this.updateButtonStates();
    },

    /**
     * Stop the timer and restore it to the initial 25:00 state (Requirement 5.4).
     */
    reset() {
      this.stop();
      this.remaining = 1500;
      this.updateDisplay();
      this.updateButtonStates();
    },

    /**
     * Write the current remaining time to #timer-display.
     * Uses the pure `formatTimer` helper defined above.
     */
    updateDisplay() {
      const display = document.getElementById('timer-display');
      if (display) {
        display.textContent = formatTimer(this.remaining);
      }
    },

    /**
     * Sync the disabled state of Start / Stop buttons to the running flag.
     * Start is disabled while running (Requirement 5.6).
     * Stop  is disabled while not running (Requirement 5.5).
     */
    updateButtonStates() {
      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      if (startBtn) startBtn.disabled = this.running;
      if (stopBtn)  stopBtn.disabled  = !this.running;
    },

    /**
     * Query DOM controls, attach click listeners, and paint the initial state.
     * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
     */
    init() {
      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      const resetBtn = document.getElementById('timer-reset');

      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (stopBtn)  stopBtn.addEventListener('click',  () => this.stop());
      if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

      // Paint 25:00 and correct button disabled states on load.
      this.updateDisplay();
      this.updateButtonStates();
    },
  };

  // ─── TaskList Module ─────────────────────────────────────────────────────────
  // Manages task CRUD, rendering, and persistence.
  // Requirements: 6.1–6.6, 7.1–7.5, 8.1–8.4, 9.1–9.3, 10.1–10.2

  const TaskList = {
    /** In-memory copy of the tasks array. Kept in sync with localStorage. */
    tasks: [],

    /**
     * Clear and rebuild the `#task-list` <ul> from the given tasks array.
     * Each task is rendered as an <li> per the design HTML template.
     * Completed tasks receive the `completed` CSS class and a checked checkbox.
     * Requirements: 8.2, 8.3, 10.1
     *
     * @param {{ id: string, title: string, completed: boolean, createdAt: number }[]} tasks
     */
    render(tasks) {
      const list = document.getElementById('task-list');
      if (!list) return;

      // Wipe the current contents before rebuilding.
      list.innerHTML = '';

      tasks.forEach(function (task) {
        // <li data-id="{id}" class="task-item [completed]">
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.className = 'task-item' + (task.completed ? ' completed' : '');

        // <input type="checkbox" class="task-check" [checked]>
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-check';
        checkbox.checked = task.completed;

        // <span class="task-title">{title}</span>
        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title';
        titleSpan.textContent = task.title;

        // <button class="task-edit-btn" type="button">Edit</button>
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'task-edit-btn';
        editBtn.textContent = 'Edit';

        // <button class="task-delete-btn" type="button">Delete</button>
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'task-delete-btn';
        deleteBtn.textContent = 'Delete';

        li.appendChild(checkbox);
        li.appendChild(titleSpan);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
    },

    /**
     * Bootstrap the task list widget.
     * - Loads tasks from Storage into this.tasks.
     * - Renders the initial task list.
     * - Wires add button, Enter key, and delegated click listener on the list.
     * Requirements: 6.1, 8.1, 9.1, 10.1, 10.2
     */
    init() {
      this.tasks = Storage.get('tasks') ?? [];
      this.render(this.tasks);

      const taskInput  = document.getElementById('task-input');
      const taskAddBtn = document.getElementById('task-add-btn');
      const taskList   = document.getElementById('task-list');

      if (taskAddBtn) {
        taskAddBtn.addEventListener('click', this.add.bind(this));
      }

      if (taskInput) {
        taskInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.add();
        });
      }

      // ── Event delegation on the task list ────────────────────────────────────
      if (taskList) {
        taskList.addEventListener('click', (e) => {
          // Checkbox toggle
          if (e.target.closest('.task-check')) {
            const li = e.target.closest('[data-id]');
            if (!li) return;
            const id = li.dataset.id;
            this.tasks = toggleTask(this.tasks, id);
            Storage.set('tasks', this.tasks);
            this.render(this.tasks);
            return;
          }

          // Delete button
          if (e.target.closest('.task-delete-btn')) {
            const li = e.target.closest('[data-id]');
            if (!li) return;
            const id = li.dataset.id;
            this.tasks = removeTask(this.tasks, id);
            Storage.set('tasks', this.tasks);
            this.render(this.tasks);
            return;
          }

          // Edit button
          if (e.target.closest('.task-edit-btn')) {
            const li = e.target.closest('[data-id]');
            if (!li) return;
            const id = li.dataset.id;
            const task = this.tasks.find((t) => t.id === id);
            this.enterEditMode(li, task);
            return;
          }
        });
      }
    },

    /**
     * Read the task input, validate, create a new task, persist, and re-render.
     * Shows an inline validation message on failure; clears it on success.
     * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6
     */
    add() {
      const taskInput     = document.getElementById('task-input');
      const validationMsg = document.getElementById('task-validation-msg');
      if (!taskInput) return;

      const title = taskInput.value;

      const showValidation = (msg) => {
        if (validationMsg) {
          validationMsg.textContent = msg;
          validationMsg.classList.add('visible');
        }
      };

      // Empty / whitespace guard
      if (!title.trim()) {
        showValidation('Task title cannot be empty.');
        return;
      }

      // Duplicate guard
      if (isDuplicateTask(this.tasks, title)) {
        showValidation('This task already exists.');
        return;
      }

      // Success path
      if (validationMsg) {
        validationMsg.classList.remove('visible');
        validationMsg.textContent = '';
      }

      const newTask = createTask(title);
      this.tasks.push(newTask);
      Storage.set('tasks', this.tasks);
      this.render(this.tasks);
      taskInput.value = '';
    },

    /**
     * Replace the task item's display view with an inline edit form.
     * Pre-fills the input with the current title and wires Save / Cancel.
     * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
     *
     * @param {HTMLElement} li  The <li> element for the task.
     * @param {{ id: string, title: string, completed: boolean }} task
     */
    enterEditMode(li, task) {
      // Remove the existing title span and action buttons, keeping the checkbox.
      const titleSpan = li.querySelector('.task-title');
      const editBtn   = li.querySelector('.task-edit-btn');
      const deleteBtn = li.querySelector('.task-delete-btn');

      if (titleSpan) li.removeChild(titleSpan);
      if (editBtn)   li.removeChild(editBtn);
      if (deleteBtn) li.removeChild(deleteBtn);

      // ── Build edit controls ─────────────────────────────────────────────────

      // <input class="task-edit-input" type="text" value="{task.title}">
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'task-edit-input';
      editInput.value = task.title;

      // Inline error message element (hidden by default).
      const errorMsg = document.createElement('span');
      errorMsg.className = 'task-edit-error';
      errorMsg.style.color = 'var(--color-error, #c0392b)';
      errorMsg.style.fontSize = '0.85em';
      errorMsg.style.marginLeft = '0.25rem';
      errorMsg.hidden = true;

      // <button class="task-save-btn" type="button">Save</button>
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'task-save-btn';
      saveBtn.textContent = 'Save';

      // <button class="task-cancel-btn" type="button">Cancel</button>
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'task-cancel-btn';
      cancelBtn.textContent = 'Cancel';

      li.appendChild(editInput);
      li.appendChild(errorMsg);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);

      // Focus the input immediately (Requirement 7.2).
      editInput.focus();

      // ── Save handler ────────────────────────────────────────────────────────
      const handleSave = () => {
        const newTitle = editInput.value;

        if (!newTitle.trim()) {
          // Requirement 7.4: validate non-empty.
          errorMsg.textContent = 'Title cannot be empty.';
          errorMsg.hidden = false;
          editInput.focus();
          return;
        }

        // Hide any previous error.
        errorMsg.hidden = true;

        // Requirement 7.3: update task, persist, re-render.
        this.tasks = updateTask(this.tasks, task.id, newTitle);
        Storage.set('tasks', this.tasks);
        this.render(this.tasks);
      };

      // ── Cancel handler ──────────────────────────────────────────────────────
      const handleCancel = () => {
        // Requirement 7.5: discard changes, restore original view.
        this.render(this.tasks);
      };

      saveBtn.addEventListener('click', handleSave);
      cancelBtn.addEventListener('click', handleCancel);

      // Also allow pressing Enter to save and Escape to cancel.
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  handleSave();
        if (e.key === 'Escape') handleCancel();
      });
    },
  };

  // ─── QuickLinks Module ───────────────────────────────────────────────────────
  // Manages bookmark shortcuts with persistence.
  // Requirements: 11.1–11.7, 12.1–12.3

  const QuickLinks = {
    /** In-memory copy of the links array. Kept in sync with localStorage. */
    links: [],

    /**
     * Clear and rebuild the `#quick-links-panel` from the given links array.
     * Each link is rendered as a div containing an anchor and a delete button,
     * per the design HTML template.
     * Requirements: 12.1, 12.2
     *
     * @param {{ id: string, label: string, url: string }[]} links
     */
    render(links) {
      const panel = document.getElementById('quick-links-panel');
      if (!panel) return;

      // Wipe the current contents before rebuilding.
      panel.innerHTML = '';

      links.forEach(function (link) {
        // <div class="link-item" data-id="{id}">
        const div = document.createElement('div');
        div.className = 'link-item';
        div.dataset.id = link.id;

        // <a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>
        const anchor = document.createElement('a');
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.textContent = link.label;

        // <button class="link-delete-btn" type="button">×</button>
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'link-delete-btn';
        deleteBtn.textContent = '×';

        div.appendChild(anchor);
        div.appendChild(deleteBtn);
        panel.appendChild(div);
      });
    },

    /**
     * Bootstrap the quick-links widget.
     * - Loads links from Storage into this.links.
     * - Renders the initial link list.
     * - Wires add button and delegated click listener on the panel.
     * Requirements: 11.1, 11.6, 12.1, 12.2, 12.3
     */
    init() {
      this.links = Storage.get('quickLinks') ?? [];
      this.render(this.links);

      const linkAddBtn = document.getElementById('link-add-btn');
      const panel      = document.getElementById('quick-links-panel');

      if (linkAddBtn) {
        linkAddBtn.addEventListener('click', this.add.bind(this));
      }

      // ── Event delegation on the quick-links panel ──────────────────────────
      if (panel) {
        panel.addEventListener('click', (e) => {
          const deleteBtn = e.target.closest('.link-delete-btn');
          if (!deleteBtn) return;
          const div = e.target.closest('[data-id]');
          if (!div) return;
          const id = div.dataset.id;
          this.links = this.links.filter((link) => link.id !== id);
          Storage.set('quickLinks', this.links);
          this.render(this.links);
        });
      }
    },

    /**
     * Read label and URL inputs, validate, normalize URL, create a Link object,
     * persist, re-render, and clear the inputs.
     * Requirements: 11.2, 11.3, 11.4, 11.5, 11.7
     */
    add() {
      const labelInput    = document.getElementById('link-label-input');
      const urlInput      = document.getElementById('link-url-input');
      const validationMsg = document.getElementById('link-validation-msg');
      if (!labelInput || !urlInput) return;

      const label = labelInput.value;
      const url   = urlInput.value;

      const showValidation = (msg) => {
        if (validationMsg) {
          validationMsg.textContent = msg;
          validationMsg.classList.add('visible');
        }
      };

      // Label guard
      if (!label.trim()) {
        showValidation('Label is required.');
        return;
      }

      // URL guard
      if (!url.trim()) {
        showValidation('URL is required.');
        return;
      }

      // Success path — clear any previous validation message
      if (validationMsg) {
        validationMsg.classList.remove('visible');
        validationMsg.textContent = '';
      }

      const normalizedUrl = normalizeUrl(url.trim());
      const newLink = {
        id:    generateId(),
        label: label.trim(),
        url:   normalizedUrl,
      };

      this.links.push(newLink);
      Storage.set('quickLinks', this.links);
      this.render(this.links);

      // Clear inputs after a successful add
      labelInput.value = '';
      urlInput.value   = '';
    },
  };

  // ─── Initialization ──────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    // Theme.init() MUST be the first call — prevents FOCT (flash of correct theme).
    Theme.init();

    // Wire the theme toggle button.
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        Theme.toggle();
      });
    }

    // Initialize remaining modules.
    Greeting.init();
    Timer.init();
    TaskList.init();
    QuickLinks.init();
  });

})();