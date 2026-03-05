const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const currentLang = params.get("lang") || "ko";

document.documentElement.lang = currentLang;

const STORAGE_KEY = "profiles";
const DEFAULT_IMAGE = "images/default-profile.png";

/* =============================
    Home Button
============================= */

const homeBtn = document.getElementById("homeBtn");

if (homeBtn) {
  homeBtn.onclick = () => {
    window.location.href = "index.html";
  };
}

/* =============================
   Storage Helper
============================= */

function getProfiles() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveProfiles(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =============================
   Init Cache Load (robust)
============================= */

async function loadDevelopers() {

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    return JSON.parse(stored);
  }

  const paths = [
    "./data/developers.json",
    "/Developer-Wiki/data/developers.json",
    "./developers.json",
    "/Developer-Wiki/developers.json"
  ];

  for (const p of paths) {

    try {

      const res = await fetch(p);

      if (!res.ok) continue;

      const data = await res.json();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      return data;

    } catch (err) {
      continue;
    }
  }

  console.error("Failed to load developers.json from any known path.");
  return [];
}

/* =============================
   Language Button
============================= */

document.querySelectorAll("[data-lang]").forEach(btn => {

  if (btn.dataset.lang === currentLang) {
    btn.classList.add("active");
  }

  btn.addEventListener("click", () => {
    window.location.href =
      `profile.html?id=${id}&lang=${btn.dataset.lang}`;
  });

});

/* =============================
   Render Helpers
============================= */

function clearBoxes() {

  document.getElementById("profile-stack").innerHTML = "";
  document.getElementById("profile-interests").innerHTML = "";
  document.getElementById("profile-projects").innerHTML = "";
  document.getElementById("profile-links").innerHTML = "";

}

/* =============================
   Image Safe Loader
============================= */

function setSafeImage(imgElement, src) {

  if (!src) {
    imgElement.src = DEFAULT_IMAGE;
    return;
  }

  imgElement.src = src;

  imgElement.onerror = () => {
    imgElement.src = DEFAULT_IMAGE;
  };

}

/* =============================
   Profile Renderer
============================= */

function renderProfile(dev) {

  if (!dev) return;

  clearBoxes();

  /* Top */

  const img = document.getElementById("profile-image");
  setSafeImage(img, dev.image);

  document.getElementById("profile-activity").textContent =
    dev.activityName[currentLang];

  document.getElementById("profile-role").textContent =
    dev.role[currentLang];

  document.getElementById("profile-tagline").textContent =
    dev.tagline[currentLang];

  /* Basic Info */

  document.getElementById("profile-name").textContent = dev.name;

  document.getElementById("profile-affiliation").textContent =
    dev.affiliation;

  document.getElementById("profile-started").textContent =
    dev.startedYear;

  /* Stack */

  const stackBox = document.getElementById("profile-stack");

  dev.stack.forEach(s => {

    const span = document.createElement("span");
    span.textContent = s;
    stackBox.appendChild(span);

  });

  /* Interests */

  const interestBox = document.getElementById("profile-interests");

  dev.interests.forEach(i => {

    const span = document.createElement("span");
    span.textContent = i;
    interestBox.appendChild(span);

  });

  /* Projects */

  const projectBox = document.getElementById("profile-projects");

  dev.projects.forEach(p => {

    const div = document.createElement("div");
    div.className = "project-item";

    const title = document.createElement("h4");
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.textContent = p.description[currentLang];

    const link = document.createElement("a");
    link.href = p.link;
    link.target = "_blank";
    link.textContent = "View Project";

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(link);

    projectBox.appendChild(div);

  });

  /* External Links */

  const linkBox = document.getElementById("profile-links");

  Object.entries(dev.links).forEach(([key, value]) => {

    if (!value) return;

    const a = document.createElement("a");

    a.href = value;
    a.target = "_blank";
    a.textContent = key.toUpperCase();

    linkBox.appendChild(a);

  });

}

/* =============================
   Update + Render (Future Use)
============================= */

function updateAndRenderProfile(id, newData) {

  const profiles = getProfiles();

  const updated = profiles.map(p =>
    p.id === id ? { ...p, ...newData } : p
  );

  saveProfiles(updated);

  const dev = updated.find(d => d.id === id);

  renderProfile(dev);

}

/* =============================
   Page Load
============================= */

loadDevelopers().then(data => {

  const dev = data.find(d => d.id === id);

  if (!dev) return;

  renderProfile(dev);

});
