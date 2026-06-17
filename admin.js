import { auth, db } from "./firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const ADMIN_UID = "rzwqPY36dvPq4yovQ8pwfy7Mz4o1";
const DEFAULT_IMAGE = "images/default-profile.png";
const MAX_PROFILE_IMAGE_SIZE = 512;
const MAX_IMAGE_DATA_URL_LENGTH = 900000;

let profiles = [];
let selectedProfileKey = "";
let selectedDocId = "";

const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");
const profileForm = document.getElementById("profileForm");
const profileList = document.getElementById("adminProfileList");
const editorTitle = document.getElementById("editorTitle");
const editorStatus = document.getElementById("editorStatus");
const searchInput = document.getElementById("adminSearchInput");
const previewImage = document.getElementById("editPreviewImage");
const imageInput = document.getElementById("editImageFile");

function normalizeLocalAuthHost() {
  if (window.location.hostname !== "127.0.0.1") return false;

  const nextUrl = new URL(window.location.href);
  nextUrl.hostname = "localhost";
  window.location.replace(nextUrl.href);
  return true;
}

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function setValue(id, value = "") {
  const element = document.getElementById(id);
  if (element) element.value = value ?? "";
}

function getCommaList(id) {
  return getValue(id)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseProjects() {
  try {
    const projects = JSON.parse(getValue("editProjects") || "[]");
    if (!Array.isArray(projects)) throw new Error("Projects must be an array.");
    return projects;
  } catch (error) {
    alert(`Projects JSON error: ${error.message}`);
    return null;
  }
}

function toMailLink(value) {
  if (!value) return "";
  return value.startsWith("mailto:") ? value : `mailto:${value}`;
}

function stripMailLink(value = "") {
  return value.replace(/^mailto:/, "");
}

function normalizeImagePath(src) {
  if (!src) return DEFAULT_IMAGE;
  if (src.startsWith("/Developer-Wiki/")) {
    return src.replace("/Developer-Wiki/", "");
  }
  return src;
}

async function getRemoteProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs
    .map((profileDoc) => ({
      sourceKey: profileDoc.id,
      docId: profileDoc.id,
      ...profileDoc.data()
    }))
    .sort((a, b) => {
      const aName = a.activityName?.ko || a.activityName?.en || a.name || a.id || "";
      const bName = b.activityName?.ko || b.activityName?.en || b.name || b.id || "";
      return aName.localeCompare(bName);
    });
}

async function loadProfiles() {
  profiles = await getRemoteProfiles();
  renderProfileList();

  if (selectedProfileKey) {
    const selected = profiles.find((profile) => profile.sourceKey === selectedProfileKey);
    if (selected) fillEditor(selected);
  }
}

function renderProfileList() {
  const keyword = searchInput.value.toLowerCase().trim();
  const filteredProfiles = profiles.filter((profile) => {
    const searchable = [
      profile.id,
      profile.name,
      profile.activityName?.ko,
      profile.activityName?.en,
      profile.activityName?.ja
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(keyword);
  });

  profileList.innerHTML = "";

  if (!filteredProfiles.length) {
    profileList.innerHTML = '<p class="admin-empty">No profiles found.</p>';
    return;
  }

  filteredProfiles.forEach((profile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-profile-item";
    button.classList.toggle("active", profile.sourceKey === selectedProfileKey);
    button.addEventListener("click", () => fillEditor(profile));

    const image = document.createElement("img");
    image.src = normalizeImagePath(profile.image);
    image.alt = "";
    image.onerror = () => {
      image.src = DEFAULT_IMAGE;
    };

    const text = document.createElement("span");
    text.textContent = profile.activityName?.ko || profile.activityName?.en || profile.name || profile.id;

    const badge = document.createElement("small");
    badge.textContent = "Firebase";

    button.append(image, text, badge);
    profileList.appendChild(button);
  });
}

function clearEditor() {
  selectedProfileKey = "";
  selectedDocId = "";
  profileForm.reset();
  previewImage.src = DEFAULT_IMAGE;
  editorTitle.textContent = "New profile";
  editorStatus.textContent = "This profile will be saved to Firebase.";
  renderProfileList();
}

function fillEditor(profile) {
  selectedProfileKey = profile.sourceKey;
  selectedDocId = profile.docId || "";

  setValue("editId", profile.id);
  setValue("editName", profile.name);
  setValue("editActivityKo", profile.activityName?.ko);
  setValue("editActivityEn", profile.activityName?.en);
  setValue("editActivityJa", profile.activityName?.ja);
  setValue("editRoleKo", profile.role?.ko);
  setValue("editRoleEn", profile.role?.en);
  setValue("editRoleJa", profile.role?.ja);
  setValue("editTaglineKo", profile.tagline?.ko);
  setValue("editTaglineEn", profile.tagline?.en);
  setValue("editTaglineJa", profile.tagline?.ja);
  setValue("editAffiliation", profile.affiliation);
  setValue("editStartedYear", profile.startedYear);
  setValue("editStack", (profile.stack || []).join(", "));
  setValue("editInterests", (profile.interests || []).join(", "));
  setValue("editGithub", profile.links?.github);
  setValue("editBlog", profile.links?.blog);
  setValue("editEmail", stripMailLink(profile.links?.email));
  setValue("editProjects", JSON.stringify(profile.projects || [], null, 2));

  previewImage.src = normalizeImagePath(profile.image);
  previewImage.onerror = () => {
    previewImage.src = DEFAULT_IMAGE;
  };
  imageInput.value = "";

  const title = profile.activityName?.ko || profile.activityName?.en || profile.name || profile.id;
  editorTitle.textContent = title || "Edit profile";
  editorStatus.textContent = `Editing Firebase document ${selectedDocId}.`;

  renderProfileList();
}

function buildProfileFromForm() {
  return {
    id: getValue("editId"),
    name: getValue("editName"),
    activityName: {
      ko: getValue("editActivityKo"),
      en: getValue("editActivityEn"),
      ja: getValue("editActivityJa")
    },
    role: {
      ko: getValue("editRoleKo"),
      en: getValue("editRoleEn"),
      ja: getValue("editRoleJa")
    },
    tagline: {
      ko: getValue("editTaglineKo"),
      en: getValue("editTaglineEn"),
      ja: getValue("editTaglineJa")
    },
    affiliation: getValue("editAffiliation"),
    startedYear: Number.parseInt(getValue("editStartedYear"), 10) || null,
    stack: getCommaList("editStack"),
    interests: getCommaList("editInterests"),
    projects: parseProjects(),
    links: {
      github: getValue("editGithub"),
      blog: getValue("editBlog"),
      email: toMailLink(getValue("editEmail"))
    }
  };
}

async function getProfileImageUrl(file) {
  if (!file) return "";

  try {
    return await resizeImageToDataUrl(file);
  } catch (error) {
    console.error(error);
    alert(`Image processing failed: ${error.message}`);
    return "";
  }
}

function resizeImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_PROFILE_IMAGE_SIZE / image.width,
          MAX_PROFILE_IMAGE_SIZE / image.height
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
          reject(new Error("Image is too large. Please choose a smaller image."));
          return;
        }

        resolve(dataUrl);
      };

      image.onerror = () => reject(new Error("Could not read this image file."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Could not read this image file."));
    reader.readAsDataURL(file);
  });
}

async function saveProfile(event) {
  event.preventDefault();

  const saveButton = document.getElementById("saveProfileBtn");
  const profile = buildProfileFromForm();

  if (!profile.id || !profile.name) {
    alert("ID and Name are required.");
    return;
  }

  if (!profile.projects) return;

  saveButton.disabled = true;

  try {
    const imageUrl = await getProfileImageUrl(imageInput.files[0]);
    const payload = {
      ...profile,
      ...(imageUrl ? { image: imageUrl } : {})
    };

    if (selectedDocId) {
      await updateDoc(doc(db, "profiles", selectedDocId), payload);
    } else {
      const created = await upsertProfile(payload);
      selectedDocId = created.id;
    }

    editorStatus.textContent = "Saved.";
    await loadProfiles();
    const savedProfile = profiles.find((item) => item.docId === selectedDocId || item.id === payload.id);
    if (savedProfile) fillEditor(savedProfile);
  } catch (error) {
    console.error(error);
    alert(`Profile save failed: ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
}

async function deleteSelectedProfile() {
  if (!selectedDocId) {
    alert("Select a Firebase profile first.");
    return;
  }

  const ok = window.confirm("Delete this Firebase profile?");
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "profiles", selectedDocId));
    clearEditor();
    await loadProfiles();
  } catch (error) {
    console.error(error);
    alert(`Profile delete failed: ${error.message}`);
  }
}

async function upsertProfile(profile) {
  const existing = profiles.find((item) => item.id === profile.id);
  const payload = {
    ...profile,
    image: profile.image || normalizeImagePath(previewImage.src) || DEFAULT_IMAGE
  };

  if (existing?.docId) {
    await updateDoc(doc(db, "profiles", existing.docId), payload);
    return { id: existing.docId };
  }

  const docRef = doc(db, "profiles", profile.id);
  await setDoc(docRef, payload);
  return { id: docRef.id };
}

async function loginAdmin() {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    alert(`Login failed: ${error.message}`);
  }
}

function initAdminAuth() {
  onAuthStateChanged(auth, async (user) => {
    const isAdmin = user?.uid === ADMIN_UID;
    adminLogin.hidden = isAdmin;
    adminPanel.hidden = !isAdmin;

    if (isAdmin) {
      await loadProfiles();
      if (profiles[0] && !selectedProfileKey) fillEditor(profiles[0]);
    }
  });
}

function bindEvents() {
  document.getElementById("adminLoginBtn").addEventListener("click", loginAdmin);
  document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
  document.getElementById("addProfileBtn").addEventListener("click", clearEditor);
  document.getElementById("deleteProfileBtn").addEventListener("click", deleteSelectedProfile);
  profileForm.addEventListener("submit", saveProfile);
  searchInput.addEventListener("input", renderProfileList);

  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) previewImage.src = URL.createObjectURL(file);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (normalizeLocalAuthHost()) return;

  bindEvents();
  initAdminAuth();
});
