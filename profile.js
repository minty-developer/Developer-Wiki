import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const currentLang = params.get("lang") || "ko";

async function getProfiles() {
  const snapshot = await getDocs(collection(db, "profiles"));
  return snapshot.docs.map(doc => doc.data());
}

window.addEventListener("DOMContentLoaded", async () => {
  const data = await getProfiles();
  const dev = data.find(d => d.id === id);

  if (!dev) return;

  renderProfile(dev);
});

const projectBox = document.getElementById("profile-projects");

if (Array.isArray(dev.projects)) {
  dev.projects.forEach(p => {

    const div = document.createElement("div");

    const title = document.createElement("h4");
    title.textContent = p.name;

    const desc = document.createElement("p");
    desc.textContent =
      typeof p.description === "object"
        ? p.description[currentLang] || p.description.ko
        : p.description || "";

    div.appendChild(title);
    div.appendChild(desc);

    projectBox.appendChild(div);
  });
}