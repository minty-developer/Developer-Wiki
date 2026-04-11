import { getFirestore, collection, onSnapshot } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "developer-wiki-31ea9.firebaseapp.com",
  projectId: "developer-wiki-31ea9",
  storageBucket: "developer-wiki-31ea9.firebasestorage.app",
  messagingSenderId: "305676986631",
  appId: "1:305676986631:web:893587ce1f950fb5a8bda2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const currentLang = params.get("lang") || "ko";

let developersData = [];

document.documentElement.lang = currentLang;

const DEFAULT_IMAGE = "images/default-profile.png";

/* =============================
   Language Button
============================= */

document.querySelectorAll("[data-lang]").forEach(btn => {

  if (btn.dataset.lang === currentLang) {
    btn.classList.add("active");
  }

  btn.addEventListener("click", () => {
    window.location.href = `index.html?lang=${btn.dataset.lang}`;
  });

});

/* =============================
   Safe Image Loader
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
   Search System
============================= */

function initSearch() {

  const searchInput = document.getElementById("searchInput");

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase().trim();

    if (!keyword) {
      renderCards(developersData);
      return;
    }

    const filtered = developersData.filter(dev => {

      return (

        dev.id?.toLowerCase().includes(keyword) ||
        dev.name?.toLowerCase().includes(keyword) ||

        dev.activityName?.ko?.toLowerCase().includes(keyword) ||
        dev.activityName?.en?.toLowerCase().includes(keyword) ||
        dev.activityName?.ja?.toLowerCase().includes(keyword)

      );

    });

    renderCards(filtered);

  });

}

/* =============================
   Load Developers
============================= */

import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/*
   Card Render
  */

function renderCards(data) {

  const container = document.querySelector(".card-container");
  if (!container) return;

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = "<p>데이터 없음</p>";
    return;
  }

  data.forEach(dev => {

    const card = document.createElement("div");
    card.className = "card";

    card.onclick = () => {
      window.location.href =
        `profile.html?id=${dev.id}&lang=${currentLang}`;
    };

    /* Image */

    const img = document.createElement("img");
    img.className = "card-image";

    setSafeImage(img, dev.image);

    /* Name (🔥 안전 처리) */

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent =
      dev.activityName?.[currentLang] ||
      dev.activityName?.ko ||
      "이름 없음";

    /* Role (🔥 안전 처리) */

    const role = document.createElement("div");
    role.className = "card-bio";
    role.textContent =
      dev.role?.[currentLang] ||
      dev.role?.ko ||
      "";

    /* Stack (🔥 에러 방지) */

    const stackBox = document.createElement("div");
    stackBox.className = "card-stack";

    if (Array.isArray(dev.stack)) {
      dev.stack.forEach(s => {
        const span = document.createElement("span");
        span.textContent = s;
        stackBox.appendChild(span);
      });
    }

    /* Assemble */

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(role);
    card.appendChild(stackBox);

    container.appendChild(card);

  });

}

/* =============================
   Load Developers (Realtime)
============================= */

function loadDevelopersRealtime() {

  onSnapshot(collection(db, "profiles"), (snapshot) => {

    developersData = snapshot.docs.map(doc => ({
      id: doc.data().id,
      ...doc.data()
    }));

    renderCards(developersData);

  });

}

/* =============================
   Init
============================= */

window.addEventListener("DOMContentLoaded", () => {

  initSearch();
  loadDevelopersRealtime();

});
