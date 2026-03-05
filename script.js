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

fetch("developers.json")
  .then(res => res.json())
  .then(data => {

    developersData = data || [];

    renderCards(developersData);

  });

/* =============================
   Card Renderer
============================= */

function renderCards(data) {

  const container = document.querySelector(".card-container");

  if (!container) return;

  container.innerHTML = "";

  data.forEach(dev => {

    const card = document.createElement("div");
    card.className = "card";

    card.addEventListener("click", () => {

      window.location.href =
        `profile.html?id=${dev.id}&lang=${currentLang}`;

    });

    /* Image */

    const img = document.createElement("img");
    img.className = "card-image";

    setSafeImage(img, dev.image);

    /* Name */

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = dev.activityName[currentLang];

    /* Role */

    const role = document.createElement("div");
    role.className = "card-bio";
    role.textContent = dev.role[currentLang];

    /* Stack */

    const stackBox = document.createElement("div");
    stackBox.className = "card-stack";

    dev.stack.forEach(s => {

      const span = document.createElement("span");
      span.textContent = s;

      stackBox.appendChild(span);

    });

    /* Assemble */

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(role);
    card.appendChild(stackBox);

    container.appendChild(card);

  });

}

/* =============================
   Init
============================= */

window.addEventListener("DOMContentLoaded", () => {

  initSearch();

});
