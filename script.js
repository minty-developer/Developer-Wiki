import { auth, db } from "./firebase.js";
import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const DEFAULT_IMAGE = "images/default-profile.png";
const ADMIN_UID = "rzwqPY36dvPq4yovQ8pwfy7Mz4o1";
const SUPPORTED_LANGUAGES = ["ko", "en", "ja"];

const params = new URLSearchParams(window.location.search);
const requestedLang = params.get("lang") || "ko";
const currentLang = SUPPORTED_LANGUAGES.includes(requestedLang) ? requestedLang : "ko";

let developersData = [];

document.documentElement.lang = currentLang;

function normalizeLocalAuthHost() {
  if (window.location.hostname !== "127.0.0.1") return false;

  const nextUrl = new URL(window.location.href);
  nextUrl.hostname = "localhost";
  window.location.replace(nextUrl.href);
  return true;
}

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

function setSafeImage(imgElement, src) {
  imgElement.src = normalizeImagePath(src);
  imgElement.onerror = () => {
    imgElement.src = DEFAULT_IMAGE;
  };
}

function initLanguageButtons() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
    button.addEventListener("click", () => {
      window.location.href = `index.html?lang=${button.dataset.lang}`;
    });
  });
}

function renderCards(data) {
  const container = document.querySelector(".card-container");
  if (!container) return;

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>No profiles found. Import data from the admin page.</p>";
    return;
  }

  data.forEach((developer) => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.addEventListener("click", () => {
      window.location.href = `profile.html?id=${developer.id}&lang=${currentLang}`;
    });

    const image = document.createElement("img");
    image.className = "card-image";
    image.alt = getLocalizedValue(developer.activityName, developer.name || "Profile image");
    setSafeImage(image, developer.image);

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = getLocalizedValue(developer.activityName, developer.name || "Unnamed");

    const role = document.createElement("div");
    role.className = "card-bio";
    role.textContent = getLocalizedValue(developer.role);

    const stackBox = document.createElement("div");
    stackBox.className = "card-stack";

    (developer.stack || []).forEach((stack) => {
      const item = document.createElement("span");
      item.textContent = stack;
      stackBox.appendChild(item);
    });

    card.append(image, name, role, stackBox);
    container.appendChild(card);
  });
}

function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    if (!keyword) {
      renderCards(developersData);
      return;
    }

    const filtered = developersData.filter((developer) => {
      const searchableText = [
        developer.id,
        developer.name,
        developer.activityName?.ko,
        developer.activityName?.en,
        developer.activityName?.ja,
        developer.role?.ko,
        developer.role?.en,
        developer.role?.ja,
        ...(developer.stack || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });

    renderCards(filtered);
  });
}

function initAuthButton() {
  const loginButton = document.getElementById("loginBtn");
  const adminButton = document.querySelector(".admin-btn");
  if (!loginButton) return;

  const provider = new GoogleAuthProvider();

  loginButton.addEventListener("click", async () => {
    loginButton.disabled = true;

    try {
      if (auth.currentUser) {
        await signOut(auth);
        return;
      }

      await signInWithPopup(auth, provider);
    } catch (error) {
      if (error.code === "auth/unauthorized-domain") {
        alert("Google Login is not allowed on this local domain. Open this page with localhost instead of 127.0.0.1.");
      } else {
        alert(`Google Login failed: ${error.message}`);
      }
      console.error(error);
    } finally {
      loginButton.disabled = false;
    }
  });

  onAuthStateChanged(auth, (user) => {
    loginButton.textContent = user ? "Logout" : "Google Login";
    if (adminButton) {
      adminButton.hidden = !user || user.uid !== ADMIN_UID;
    }
  });

  adminButton?.addEventListener("click", () => {
    window.location.href = "admin.html";
  });
}

function loadDevelopersRealtime() {
  onSnapshot(collection(db, "profiles"), (snapshot) => {
    developersData = snapshot.docs
      .map((profileDoc) => ({
        docId: profileDoc.id,
        ...profileDoc.data()
      }))
      .sort((a, b) => (a.id || "").localeCompare(b.id || ""));

    renderCards(developersData);
  }, (error) => {
    console.error(error);
    renderCards([]);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (normalizeLocalAuthHost()) return;

  initLanguageButtons();
  initSearch();
  initAuthButton();
  loadDevelopersRealtime();
});
