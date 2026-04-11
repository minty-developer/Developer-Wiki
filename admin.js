// 🔥 Firebase SDK import (맨 위!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/* =========================
   Firebase 설정
========================= */

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "developer-wiki-31ea9.firebaseapp.com",
  projectId: "developer-wiki-31ea9",
  storageBucket: "developer-wiki-31ea9.firebasestorage.app",
  messagingSenderId: "305676986631",
  appId: "1:305676986631:web:893587ce1f950fb5a8bda2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  return snapshot.docs.map(doc => ({
    docId: doc.id, // 🔥 Firestore 문서 ID
    ...doc.data()
  }));
}

/* =========================
   Add Profile
========================= */

const saveAddBtn = document.getElementById("saveAddBtn");

if (saveAddBtn) {

  saveAddBtn.onclick = async () => {

    const id = document.getElementById("newId").value.trim();
    const name = document.getElementById("newName").value.trim();

    const activityKo = document.getElementById("newActivityKo").value.trim();
    const activityEn = document.getElementById("newActivityEn").value.trim();
    const activityJa = document.getElementById("newActivityJa").value.trim();

    const startedYear =
      parseInt(document.getElementById("newStartedYear").value);

    if (!id || !name || !activityKo || !activityEn || !activityJa || !startedYear) {
      alert("필수 값을 입력하세요.");
      return;
    }

    const newProfile = {
      id,
      activityName: { ko: activityKo, en: activityEn, ja: activityJa },
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
      image: "images/default-profile.png"
    };

    await addDoc(collection(db, "profiles"), newProfile);

    alert("추가 완료!");
    document.getElementById("addModal").style.display = "none";
  };

}

/* =========================
   Edit Load
========================= */

document.getElementById("loadEditBtn").onclick = async () => {

  const id = document.getElementById("editId").value.trim();

  const profiles = await getProfiles();
  const profile = profiles.find(p => p.id === id);

  if (!profile) {
    alert("해당 ID 없음");
    return;
  }

  window.currentDocId = profile.docId; // 🔥 저장

  document.getElementById("editName").value = profile.name;
  document.getElementById("editActivityKo").value = profile.activityName.ko;
  document.getElementById("editActivityEn").value = profile.activityName.en;
  document.getElementById("editActivityJa").value = profile.activityName.ja;
};

/* =========================
   Edit Save
========================= */

document.getElementById("saveEditBtn").onclick = async () => {

  if (!window.currentDocId) {
    alert("불러오기를 선행하세요");
    return;
  }

  const ref = doc(db, "profiles", window.currentDocId);

  await updateDoc(ref, {
    name: document.getElementById("editName").value
  });

  alert("수정 완료!");
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

  alert("삭제 완료!");
};