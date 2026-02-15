// CONFIG
const API_URL = "https://ai-image-generator-production-ff97.up.railway.app/generate";

// ELEMENTS
const promptInput = document.getElementById("prompt");
const styleSelect = document.getElementById("dropdownStyles");
const ratioSelect = document.getElementById("dropdownRatio");

const referenceInput = document.getElementById("referenceImage");
const referenceName = document.getElementById("referenceName");

const imageResult = document.getElementById("imageResult");
const loader = document.querySelector(".loader");

const themeBtn = document.getElementById("themeToggle");

const dropZone = document.getElementById("dropZone");


// ==========================
// MULTI THEME SYSTEM
// ==========================

const themeSelect = document.getElementById("themeToggle");

const themes = [
  "light",
  "dark",
  "neon",
  "ocean",
  "sunset",
  "cyber"
];

const savedTheme = localStorage.getItem("theme") || "light";

setTheme(savedTheme);

themeSelect.value = savedTheme;


themeSelect.addEventListener("change", () => {

  const selected = themeSelect.value;

  setTheme(selected);

  localStorage.setItem("theme", selected);
});


function setTheme(theme) {

  if (!themes.includes(theme)) return;

  document.documentElement.setAttribute("data-theme", theme);
}


// ==========================
// IMAGE GENERATION
// ==========================

async function generateImage() {

  const prompt = promptInput.value.trim();
  const style = styleSelect.value;
  const ratio = ratioSelect.value;
  const file = referenceInput.files[0];

  if (!prompt) {
    alert("Enter a prompt");
    return;
  }

  const size = getImageSize(ratio);

  const finalPrompt = buildPrompt(prompt, style);

  showLoading(true);

  try {

    let data;

    if (file) {
      data = await generateWithReference(finalPrompt, size, file);
    } else {
      data = await generateNormal(finalPrompt, size);
    }

    if (!data?.data?.[0]) {
      throw "No image returned";
    }

    const img = data.data[0];

    let url = "";

    if (img.url) url = img.url;

    if (img.b64_json) {
      url = "data:image/png;base64," + img.b64_json;
    }

    imageResult.src = url;

  } catch (err) {

    console.error(err);
    alert("Generation failed");

  } finally {

    showLoading(false);
  }
}


// ==========================
// API CALLS
// ==========================

async function generateNormal(prompt, size) {

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "generate",
      prompt,
      size
    })
  });

  if (!res.ok) throw await res.text();

  return await res.json();
}


async function generateWithReference(prompt, size, file) {

  const form = new FormData();

  form.append("type", "edit");
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("image", file);

  const res = await fetch(API_URL, {
    method: "POST",
    body: form
  });

  if (!res.ok) throw await res.text();

  return await res.json();
}


// ==========================
// HELPERS
// ==========================

function buildPrompt(prompt, style) {

  let styleText = "";

  if (style === "realistic") {
    styleText = "photorealistic, natural lighting, high detail";
  }

  if (style === "anime") {
    styleText = "anime style, clean lines, vibrant colors";
  }

  if (style === "flux-schnell") {
    styleText = "futuristic digital art, sci-fi lighting";
  }

  return prompt + ". " + styleText;
}


function getImageSize(ratio) {

  if (ratio === "1:1") return "1024x1024";
  if (ratio === "16:9") return "1344x768";
  if (ratio === "9:16") return "768x1344";

  return "1024x1024";
}


function showLoading(state) {
  loader.classList.toggle("active", state);
}


// ==========================
// DOWNLOAD
// ==========================

function downloadImage() {

  if (!imageResult.src) return;

  const a = document.createElement("a");

  a.href = imageResult.src;
  a.download = "ai-image.png";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


// ==========================
// FILE PREVIEW
// ==========================

const previewBox = document.createElement("div");
previewBox.className = "reference-preview";

const previewImg = document.createElement("img");

const removeBtn = document.createElement("button");
removeBtn.className = "reference-remove";
removeBtn.textContent = "×";

previewBox.appendChild(previewImg);
previewBox.appendChild(removeBtn);

document.querySelector(".reference-row").appendChild(previewBox);


referenceInput.addEventListener("change", handleFile);


function handleFile() {

  if (!referenceInput.files[0]) return;

  const file = referenceInput.files[0];

  const reader = new FileReader();

  reader.onload = () => {
    previewImg.src = reader.result;
    previewBox.classList.add("active");
  };

  reader.readAsDataURL(file);

  referenceName.textContent = file.name;
}


removeBtn.addEventListener("click", () => {

  referenceInput.value = "";
  previewImg.src = "";

  previewBox.classList.remove("active");

  referenceName.textContent = "No reference";
});


// ==========================
// DRAG + DROP
// ==========================

dropZone.addEventListener("click", () => {
  referenceInput.click();
});


dropZone.addEventListener("dragover", (e) => {

  e.preventDefault();

  dropZone.classList.add("active");
});


dropZone.addEventListener("dragleave", () => {

  dropZone.classList.remove("active");
});


dropZone.addEventListener("drop", (e) => {

  e.preventDefault();

  dropZone.classList.remove("active");

  const file = e.dataTransfer.files[0];

  if (!file) return;

  referenceInput.files = e.dataTransfer.files;

  handleFile();
});

function openReferencePicker() {
  referenceInput.click();
}
