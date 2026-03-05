const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const currentLang = params.get("lang") || "ko";

document.documentElement.lang = currentLang;

const STORAGE_KEY = "profiles";

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

  // 시도할 경로들 (프로젝트에 따라 위치가 다를 수 있어서 순차 시도)
  const paths = [
    "./data/developers.json",
    "/Developer-Wiki/data/developers.json",
    "./developers.json",
    "/Developer-Wiki/developers.json"
  ];

  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (!res.ok) {
        // 404 등 응답 실패면 다음 경로 시도
        continue;
      }
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (err) {
      // 네트워크 에러 등 무시하고 다음 경로 시도
      continue;
    }
  }

  // 모두 실패하면 빈 배열 반환 (호출부에서 dev 체크하므로 안전)
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
   Profile Renderer
============================= */

function renderProfile(dev) {

  if (!dev) return;

  clearBoxes();

  // Top
  document.getElementById("profile-image").src = dev.image;

  document.getElementById("profile-activity").textContent =
    dev.activityName[currentLang];

  document.getElementById("profile-role").textContent =
    dev.role[currentLang];

  document.getElementById("profile-tagline").textContent =
    dev.tagline[currentLang];

  // Basic Info
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
