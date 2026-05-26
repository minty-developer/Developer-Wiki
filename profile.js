import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const DEFAULT_IMAGE = "images/default-profile.png";
const SUPPORTED_LANGUAGES = ["ko", "en", "ja"];

const params = new URLSearchParams(window.location.search);
const profileId = params.get("id");
const requestedLang = params.get("lang") || "ko";
const currentLang = SUPPORTED_LANGUAGES.includes(requestedLang) ? requestedLang : "ko";

document.documentElement.lang = currentLang;

function getLocalizedValue(value, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[currentLang] || value.ko || fallback;
}

function normalizeImagePath(src) {
  if (!src) return DEFAULT_IMAGE;
  if (src.startsWith("/Developer-Wiki/")) {
    return src.replace("/Developer-Wiki/", "");
  }
  return src;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || "";
}

function renderTagList(containerId, items = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  items.forEach((item) => {
    const tag = document.createElement("span");
    tag.textContent = item;
    container.appendChild(tag);
  });
}

function renderProjects(projects = []) {
  const projectBox = document.getElementById("profile-projects");
  if (!projectBox) return;

  projectBox.innerHTML = "";

  projects.forEach((project) => {
    const item = document.createElement("div");
    item.className = "project-item";

    const title = document.createElement("h4");
    title.textContent = project.name || "";

    const description = document.createElement("p");
    description.textContent = getLocalizedValue(project.description);

    const link = document.createElement("a");
    link.href = project.link || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View Project";

    item.append(title, description, link);
    projectBox.appendChild(item);
  });
}

function renderLinks(links = {}) {
  const linkBox = document.getElementById("profile-links");
  if (!linkBox) return;

  linkBox.innerHTML = "";

  Object.entries(links).forEach(([key, value]) => {
    if (!value) return;

    const link = document.createElement("a");
    link.href = value;
    link.target = key === "email" ? "_self" : "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = key.toUpperCase();

    linkBox.appendChild(link);
  });
}

function renderProfile(profile) {
  if (!profile) {
    setText("profile-activity", "Profile not found");
    return;
  }

  const image = document.getElementById("profile-image");
  if (image) {
    image.src = normalizeImagePath(profile.image);
    image.alt = getLocalizedValue(profile.activityName, profile.name || "Profile image");
    image.onerror = () => {
      image.src = DEFAULT_IMAGE;
    };
  }

  setText("profile-name", profile.name);
  setText("profile-activity", getLocalizedValue(profile.activityName));
  setText("profile-role", getLocalizedValue(profile.role));
  setText("profile-tagline", getLocalizedValue(profile.tagline));
  setText("profile-affiliation", profile.affiliation);
  setText("profile-started", profile.startedYear);

  renderTagList("profile-stack", profile.stack || []);
  renderTagList("profile-interests", profile.interests || []);
  renderProjects(Array.isArray(profile.projects) ? profile.projects : []);
  renderLinks(profile.links || {});
}

async function getProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs.map((doc) => doc.data());
}

async function getLocalProfiles() {
  try {
    const response = await fetch("developers.json");
    if (!response.ok) throw new Error(`developers.json returned ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function mergeProfiles(localProfiles, remoteProfiles) {
  const profilesById = new Map();

  localProfiles.forEach((profile) => {
    if (profile.id) profilesById.set(profile.id, profile);
  });

  remoteProfiles.forEach((profile) => {
    if (!profile.id) return;
    profilesById.set(profile.id, {
      ...profilesById.get(profile.id),
      ...profile
    });
  });

  return Array.from(profilesById.values());
}

function initLanguageButtons() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
    button.addEventListener("click", () => {
      window.location.href = `profile.html?id=${profileId}&lang=${button.dataset.lang}`;
    });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  initLanguageButtons();

  const homeButton = document.getElementById("homeBtn");
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.location.href = `index.html?lang=${currentLang}`;
    });
  }

  const [localProfiles, remoteProfiles] = await Promise.all([
    getLocalProfiles(),
    getProfiles().catch((error) => {
      console.error(error);
      return [];
    })
  ]);
  const profiles = mergeProfiles(localProfiles, remoteProfiles);
  renderProfile(profiles.find((profile) => profile.id === profileId));
});
