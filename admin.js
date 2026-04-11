import { db, auth, storage } from "./firebase.js";


import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

/* =========================
   Firebase 재사용
========================= */

const ADMIN_UID = "rzwqPY36dvPq4yovQ8pwfy7Mz4o1";

/* =========================
   DOM
========================= */

const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");

/* =========================
   관리자 체크
========================= */

onAuthStateChanged(auth, (user) => {

  if (user && user.uid === ADMIN_UID) {
    adminLogin.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    adminLogin.style.display = "block";
    adminPanel.style.display = "none";
  }

});

/* =========================
   Firestore Helper
========================= */

async function getProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));
}

/* =========================
   모달 열기 (이거 핵심 누락됨)
========================= */

document.getElementById("addProfileBtn").onclick = () => {
  document.getElementById("addModal").style.display = "block";
};

document.getElementById("editProfiles").onclick = () => {
  document.getElementById("editModal").style.display = "block";
};

document.getElementById("deleteProfile").onclick = () => {
  document.getElementById("deleteModal").style.display = "block";
};

/* =========================
   Add Profile
========================= */

document.getElementById("saveAddBtn").onclick = async () => {

  const id = document.getElementById("newId").value.trim();
  const profiles = await getProfiles();
  const file = document.getElementById("newImageFile").files[0];
  const name = document.getElementById("newName").value;

  let imageUrl = "images/default-profile.png";

  if (file) {
    imageUrl = await uploadImage(file, id);
  }

    if (profiles.some(p => p.id === id)) {
    alert("이미 존재하는 ID");
    return;
  }

  if (!id || !name) {
    alert("필수값 누락");
    return;
  }

  const newProfile = {
    id,
    name: document.getElementById("newName").value,

    activityName: {
      ko: document.getElementById("newActivityKo").value,
      en: document.getElementById("newActivityEn").value,
      ja: document.getElementById("newActivityJa").value
    },

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

    startedYear: parseInt(document.getElementById("newStartedYear").value),

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

    image: imageUrl
  };

  await addDoc(collection(db, "profiles"), newProfile);

  alert("추가 완료!");
  document.getElementById("addModal").style.display = "none";
};

/* =========================
   Edit Load
========================= */

document.getElementById("loadEditBtn").onclick = async () => {

  const id = document.getElementById("editId").value.trim();

  const profiles = await getProfiles();
  const profile = profiles.find(p => p.id === id);

  if (!profile) {
    alert("ID 없음");
    return;
  }

  window.currentDocId = profile.docId;

document.getElementById("editName").value = profile.name || "";

document.getElementById("editActivityKo").value = profile.activityName?.ko || "";
document.getElementById("editActivityEn").value = profile.activityName?.en || "";
document.getElementById("editActivityJa").value = profile.activityName?.ja || "";

document.getElementById("editRoleKo").value = profile.role?.ko || "";
document.getElementById("editRoleEn").value = profile.role?.en || "";
document.getElementById("editRoleJa").value = profile.role?.ja || "";

/* 🔥 추가된 부분 */

document.getElementById("editTaglineKo").value = profile.tagline?.ko || "";
document.getElementById("editTaglineEn").value = profile.tagline?.en || "";
document.getElementById("editTaglineJa").value = profile.tagline?.ja || "";

document.getElementById("editAffiliation").value = profile.affiliation || "";
document.getElementById("editStartedYear").value = profile.startedYear || "";

document.getElementById("editStack").value = (profile.stack || []).join(", ");
document.getElementById("editInterests").value = (profile.interests || []).join(", ");

document.getElementById("editGithub").value = profile.links?.github || "";
document.getElementById("editBlog").value = profile.links?.blog || "";
document.getElementById("editEmail").value = profile.links?.email || "";
};

/* =========================
   Edit Save (🔥 전체 수정)
========================= */

document.getElementById("saveEditBtn").onclick = async () => {

  if (!window.currentDocId) {
    alert("먼저 불러오기");
    return;
  }

  const ref = doc(db, "profiles", window.currentDocId);

  await updateDoc(ref, {

    name: document.getElementById("editName").value,

    activityName: {
      ko: document.getElementById("editActivityKo").value,
      en: document.getElementById("editActivityEn").value,
      ja: document.getElementById("editActivityJa").value
    },

    role: {
      ko: document.getElementById("editRoleKo").value,
      en: document.getElementById("editRoleEn").value,
      ja: document.getElementById("editRoleJa").value
    },

    tagline: {
      ko: document.getElementById("editTaglineKo").value,
      en: document.getElementById("editTaglineEn").value,
      ja: document.getElementById("editTaglineJa").value
    },

    affiliation: document.getElementById("editAffiliation").value,

    startedYear: parseInt(document.getElementById("editStartedYear").value),

    stack: document.getElementById("editStack").value
      .split(",").map(s => s.trim()).filter(Boolean),

    interests: document.getElementById("editInterests").value
      .split(",").map(s => s.trim()).filter(Boolean),

    links: {
      github: document.getElementById("editGithub").value,
      blog: document.getElementById("editBlog").value,
      email: document.getElementById("editEmail").value
    }

  });

  alert("수정 완료");
  document.getElementById("editModal").style.display = "none";
};

/* =========================
   Delete
========================= */

document.getElementById("confirmDeleteBtn").onclick = async () => {

  const id = document.getElementById("deleteId").value.trim();

  const profiles = await getProfiles();
  const profile = profiles.find(p => p.id === id);

  if (!profile) {
    alert("없음");
    return;
  }

  await deleteDoc(doc(db, "profiles", profile.docId));

  alert("삭제 완료");
  document.getElementById("deleteModal").style.display = "none";
};

/*
Image Preview
*/

const imageInput = document.getElementById("newImageFile");
const preview = document.getElementById("previewImage");

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) return;

  preview.src = URL.createObjectURL(file);
});

/*
Image Upload
*/

async function uploadImage(file, id) {

  const imageRef = ref(storage, `profiles/${id}/${file.name}`);

  await uploadBytes(imageRef, file);

  const url = await getDownloadURL(imageRef);

  return url;
}