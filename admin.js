import { auth, db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const ADMIN_UID = "rzwqPY36dvPq4yovQ8pwfy7Mz4o1";
const DEFAULT_IMAGE = "images/default-profile.png";
const MAX_PROFILE_IMAGE_SIZE = 512;
const MAX_IMAGE_DATA_URL_LENGTH = 900000;

let currentDocId = "";

const adminLogin = document.getElementById("adminLogin");
const adminPanel = document.getElementById("adminPanel");

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function getCommaList(id) {
  return getValue(id)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseProjects(id) {
  try {
    return JSON.parse(getValue(id) || "[]");
  } catch {
    alert("Projects must be valid JSON.");
    return null;
  }
}

function toMailLink(value) {
  if (!value) return "";
  return value.startsWith("mailto:") ? value : `mailto:${value}`;
}

async function getProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs.map((profileDoc) => ({
    docId: profileDoc.id,
    ...profileDoc.data()
  }));
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

function setModalVisible(id, isVisible) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = isVisible ? "block" : "none";
}

function bindModalButtons() {
  document.getElementById("addProfileBtn")?.addEventListener("click", () => {
    setModalVisible("addModal", true);
  });

  document.getElementById("editProfiles")?.addEventListener("click", () => {
    setModalVisible("editModal", true);
  });

  document.getElementById("deleteProfile")?.addEventListener("click", () => {
    setModalVisible("deleteModal", true);
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => setModalVisible(button.dataset.closeModal, false));
  });
}

function bindImagePreview(inputId, imageId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(imageId);
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) preview.src = URL.createObjectURL(file);
  });
}

function buildProfile(prefix, imageUrl) {
  return {
    name: getValue(`${prefix}Name`),
    activityName: {
      ko: getValue(`${prefix}ActivityKo`),
      en: getValue(`${prefix}ActivityEn`),
      ja: getValue(`${prefix}ActivityJa`)
    },
    role: {
      ko: getValue(`${prefix}RoleKo`),
      en: getValue(`${prefix}RoleEn`),
      ja: getValue(`${prefix}RoleJa`)
    },
    tagline: {
      ko: getValue(`${prefix}TaglineKo`),
      en: getValue(`${prefix}TaglineEn`),
      ja: getValue(`${prefix}TaglineJa`)
    },
    affiliation: getValue(`${prefix}Affiliation`),
    startedYear: Number.parseInt(getValue(`${prefix}StartedYear`), 10) || null,
    stack: getCommaList(`${prefix}Stack`),
    interests: getCommaList(`${prefix}Interests`),
    projects: parseProjects(`${prefix}Projects`),
    links: {
      github: getValue(`${prefix}Github`),
      blog: getValue(`${prefix}Blog`),
      email: toMailLink(getValue(`${prefix}Email`))
    },
    ...(imageUrl ? { image: imageUrl } : {})
  };
}

async function saveNewProfile() {
  const id = getValue("newId");
  const name = getValue("newName");

  if (!id || !name) {
    alert("ID and name are required.");
    return;
  }

  const profiles = await getProfiles();
  if (profiles.some((profile) => profile.id === id)) {
    alert("This ID already exists.");
    return;
  }

  const file = document.getElementById("newImageFile")?.files[0];
  const imageUrl = await getProfileImageUrl(file) || DEFAULT_IMAGE;
  const newProfile = {
    id,
    ...buildProfile("new", imageUrl)
  };

  if (!newProfile.projects) return;

  await addDoc(collection(db, "profiles"), newProfile);
  alert("Profile added.");
  setModalVisible("addModal", false);
}

async function loadProfileForEdit() {
  const id = getValue("editId");
  const profiles = await getProfiles();
  const profile = profiles.find((item) => item.id === id);

  if (!profile) {
    alert("Profile not found.");
    return;
  }

  currentDocId = profile.docId;

  document.getElementById("editName").value = profile.name || "";
  document.getElementById("editActivityKo").value = profile.activityName?.ko || "";
  document.getElementById("editActivityEn").value = profile.activityName?.en || "";
  document.getElementById("editActivityJa").value = profile.activityName?.ja || "";
  document.getElementById("editRoleKo").value = profile.role?.ko || "";
  document.getElementById("editRoleEn").value = profile.role?.en || "";
  document.getElementById("editRoleJa").value = profile.role?.ja || "";
  document.getElementById("editTaglineKo").value = profile.tagline?.ko || "";
  document.getElementById("editTaglineEn").value = profile.tagline?.en || "";
  document.getElementById("editTaglineJa").value = profile.tagline?.ja || "";
  document.getElementById("editAffiliation").value = profile.affiliation || "";
  document.getElementById("editStartedYear").value = profile.startedYear || "";
  document.getElementById("editStack").value = (profile.stack || []).join(", ");
  document.getElementById("editInterests").value = (profile.interests || []).join(", ");
  document.getElementById("editGithub").value = profile.links?.github || "";
  document.getElementById("editBlog").value = profile.links?.blog || "";
  document.getElementById("editEmail").value = (profile.links?.email || "").replace(/^mailto:/, "");
  document.getElementById("editProjects").value = JSON.stringify(profile.projects || [], null, 2);
}

async function saveEditedProfile() {
  if (!currentDocId) {
    alert("Load a profile first.");
    return;
  }

  const saveButton = document.getElementById("saveEditBtn");
  const fileInput = document.getElementById("editImageFile");
  const file = fileInput?.files[0];
  const profile = buildProfile("edit", "");

  if (!profile.projects) return;

  if (saveButton) saveButton.disabled = true;

  try {
    const profileRef = doc(db, "profiles", currentDocId);
    await updateDoc(profileRef, profile);

    if (file) {
      const imageUrl = await getProfileImageUrl(file);
      if (imageUrl) {
        await updateDoc(profileRef, { image: imageUrl });
        fileInput.value = "";
      }
    }

    alert("Profile updated.");
    setModalVisible("editModal", false);
  } catch (error) {
    console.error(error);
    alert(`Profile update failed: ${error.message}`);
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

async function deleteProfile() {
  const id = getValue("deleteId");
  const profiles = await getProfiles();
  const profile = profiles.find((item) => item.id === id);

  if (!profile) {
    alert("Profile not found.");
    return;
  }

  await deleteDoc(doc(db, "profiles", profile.docId));
  alert("Profile deleted.");
  setModalVisible("deleteModal", false);
}

function initAdminAuth() {
  onAuthStateChanged(auth, (user) => {
    const isAdmin = user?.uid === ADMIN_UID;
    if (adminLogin) adminLogin.style.display = isAdmin ? "none" : "block";
    if (adminPanel) adminPanel.style.display = isAdmin ? "block" : "none";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    signOut(auth);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initAdminAuth();
  bindModalButtons();
  bindImagePreview("newImageFile", "previewImage");
  bindImagePreview("editImageFile", "editPreviewImage");

  document.getElementById("saveAddBtn")?.addEventListener("click", saveNewProfile);
  document.getElementById("loadEditBtn")?.addEventListener("click", loadProfileForEdit);
  document.getElementById("saveEditBtn")?.addEventListener("click", saveEditedProfile);
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", deleteProfile);
});
