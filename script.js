
"use strict";

/* =========================================================
   NEXUS DASHBOARD
   Step 3: Dashboard functionality
   ========================================================= */

/* ---------- 1. Select HTML elements ---------- */

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menu-toggle");
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.getElementById("dashboard-search");
const chartPeriod = document.getElementById("chart-period");

const projectFilter = document.getElementById("project-filter");
const projectsTableBody = document.getElementById("projects-table-body");
const projectProgressList = document.getElementById("project-progress-list");

const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const activityList = document.getElementById("activity-list");

const statusMessage = document.getElementById("status-message");
const tableEmpty = document.getElementById("table-empty");

/* ---------- 2. Sample dashboard data ---------- */

// These are demonstration figures, not live business analytics.
const defaultProjects = [
  {
    id: 1,
    name: "Website Redesign",
    owner: "Jordan Davis",
    initials: "JD",
    status: "In Progress",
    progress: 72,
    dueDate: "2026-11-05",
    icon: "fa-window-maximize",
    color: "purple"
  },
  {
    id: 2,
    name: "Mobile App",
    owner: "Sarah Wilson",
    initials: "SW",
    status: "In Progress",
    progress: 45,
    dueDate: "2026-11-12",
    icon: "fa-mobile-screen-button",
    color: "blue"
  },
  {
    id: 3,
    name: "Brand Identity",
    owner: "Michael Chen",
    initials: "MC",
    status: "Completed",
    progress: 100,
    dueDate: "2026-10-15",
    icon: "fa-palette",
    color: "green"
  },
  {
    id: 4,
    name: "Marketing Campaign",
    owner: "Amara Okafor",
    initials: "AO",
    status: "On Hold",
    progress: 25,
    dueDate: "2026-11-20",
    icon: "fa-bullhorn",
    color: "orange"
  },
  {
    id: 5,
    name: "Customer Portal",
    owner: "Jordan Davis",
    initials: "JD",
    status: "In Progress",
    progress: 60,
    dueDate: "2026-11-28",
    icon: "fa-users",
    color: "purple"
  }
];

// Validate stored project data before using it.
function isValidProject(project) {
    return (
      project &&
      typeof project.id === "number" &&
      typeof project.name === "string" &&
      typeof project.owner === "string" &&
      typeof project.initials === "string" &&
      ["In Progress", "Completed", "On Hold"].includes(project.status) &&
      Number.isFinite(project.progress) &&
      project.progress >= 0 &&
      project.progress <= 100 &&
      typeof project.dueDate === "string" &&
      typeof project.icon === "string" &&
      ["purple", "blue", "green", "orange"].includes(project.color)
    );
  }
  
  const savedProjects = loadSavedValue("nexus-projects", null);
  

// Restore saved projects, or use the default sample projects.
let projects = loadSavedValue("nexus-projects", defaultProjects);

// Save the current project list in the browser.
function saveProjects() {
  return saveValue("nexus-projects", projects);
}

const defaultTasks = [
  {
    id: 101,
    title: "Review website wireframes",
    due: "Today",
    priority: "High",
    completed: false
  },
  {
    id: 102,
    title: "Prepare project presentation",
    due: "Tomorrow",
    priority: "Medium",
    completed: false
  },
  {
    id: 103,
    title: "Approve new brand colours",
    due: "Oct 25",
    priority: "Low",
    completed: true
  },
  {
    id: 104,
    title: "Update project documentation",
    due: "Oct 26",
    priority: "Medium",
    completed: false
  }
];

const defaultActivities = [
  {
    id: 1,
    icon: "fa-check",
    color: "green",
    message: "<strong>Brand Identity</strong> was marked as completed.",
    time: "Recently"
  },
  {
    id: 2,
    icon: "fa-folder-plus",
    color: "blue",
    message: "<strong>Customer Portal</strong> was added to the workspace.",
    time: "Earlier today"
  },
  {
    id: 3,
    icon: "fa-pen",
    color: "orange",
    message: "<strong>Website Redesign</strong> progress was updated.",
    time: "Yesterday"
  },
  {
    id: 4,
    icon: "fa-users",
    color: "purple",
    message: "<strong>Jordan Davis</strong> reviewed the project schedule.",
    time: "Yesterday"
  }
];

// Chart.js instance. We create it once and update it later.
let performanceChart = null;

// Used to track the dashboard-wide search.
let searchTerm = "";

/* ---------- 3. Safely load saved preferences ---------- */

function loadSavedValue(key, fallbackValue) {
  try {
    const savedValue = localStorage.getItem(key);

    return savedValue === null
      ? fallbackValue
      : JSON.parse(savedValue);
  } catch (error) {
    console.warn(`Could not load ${key}:`, error);
    return fallbackValue;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not save ${key}:`, error);

    showMessage(
      "Browser storage is unavailable. Your latest changes may not persist after refreshing."
    );

    return false;
  }
}

// Restore task completion states without losing the default tasks.
const savedTaskStates = loadSavedValue("nexus-task-states", {});

let tasks = defaultTasks.map((task) => ({
  ...task,
  completed:
    typeof savedTaskStates[task.id] === "boolean"
      ? savedTaskStates[task.id]
      : task.completed
}));

// Restore the theme if the browser has a saved preference.
const savedTheme = loadSavedValue("nexus-theme", "light");

if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
}

// Save only completion states, not the entire task objects.
function saveTaskStates() {
  const states = {};

  tasks.forEach((task) => {
    states[task.id] = task.completed;
  });

  saveValue("nexus-task-states", states);
}

/* ---------- 4. Display accessible status messages ---------- */

function showMessage(message) {
  if (!statusMessage) return;

  statusMessage.textContent = message;
}

/* ---------- 5. Format dates ---------- */

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

/* ---------- 6. Render project table ---------- */

function getStatusClass(status) {
  switch (status) {
    case "Completed":
      return "completed";
    case "On Hold":
      return "on-hold";
    default:
      return "in-progress";
  }
}

function renderProjects() {
  const selectedStatus = projectFilter.value;

  // Apply both the status filter and the search query.
  const visibleProjects = projects.filter((project) => {
    const matchesStatus =
      selectedStatus === "all" ||
      project.status === selectedStatus;

    const searchableText = [
      project.name,
      project.owner,
      project.status,
      formatDate(project.dueDate)
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  projectsTableBody.replaceChildren();

  visibleProjects.forEach((project) => {
    const row = document.createElement("tr");

    const projectCell = document.createElement("td");
    const projectInfo = document.createElement("div");
    const projectIcon = document.createElement("span");
    const projectName = document.createElement("span");

    projectInfo.className = "project-cell";
    projectIcon.className = `project-symbol ${project.color}`;
    projectIcon.innerHTML = `<i class="fa-solid ${project.icon}" aria-hidden="true"></i>`;
    projectName.textContent = project.name;

    projectInfo.append(projectIcon, projectName);
    projectCell.appendChild(projectInfo);

    const ownerCell = document.createElement("td");
    const ownerInfo = document.createElement("div");
    const ownerAvatar = document.createElement("span");
    const ownerName = document.createElement("span");

    ownerInfo.className = "owner-cell";
    ownerAvatar.className = "owner-avatar";
    ownerAvatar.textContent = project.initials;
    ownerName.textContent = project.owner;

    ownerInfo.append(ownerAvatar, ownerName);
    ownerCell.appendChild(ownerInfo);

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    statusBadge.className =
      `status-badge ${getStatusClass(project.status)}`;
    statusBadge.textContent = project.status;
    statusCell.appendChild(statusBadge);

    const progressCell = document.createElement("td");
    const progressWrapper = document.createElement("div");
    const progressTrack = document.createElement("div");
    const progressFill = document.createElement("div");
    const progressText = document.createElement("span");

    progressWrapper.className = "table-progress";
    progressTrack.className = "progress-track";
    progressFill.className = "progress-fill";
    progressFill.style.width = `${project.progress}%`;
    progressTrack.setAttribute(
      "aria-label",
      `${project.progress}% complete`
    );
    progressTrack.appendChild(progressFill);

    progressText.textContent = `${project.progress}%`;

    progressWrapper.append(progressTrack, progressText);
    progressCell.appendChild(progressWrapper);

    const dueCell = document.createElement("td");
    dueCell.textContent = formatDate(project.dueDate);

    row.append(
      projectCell,
      ownerCell,
      statusCell,
      progressCell,
      dueCell
    );

    projectsTableBody.appendChild(row);
  });

  // Tell the user when there are no matching results.
  tableEmpty.classList.toggle("hidden", visibleProjects.length > 0);
}

/* ---------- 7. Render project progress panel ---------- */

function renderProjectProgress() {
  projectProgressList.replaceChildren();

  // Display the first four projects in the progress panel.
  projects.slice(0, 4).forEach((project) => {
    const item = document.createElement("div");
    item.className = "progress-item";

    const top = document.createElement("div");
    top.className = "progress-item-top";

    const name = document.createElement("span");
    name.className = "progress-project-name";
    name.textContent = project.name;

    const percentage = document.createElement("span");
    percentage.className = "progress-percentage";
    percentage.textContent = `${project.progress}%`;

    const track = document.createElement("div");
    track.className = "progress-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(project.progress));
    track.setAttribute("aria-label", `${project.name} progress`);

    const fill = document.createElement("div");
    fill.className = `progress-fill ${project.color}`;
    fill.style.width = `${project.progress}%`;

    top.append(name, percentage);
    track.appendChild(fill);
    item.append(top, track);

    projectProgressList.appendChild(item);
  });
}

/* ---------- 8. Render upcoming tasks ---------- */

function renderTasks() {
  // The search filters tasks by their title and priority.
  const visibleTasks = tasks.filter((task) => {
    const text = `${task.title} ${task.priority}`.toLowerCase();
    return text.includes(searchTerm);
  });

  taskList.replaceChildren();

  visibleTasks.forEach((task) => {
    const row = document.createElement("div");
    row.className = "task-row";

    const checkbox = document.createElement("button");
    checkbox.type = "button";
    checkbox.className = "task-checkbox";

    checkbox.classList.toggle("is-complete", task.completed);
    checkbox.setAttribute(
      "aria-pressed",
      String(task.completed)
    );
    checkbox.setAttribute(
      "aria-label",
      `${task.completed ? "Mark incomplete" : "Complete"}: ${task.title}`
    );

    if (task.completed) {
      checkbox.innerHTML =
        '<i class="fa-solid fa-check" aria-hidden="true"></i>';
    }

    checkbox.addEventListener("click", () => {
      task.completed = !task.completed;

      saveTaskStates();
      renderTasks();
      updateStatistics();

      showMessage(
        task.completed
          ? `${task.title} marked as complete.`
          : `${task.title} marked as incomplete.`
      );
    });

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("p");
    title.className = "task-title";
    title.classList.toggle("is-complete", task.completed);
    title.textContent = task.title;

    const meta = document.createElement("p");
    meta.className = "task-meta";
    meta.textContent = `Due: ${task.due}`;

    details.append(title, meta);

    const priority = document.createElement("span");
    priority.className =
      `task-priority ${task.priority.toLowerCase()}`;
    priority.textContent = task.priority;

    row.append(checkbox, details, priority);
    taskList.appendChild(row);
  });

  const incompleteCount = tasks.filter(
    (task) => !task.completed
  ).length;

  taskCount.textContent =
    `${incompleteCount} pending`;

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "table-empty";
    emptyMessage.textContent = "No matching tasks found.";
    taskList.appendChild(emptyMessage);
  }
}

/* ---------- 9. Render recent activity ---------- */

function renderActivities() {
  activityList.replaceChildren();

  defaultActivities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    const marker = document.createElement("span");
    marker.className = `activity-marker ${activity.color}`;
    marker.innerHTML =
      `<i class="fa-solid ${activity.icon}" aria-hidden="true"></i>`;

    const details = document.createElement("div");
    details.className = "activity-details";

    const message = document.createElement("p");

    // These messages are developer-defined constants, not user input.
    message.innerHTML = activity.message;

    const time = document.createElement("time");
    time.textContent = activity.time;

    details.append(message, time);
    item.append(marker, details);
    activityList.appendChild(item);
  });
}

/* ---------- 10. Update dashboard statistics ---------- */

function updateStatistics() {
  const totalProjects = projects.length;

  // Count completed tasks using the task completion checkboxes.
  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.length - completedTasks;

  const completionRate = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  document.getElementById("total-projects").textContent =
    totalProjects;

  document.getElementById("completed-tasks").textContent =
    completedTasks;

  document.getElementById("pending-tasks").textContent =
    pendingTasks;

  document.getElementById("completion-rate").textContent =
    `${completionRate}%`;

  // These values are demonstration data rather than real analytics.
}

/* ---------- 11. Create performance chart ---------- */

function createPerformanceChart() {
  const canvas = document.getElementById("performance-chart");

  // Chart.js is loaded from the CDN in index.html.
  if (typeof Chart === "undefined" || !canvas) {
    showMessage(
      "The chart library could not load. Check your internet connection."
    );
    return;
  }

  const isDark = document.body.classList.contains("dark-theme");

  const textColor = isDark ? "#aaa9c0" : "#85899f";
  const gridColor = isDark ? "#343348" : "#eceef5";

  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    completed: [8, 12, 9, 16, 13, 18, 15],
    created: [5, 7, 6, 9, 8, 11, 7]
  };

  const monthlyData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    completed: [35, 42, 38, 54],
    created: [24, 31, 29, 40]
  };

  const selectedData =
    chartPeriod.value === "month" ? monthlyData : weeklyData;

  if (performanceChart) {
    performanceChart.destroy();
  }

  performanceChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: selectedData.labels,

      datasets: [
        {
          label: "Completed",
          data: selectedData.completed,
          backgroundColor: "#7057e8",
          borderRadius: 5,
          maxBarThickness: 18
        },
        {
          label: "Created",
          data: selectedData.created,
          backgroundColor: "#c8bcff",
          borderRadius: 5,
          maxBarThickness: 18
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 7,
            boxHeight: 7,
            padding: 18,
            font: {
              family: "Inter",
              size: 10
            }
          }
        },

        tooltip: {
          backgroundColor: isDark ? "#11111c" : "#20233a",
          padding: 11,
          cornerRadius: 8
        }
      },

      scales: {
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            color: textColor,
            font: {
              family: "Inter",
              size: 10
            }
          }
        },

        y: {
          beginAtZero: true,
          border: {
            display: false
          },
          grid: {
            color: gridColor,
            drawTicks: false
          },
          ticks: {
            color: textColor,
            padding: 10,
            precision: 0,
            font: {
              family: "Inter",
              size: 10
            }
          }
        }
      }
    }
  });
}

/* ---------- 12. Change chart time period ---------- */

chartPeriod.addEventListener("change", () => {
  createPerformanceChart();

  showMessage(
    `Performance chart changed to ${
      chartPeriod.value === "month" ? "monthly" : "weekly"
    } view.`
  );
});

/* ---------- 13. Filter projects by status ---------- */

projectFilter.addEventListener("change", () => {
  renderProjects();

  showMessage(
    `Project filter set to ${projectFilter.value}.`
  );
});

/* ---------- 14. Search the dashboard ---------- */

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();

  renderProjects();
  renderTasks();

  showMessage(
    searchTerm
      ? `Dashboard search updated: ${searchInput.value}.`
      : "Dashboard search cleared."
  );
});

/* ---------- 15. Switch light and dark themes ---------- */

function updateThemeButton() {
  const isDark = document.body.classList.contains("dark-theme");

  themeToggle.innerHTML = isDark
    ? '<i class="fa-regular fa-sun" aria-hidden="true"></i>'
    : '<i class="fa-regular fa-moon" aria-hidden="true"></i>';

  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light theme" : "Switch to dark theme"
  );
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");

  const newTheme = document.body.classList.contains("dark-theme")
    ? "dark"
    : "light";

  saveValue("nexus-theme", newTheme);

  updateThemeButton();
  createPerformanceChart();

  showMessage(`Switched to ${newTheme} theme.`);
});

/* ---------- 16. Mobile sidebar navigation ---------- */

function closeSidebar() {
  sidebar.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("is-open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));

  showMessage(
    isOpen ? "Navigation menu opened." : "Navigation menu closed."
  );
});

// Close the mobile menu after the user chooses a navigation link.
sidebar.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
    closeSidebar();
  });
});

// Close the sidebar if the user clicks outside it on a small screen.
document.addEventListener("click", (event) => {
  if (
    window.innerWidth <= 760 &&
    sidebar.classList.contains("is-open") &&
    !sidebar.contains(event.target) &&
    !menuToggle.contains(event.target)
  ) {
    closeSidebar();
  }
});


/* ---------- Step 17: Create and save projects ---------- */

const projectDialog = document.getElementById("project-dialog");
const projectForm = document.getElementById("project-form");
const projectNameInput = document.getElementById("project-name");
const projectOwnerInput = document.getElementById("project-owner");
const projectDueDateInput = document.getElementById("project-due-date");
const projectStatusInput = document.getElementById("project-status");

const closeProjectDialogButton =
  document.getElementById("close-project-dialog");

const cancelProjectButton =
  document.getElementById("cancel-project");

const projectColors = ["purple", "blue", "green", "orange"];

const projectIcons = [
  "fa-folder",
  "fa-laptop",
  "fa-lightbulb",
  "fa-rocket"
];

// Open the form when the user clicks "New project".
document.getElementById("add-project").addEventListener("click", () => {
  projectForm.reset();

 // Use the ISO date format required by an HTML date input.
projectDueDateInput.min = new Date().toISOString().slice(0, 10);

  projectDialog.showModal();
  projectNameInput.focus();
});

// Close the form without saving.
function closeProjectDialog() {
  projectDialog.close();
}

closeProjectDialogButton.addEventListener(
  "click",
  closeProjectDialog
);

cancelProjectButton.addEventListener(
  "click",
  closeProjectDialog
);

// Close the dialog if the user clicks its backdrop.
projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) {
    closeProjectDialog();
  }
});

// Handle the form submission.
projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = projectNameInput.value.trim();
  const owner = projectOwnerInput.value.trim();
  const dueDate = projectDueDateInput.value;
  const status = projectStatusInput.value;

  if (!name || !owner || !dueDate) {
    showMessage("Please complete all required project fields.");
    return;
  }

  // Avoid duplicate project names.
  const alreadyExists = projects.some(
    (project) => project.name.toLowerCase() === name.toLowerCase()
  );

  if (alreadyExists) {
    showMessage("A project with that name already exists.");
    projectNameInput.focus();
    return;
  }

  // A completed project starts at 100% progress.
  const newProject = {
    id: Date.now(),
    name,
    owner,
    initials: owner
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
      status,

      // Completed projects must always show 100% progress.
      progress: status === "Completed" ? 100 : 0,
    dueDate,
    icon: projectIcons[projects.length % projectIcons.length],
    color: projectColors[projects.length % projectColors.length]
  };

  // Add the new project to the beginning of the list.
  projects.unshift(newProject);

  // Save before closing the form.
  const saved = saveProjects();

  // Reset the filters so the new project is visible.
  projectFilter.value = "all";
  searchInput.value = "";
  searchTerm = "";

  renderProjects();
  renderProjectProgress();
  updateStatistics();

  closeProjectDialog();

  showMessage(
    saved
      ? `Project "${name}" created and saved.`
      : `Project "${name}" created for this session, but could not be saved.`
  );
});


/* ---------- 18. Navigate to all projects ---------- */

document.getElementById("view-projects").addEventListener("click", () => {
  document.getElementById("projects").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* ---------- 19. Export a report as CSV ---------- */

document.getElementById("report-button").addEventListener("click", () => {
  const rows = [
    ["Nexus Dashboard Report"],
    ["Generated", new Date().toLocaleString()],
    [],
    ["PROJECTS"],
    ["Project", "Owner", "Status", "Progress", "Due Date"],

    ...projects.map((project) => [
      project.name,
      project.owner,
      project.status,
      `${project.progress}%`,
      project.dueDate
    ]),

    [],
    ["TASKS"],
    ["Task", "Priority", "Due", "Completed"],

    ...tasks.map((task) => [
      task.title,
      task.priority,
      task.due,
      task.completed ? "Yes" : "No"
    ])
  ];

  // Escape CSV values to protect commas and quotation marks.
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        })
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "nexus-dashboard-report.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showMessage("Dashboard report exported as a CSV file.");
});

/* ---------- 20. Notification button ---------- */

document
  .getElementById("notification-button")
  .addEventListener("click", () => {
    const pending = tasks.filter((task) => !task.completed).length;

    window.alert(
      `Nexus Dashboard Notifications\n\n` +
      `You have ${pending} pending task(s).\n` +
      `This is a demonstration notification panel.`
    );

    showMessage(`You have ${pending} pending tasks.`);
  });

/* ---------- 21. Profile button ---------- */

document
  .getElementById("profile-button")
  .addEventListener("click", () => {
    window.alert(
      "Workspace Profile\n\n" +
      "Name: Jordan Davis\n" +
      "Role: Workspace Admin\n\n" +
      "This profile is sample data for the demonstration."
    );
  });

/* ---------- 22. Update footer year ---------- */

document.getElementById("current-year").textContent =
  new Date().getFullYear();

/* ---------- 23. Initialize the application ---------- */

function initializeDashboard() {
  renderProjects();
  renderProjectProgress();
  renderTasks();
  renderActivities();
  updateStatistics();
  updateThemeButton();
  createPerformanceChart();

  console.log("Nexus Dashboard initialized successfully.");
}

// Start the dashboard after the browser loads this script.
initializeDashboard();
