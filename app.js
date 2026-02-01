const lanes = {
  ideas: null,
  progress: null,
  done: null,
};

const counts = {
  ideas: null,
  progress: null,
  done: null,
};

let form;
let taskInput;
let laneSelect;
let dateInput;
let formError;
let focusCount;

const updateCounts = () => {
  Object.entries(lanes).forEach(([key, list]) => {
    if (!list || !counts[key]) return;
    counts[key].textContent = list.children.length.toString();
  });

  if (focusCount) {
    const total = Object.values(lanes).reduce((sum, list) => {
      if (!list) return sum;
      return sum + list.children.length;
    }, 0);
    focusCount.textContent = total.toString();
  }
};

const buildListItem = ({ title, note, dateLabel }) => {
  const item = document.createElement("li");
  const strong = document.createElement("strong");
  strong.textContent = title;

  const meta = document.createElement("span");
  meta.textContent = [note, dateLabel].filter(Boolean).join(" · ");

  item.appendChild(strong);
  if (meta.textContent) {
    item.appendChild(meta);
  }

  return item;
};

const handleSubmit = (event) => {
  event.preventDefault();
  if (!taskInput || !laneSelect) return;

  const title = taskInput.value.trim();
  if (!title) {
    if (formError) {
      formError.textContent = "Please enter a task name.";
    }
    taskInput.focus();
    return;
  }

  const laneKey = laneSelect.value;
  const lane = lanes[laneKey];
  if (!lane) {
    if (formError) {
      formError.textContent = "Select a valid lane.";
    }
    return;
  }

  const dueDate = dateInput?.value;
  const dateLabel = dueDate
    ? `Target: ${new Date(`${dueDate}T00:00:00`).toLocaleDateString([], {
        month: "short",
        day: "2-digit",
      })}`
    : "";

  const item = buildListItem({
    title,
    note: "Added just now",
    dateLabel,
  });

  lane.appendChild(item);
  taskInput.value = "";
  if (dateInput) {
    dateInput.value = "";
  }
  if (formError) {
    formError.textContent = "";
  }
  updateCounts();
};

const init = () => {
  form = document.querySelector("#task-form");
  taskInput = document.querySelector("#task-input");
  laneSelect = document.querySelector("#lane-select");
  dateInput = document.querySelector("#date-input");
  formError = document.querySelector("#form-error");
  focusCount = document.querySelector("#focus-count");

  lanes.ideas = document.querySelector("#ideas-list");
  lanes.progress = document.querySelector("#progress-list");
  lanes.done = document.querySelector("#done-list");

  counts.ideas = document.querySelector("#count-ideas");
  counts.progress = document.querySelector("#count-progress");
  counts.done = document.querySelector("#count-done");

  if (!form || !taskInput || !laneSelect) return;

  form.addEventListener("submit", handleSubmit);
  updateCounts();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
