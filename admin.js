const PASSWORD = "20260304Project1";

/* =========================
   DOM Elements
========================= */

const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("adminPassword");
const loginError = document.getElementById("loginError");

const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");

/* =========================
   Login Check
========================= */

function checkLogin() {
  const isLoggedIn = localStorage.getItem("adminLoggedIn");

  if (isLoggedIn === "true") {
    if (adminLogin) adminLogin.style.display = "none";
    if (adminPanel) adminPanel.style.display = "block";
  }
}

checkLogin();

/* =========================
   Login Event
========================= */

if (loginBtn) {
  loginBtn.onclick = () => {
    const entered = passwordInput.value;

    if (entered === PASSWORD) {
      localStorage.setItem("adminLoggedIn", "true");

      adminLogin.style.display = "none";
      adminPanel.style.display = "block";

    } else {
      loginError.textContent = "비밀번호가 틀렸습니다.";
    }
  };
}

/* =========================
   Logout
========================= */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = () => {

    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("profiles");

    window.location.href = "index.html";
  };
}

/* =========================
   Storage Helper
========================= */

function getProfiles() {
  return JSON.parse(localStorage.getItem("profiles")) || [];
}

function saveProfiles(profiles) {
  localStorage.setItem("profiles", JSON.stringify(profiles));
}

/* =========================
   Add Profile Modal Open
========================= */

const addBtn = document.getElementById("addProfileBtn");

if (addBtn) {
  addBtn.onclick = () => {
    document.getElementById("addModal").style.display = "block";
  };
}

/* =========================
   Add Profile Save
========================= */

const saveAddBtn = document.getElementById("saveAddBtn");

if (saveAddBtn) {

  saveAddBtn.onclick = () => {

    const id = document.getElementById("addId").value.trim();
    const name = document.getElementById("addName").value.trim();

    const activityKo = document.getElementById("addActivityKo").value.trim();
    const activityEn = document.getElementById("addActivityEn").value.trim();
    const activityJa = document.getElementById("addActivityJa").value.trim();

    const startedYear =
      parseInt(document.getElementById("addStartedYear").value);

    if (!id || !name || !activityKo || !activityEn || !activityJa || !startedYear) {
      alert("필수 값을 입력하세요.");
      return;
    }

    const profiles = getProfiles();

    if (profiles.some(p => p.id === id)) {
      alert("이미 존재하는 ID입니다.");
      return;
    }

    const newProfile = {
      id,

      activityName: {
        ko: activityKo,
        en: activityEn,
        ja: activityJa
      },

      name,

      role: {
        ko: document.getElementById("newRoleKo").value,
        en: document.getElementById("newRoleEn").value,
        ja: document.getElementById("newRoleJa").value
      },

      tagline: {
        ko: document.getElementById("newTaglineKo").value,
        en: document.getElementById("newTaglineEn").value,
        ja: document.getElementById("newTaglineJa").value
      },

      affiliation: document.getElementById("newAffiliation").value,

      startedYear,

      stack: document.getElementById("newStack").value
        .split(",").map(s => s.trim()).filter(Boolean),

      interests: document.getElementById("newInterests").value
        .split(",").map(s => s.trim()).filter(Boolean),

      projects: [],

      links: {
        github: document.getElementById("newGithub").value,
        blog: document.getElementById("newBlog").value,
        email: document.getElementById("newEmail").value
      },

      image: "assets/images/default.png"
    };

    profiles.push(newProfile);
    saveProfiles(profiles);

    alert("추가 완료!");

    document.getElementById("addModal").style.display = "none";
  };
}

/* =========================
   Edit Profile Modal Open
========================= */

document.getElementById("editProfiles").onclick = () => {
  document.getElementById("editModal").style.display = "block";
};

/* =========================
   Load Edit Data
========================= */

document.getElementById("loadEditBtn").onclick = () => {

  const id = document.getElementById("editId").value.trim();

  const profile = getProfiles().find(p => p.id === id);

  if (!profile) {
    alert("해당 ID가 없습니다.");
    return;
  }

  document.getElementById("editName").value = profile.name;

  document.getElementById("editActivityKo").value = profile.activityName.ko;
  document.getElementById("editActivityEn").value = profile.activityName.en;
  document.getElementById("editActivityJa").value = profile.activityName.ja;

  document.getElementById("editRoleKo").value = profile.role.ko;
  document.getElementById("editRoleEn").value = profile.role.en;
  document.getElementById("editRoleJa").value = profile.role.ja;

  document.getElementById("editTaglineKo").value = profile.tagline.ko;
  document.getElementById("editTaglineEn").value = profile.tagline.en;
  document.getElementById("editTaglineJa").value = profile.tagline.ja;

  document.getElementById("editAffiliation").value = profile.affiliation;

  document.getElementById("editStartedYear").value = profile.startedYear;

  document.getElementById("editStack").value = profile.stack.join(",");
  document.getElementById("editInterests").value = profile.interests.join(",");

  document.getElementById("editGithub").value = profile.links.github;
  document.getElementById("editBlog").value = profile.links.blog;
  document.getElementById("editEmail").value = profile.links.email;
};

/* =========================
   Save Edit
========================= */

document.getElementById("saveEditBtn").onclick = () => {

  const id = document.getElementById("editId").value.trim();

  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === id);

  if (index === -1) {
    alert("ID를 확인하세요.");
    return;
  }

  profiles[index].name =
    document.getElementById("editName").value;

  profiles[index].activityName = {
    ko: document.getElementById("editActivityKo").value,
    en: document.getElementById("editActivityEn").value,
    ja: document.getElementById("editActivityJa").value
  };

  profiles[index].role = {
    ko: document.getElementById("editRoleKo").value,
    en: document.getElementById("editRoleEn").value,
    ja: document.getElementById("editRoleJa").value
  };

  profiles[index].tagline = {
    ko: document.getElementById("editTaglineKo").value,
    en: document.getElementById("editTaglineEn").value,
    ja: document.getElementById("editTaglineJa").value
  };

  profiles[index].affiliation =
    document.getElementById("editAffiliation").value;

  profiles[index].startedYear =
    parseInt(document.getElementById("editStartedYear").value);

  profiles[index].stack =
    document.getElementById("editStack").value
      .split(",").map(s => s.trim()).filter(Boolean);

  profiles[index].interests =
    document.getElementById("editInterests").value
      .split(",").map(s => s.trim()).filter(Boolean);

  profiles[index].links = {
    github: document.getElementById("editGithub").value,
    blog: document.getElementById("editBlog").value,
    email: document.getElementById("editEmail").value
  };

  saveProfiles(profiles);

  alert("수정 완료!");
  document.getElementById("editModal").style.display = "none";
};

/* =========================
   Delete Modal Open
========================= */

const deleteBtn = document.getElementById("deleteProfile");

if (deleteBtn) {

  deleteBtn.onclick = () => {
    document.getElementById("deleteModal").style.display = "block";
  };

}

/* =========================
   Delete Confirm Logic
========================= */

const confirmDeleteBtn =
  document.getElementById("confirmDeleteBtn");

if (confirmDeleteBtn) {

  confirmDeleteBtn.onclick = () => {

    const id = document.getElementById("deleteId").value.trim();

    if (!id) {
      alert("ID를 입력하세요.");
      return;
    }

    let profiles = getProfiles();

    const profile = profiles.find(p => p.id === id);

    if (!profile) {
      alert("해당 ID가 없습니다.");
      return;
    }

    // 🔥 삭제 확인 (2차 안전장치)
    const confirmMsg = confirm(
      `${id} 프로필을 정말 삭제하시겠습니까?`
    );

    if (!confirmMsg) return;

    profiles = profiles.filter(p => p.id !== id);

    saveProfiles(profiles);

    alert("삭제 완료!");

    document.getElementById("deleteModal").style.display = "none";
  };
}

/* =========================
   Page Load
========================= */

window.onload = () => {
  checkLogin();
};