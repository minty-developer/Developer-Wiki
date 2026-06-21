// [---IMPORT---]
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

// [---DEFAULT VARS---]
const DEFAULT_IMAGE = "images/default-profile.png";
const ADMIN_UID = "rzwqPY36dvPq4yovQ8pwfy7Mz4o1";
const SUPPORTED_LANGUAGES = ["ko", "en", "ja"];

// [---SYSTEM VARS---]
const params = new URLSearchParams(window.location.search);
const requestedLang = params.get("lang") || "ko";
const currentLang = SUPPORTED_LANGUAGES.includes(requestedLang) ? requestedLang : "ko";

// [---개발자 데이터---]
let developersData = [];

// [---언어 반영---]
document.documentElement.lang = currentLang;

// [---현재 링크 정규화---]
function normalizeLocalAuthHost() {
  if (window.location.hostname !== "127.0.0.1") return false;

  const nextUrl = new URL(window.location.href);
  nextUrl.hostname = "localhost";
  window.location.replace(nextUrl.href);
  return true;
}

// [---언어 기본값 반영---]
function getLocalizedValue(value, fallback = "") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value[currentLang] || value.ko || fallback;
}

// [---이미지 링크 정규화---]
function normalizeImagePath(src) {
  if (!src) return DEFAULT_IMAGE;
  if (src.startsWith("/Developer-Wiki/")) {
    return src.replace("/Developer-Wiki/", "");
  }
  return src;
}

// [---사진 기본값 반영---]
function setSafeImage(imgElement, src) {
  imgElement.src = normalizeImagePath(src);
  imgElement.onerror = () => {
    imgElement.src = DEFAULT_IMAGE;
  };
}

// [---언어 변경 버튼 초기화---]
function initLanguageButtons() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLang);
    button.addEventListener("click", () => {
      window.location.href = `index.html?lang=${button.dataset.lang}`;
    });
  });
}

// [---카드 로딩---]
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

// [---검색 기능 초기화---]
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

// [---관리자 버튼 초기화---]
function initAuthButton() {
  const loginButton = document.getElementById("loginBtn");
  const adminButton = document.querySelector(".admin-btn");
  if (!loginButton) return;

  //firebase 관리자 확인
  const provider = new GoogleAuthProvider();

  loginButton.addEventListener("click", async () => {
    loginButton.disabled = true;

    try {
      if (auth.currentUser) {
        await signOut(auth);
        return;
      }

      // 로그인 창 띄우기
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

  // 로그인 된 경우
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

// [---현재 개발자 리스트 로드---]
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

// [---INIT---]
window.addEventListener("DOMContentLoaded", () => {
  if (normalizeLocalAuthHost()) return;

  initLanguageButtons();
  initSearch();
  initAuthButton();
  loadDevelopersRealtime();
});