const params = new URLSearchParams(window.location.search);
const currentLang = params.get("lang") || "ko";

let developersData = [];

document.documentElement.lang = currentLang;

// 언어 버튼 처리
document.querySelectorAll("[data-lang]").forEach(btn => {
  if (btn.dataset.lang === currentLang) {
    btn.classList.add("active");
  }

  btn.addEventListener("click", () => {
    window.location.href = `index.html?lang=${btn.dataset.lang}`;
  });
});

function initSearch() {
  const searchInput = document.getElementById("searchInput");

  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    if (!keyword) {
      renderCards(developersData);
      return;
    }

    const filtered = developersData.filter(dev =>
      dev.id?.toLowerCase().includes(keyword) ||
      dev.name?.toLowerCase().includes(keyword) ||
      dev.activityName?.ko?.toLowerCase().includes(keyword) ||
      dev.activityName?.en?.toLowerCase().includes(keyword) ||
      dev.activityName?.ja?.toLowerCase().includes(keyword)
    );

    renderCards(filtered);
  });
}

// 개발자 데이터 불러오기
fetch("developers.json")
  .then(res => res.json())
  .then(data => {
    developersData = data || [];
    renderCards(developersData);
  });

function renderCards(data) {
  const container = document.querySelector(".card-container");
  if (!container) return;
  container.innerHTML = ""; // ⭐ 기존 카드 제거

  data.forEach(dev => {
    const card = document.createElement("div");
    card.className = "card";

    // 카드 클릭 → profile 이동
    card.addEventListener("click", () => {
      window.location.href =
        `profile.html?id=${dev.id}&lang=${currentLang}`;
    });

    // 이미지
    const img = document.createElement("img");
    img.src = dev.image;
    img.className = "card-image";

    // 활동명
    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = dev.activityName[currentLang];

    // 역할
    const role = document.createElement("div");
    role.className = "card-bio";
    role.textContent = dev.role[currentLang];

    // 스택
    const stackBox = document.createElement("div");
    stackBox.className = "card-stack";

    dev.stack.forEach(s => {
      const span = document.createElement("span");
      span.textContent = s;
      stackBox.appendChild(span);
    });

    // 카드 조립
    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(role);
    card.appendChild(stackBox);

    container.appendChild(card);
  });
}

const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase().trim();

    if (!keyword) {
      renderCards(developersData);
      return;
    }

    const filtered = developersData.filter(dev => {
      return (
        dev.id.toLowerCase().includes(keyword) ||
        dev.activityName.ko.toLowerCase().includes(keyword) ||
        dev.activityName.en.toLowerCase().includes(keyword) ||
        dev.activityName.ja.toLowerCase().includes(keyword) ||
        dev.name.toLowerCase().includes(keyword)
      );
    });

    renderCards(filtered);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initSearch();
});