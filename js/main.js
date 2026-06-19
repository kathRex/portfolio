const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

const projectRows = document.querySelectorAll(".project-row");
const previewIndex = document.querySelector(".preview-header p:last-child");
const previewImage = document.querySelector(".preview-frame img");
const previewTitle = document.querySelector(".preview-frame h2");
const previewMeta = document.querySelector(".preview-meta");
const previewDescription = document.querySelector(".preview-description");
const techTagsContainer = document.querySelector(".tech-tags");
const projectButton = document.querySelector(".project-button");

const projectData = {
  "projects/complicity.html": {
    title: "COMPLICITY",
    image: "assets/images/complicity.jpg",
    alt: "Complicity project preview",
    meta: "UX / Game Study / Research / Dark Patterns",
    year: "2026",
    description:
      "Complicity is a first-person 3D game developed for my bachelor thesis to explore how different role perspectives influence awareness of Dark Patterns. Participants played either as a Victim, experiencing manipulative interface designs through mini-games, or as an Exploiter, actively using those patterns to reach performance goals. The study combined awareness tests with post-study interviews to examine whether embodying the manipulative role supports stronger recognition and reflection on exploitative design strategies.",
    tags: [
      { name: "Unity", icon: "assets/images/icons/icon_unity.webp" },
      { name: "C#", icon: "assets/images/icons/icon_c.webp" },
      { name: "Figma", icon: "assets/images/icons/icon_figma.webp" },
      { name: "Blender", icon: "assets/images/icons/icon_blender.webp" },
    ],
    buttonLink: "projects/complicity.html",
  },
  "projects/mariokart.html": {
    title: "BUILD OPTIMIZER",
    image: "assets/images/marioImg.png",
    alt: "Mario Kart Build Optimizer preview",
    meta: "Data / Tools / Ontology / Website",
    year: "2025",
    description:
      "This project is an interactive Mario Kart 8 Deluxe build-analysis tool which turns ontology data into practical decision support. It helps players understand how character and vehicle-part choices affect stats and race behavior.",
    tags: [
      { name: "Python", icon: "assets/images/icons/icon_python.webp" },
      { name: "Protégé", icon: "assets/images/icons/icon_protege.webp" },
      { name: "OWL/SPARQL", icon: "assets/images/icons/icon_sparql.webp" },
    ],
    buttonLink: "projects/mariokart.html",
  },
  "projects/teamtrash.html": {
    title: "TEAM TRASH",
    image: "assets/images/teamTrash/Startscreen.gif",
    alt: "Team Trash project preview",
    className: "teamTrash",
    meta: "Game / 2D / Platformer / Interaction Design / Pixel Art",
    year: "2025",
    description:
      "Team Trash is a 2D Unity platformer set in a neon-drenched city and its shadowy sewer system, where players freely switch between a witty raccoon and a semi-aggressive possum on a chaotic trash-scavenging mission.",
    tags: [
      { name: "Unity", icon: "assets/images/icons/icon_unity.webp" },
      { name: "C#", icon: "assets/images/icons/icon_c.webp" },
      { name: "Aseprite", icon: "assets/images/icons/icon_aseprite.webp" },
    ],
    buttonLink: "projects/teamtrash.html",
  },
  "projects/chilled.html": {
    title: "CHILLED TO THE BONE",
    image: "assets/images/chilled/chilledImg.jpg",
    alt: "Chilled to the Bone project preview",
    meta: "Game / 3D / VR / Narrative",
    year: "2024",
    description:
      "Chilled to the Bone is a first-person VR prototype that places the player in a dark, snow-covered forest in North America. As the female protagonist, the player awakens with no memory and explores the environment to uncover clues to gradually reconstruct their lost past. An inner monologue reveals the story step by step, while intuitive VR controls and interactive objects drive exploration. The experience focuses on atmosphere, environmental storytelling, and suspense-driven discovery.",
    tags: [
      { name: "UE5", icon: "assets/images/icons/icon_ue5.webp" },
      { name: "VR", icon: "assets/images/icons/icon_vr.webp" },
      { name: "Blender", icon: "assets/images/icons/icon_blender.webp" },
    ],
    buttonLink: "projects/chilled.html",
  },
  "projects/soundsword.html": {
    title: "SOUND SWORD",
    image: "assets/images/swordAnim.gif",
    alt: "Sound Sword project preview",
    meta: "Hardware / Sensor Data / Motion Input / Real-Time Audio",
    year: "2023",
    description:
      "The Sound Sword is an interactive cosplay prop that generates dynamic sound effects based on real sword movements. Using a Micro:bit controller and its built-in accelerometer, the system detects swings and translates them into synthesized audio in real time. Instead of relying on prerecorded sound files, all audio is generated directly on the microcontroller using waveform synthesis. Different sword movements trigger different sound expressions, creating a responsive audiovisual experience during sword fights or performances.",
    tags: [
      { name: "Micro:bit", icon: "assets/images/icons/icon_microbit.webp" },
      { name: "JavaScript", icon: "assets/images/icons/icon_js.webp" },
    ],
    buttonLink: "projects/soundsword.html",
  },
};

function renderTechTags(tags) {
  techTagsContainer.innerHTML = "";
  tags.forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.innerHTML = `<img class="skill-img" src="${tag.icon}" alt="${tag.name} icon" />${tag.name}`;
    techTagsContainer.appendChild(tagEl);
  });
}

function updatePreview(projectKey, index, total) {
  const project = projectData[projectKey];
  if (!project) return;

  previewIndex.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  previewImage.src = project.image;
  previewImage.alt = project.alt;
  previewImage.className = project.className || "";
  previewTitle.textContent = project.title;
  previewMeta.innerHTML = `${project.meta} <span class="accent-white">· ${project.year}</span>`;
  previewDescription.textContent = project.description;
  renderTechTags(project.tags);
  projectButton.href = project.buttonLink;
}

if (
  projectRows.length &&
  previewIndex &&
  previewImage &&
  previewTitle &&
  previewMeta &&
  previewDescription &&
  techTagsContainer &&
  projectButton
) {
  const totalProjects = projectRows.length;

  projectRows.forEach((row, idx) => {
    row.addEventListener("click", () => {
      projectRows.forEach((item) => item.classList.remove("is-active"));
      row.classList.add("is-active");

      const projectKey = row.dataset.projectKey;
      updatePreview(projectKey, idx, totalProjects);
    });
  });

  const activeRow =
    document.querySelector(".project-row.is-active") || projectRows[0];
  const activeIndex = Array.from(projectRows).indexOf(activeRow);
  updatePreview(activeRow.dataset.projectKey, activeIndex, totalProjects);
}
