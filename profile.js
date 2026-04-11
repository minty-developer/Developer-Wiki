import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/* =============================
   URL
============================= */

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const currentLang = params.get("lang") || "ko";

document.documentElement.lang = currentLang;

/* =============================
   Load Data
============================= */

async function getProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs.map(doc => doc.data());
}

/* =============================
   Render
============================= */

function renderProfile(dev) {

  if (!dev) return;

  /* 기본 정보 */

  document.getElementById("profile-name").textContent = dev.name || "";

  document.getElementById("profile-activity").textContent =
    dev.activityName?.[currentLang] || dev.activityName?.ko || "";

  document.getElementById("profile-role").textContent =
    dev.role?.[currentLang] || dev.role?.ko || "";

  document.getElementById("profile-tagline").textContent =
    dev.tagline?.[currentLang] || dev.tagline?.ko || "";

  document.getElementById("profile-affiliation").textContent =
    dev.affiliation || "";

  document.getElementById("profile-started").textContent =
    dev.startedYear || "";

  /* Stack */

  const stackBox = document.getElementById("profile-stack");
  stackBox.innerHTML = "";

  (dev.stack || []).forEach(s => {
    const span = document.createElement("span");
    span.textContent = s;
    stackBox.appendChild(span);
  });

  /* Interests */

  const interestBox = document.getElementById("profile-interests");
  interestBox.innerHTML = "";

  (dev.interests || []).forEach(i => {
    const span = document.createElement("span");
    span.textContent = i;
    interestBox.appendChild(span);
  });

  /* 🔥 Projects (핵심) */

  const projectBox = document.getElementById("profile-projects");
  projectBox.innerHTML = "";

  if (Array.isArray(dev.projects)) {

    dev.projects.forEach(p => {

      const div = document.createElement("div");
      div.className = "project-item";

      const title = document.createElement("h4");
      title.textContent = p.name || "";

      const desc = document.createElement("p");
      desc.textContent =
        typeof p.description === "object"
          ? p.description[currentLang] || p.description.ko
          : p.description || "";

      const link = document.createElement("a");
      link.href = p.link || "#";
      link.target = "_blank";
      link.textContent = "View Project";

      div.appendChild(title);
      div.appendChild(desc);
      div.appendChild(link);

      projectBox.appendChild(div);

    });

  }

  /* Links */

  const linkBox = document.getElementById("profile-links");
  linkBox.innerHTML = "";

  if (dev.links) {
    Object.entries(dev.links).forEach(([key, value]) => {
      if (!value) return;

      const a = document.createElement("a");
      a.href = value;
      a.target = "_blank";
      a.textContent = key.toUpperCase();

      linkBox.appendChild(a);
    });
  }
}

/* =============================
   Init
============================= */

window.addEventListener("DOMContentLoaded", async () => {

  const data = await getProfiles();
  const dev = data.find(d => d.id === id);

  console.log("dev:", dev); // 디버깅용

  renderProfile(dev);

});

/* =============================
   Home Button
============================= */

const homeBtn = document.getElementById("homeBtn");

homeBtn.addEventListener(onclick, () => {
  location.href="https://minty-developer.github.io/Developer-Wiki/";
});