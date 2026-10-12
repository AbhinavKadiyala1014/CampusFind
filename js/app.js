
import {
  reportsCollection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "./firebase.js";

// ========================================
// CAMPUSFIND - APP.JS
// ========================================

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRY_DAYS = 60;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

let allReports = [];
let previewObjectUrl = null;

// ========================================
// SAFE DOM HELPERS
// ========================================

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getElement(id);

  // Avoid errors if an optional element is missing.
  if (element) {
    element.textContent = String(value);
  }
}

function showElement(id, show = true) {
  const element = getElement(id);

  if (element) {
    element.hidden = !show;
  }
}

function showToast(message) {
  const toast = getElement("toast");

  if (toast) {
    toast.textContent = message;
    toast.hidden = false;

    // No timer is needed; the notification stays visible
    // until another notification replaces it.
  } else {
    alert(message);
  }
}

// ========================================
// DATE HELPERS
// ========================================

function getDateValue(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = getDateValue(value);

  if (!date) return "Date not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function isExpired(report) {
  // Use the stored expiry date when available.
  const expiry = getDateValue(report.expiresAt);

  if (expiry) {
    return expiry.getTime() <= Date.now();
  }

  // Older reports without expiresAt use their creation date.
  const created = getDateValue(report.createdAt);

  if (created) {
    return created.getTime() + EXPIRY_DAYS * DAY_MS <= Date.now();
  }

  return false;
}

// ========================================
// CATEGORY ICONS
// ========================================

function getCategoryEmoji(category) {
  const icons = {
    "Electronics": "💻",
    "ID Cards": "🪪",
    "Books & Notes": "📚",
    "Bags": "🎒",
    "Clothing": "👕",
    "Keys": "🔑",
    "Accessories": "⌚",
    "Other": "📦"
  };

  return icons[category] || "📦";
}

// ========================================
// STATISTICS
// ========================================

function updateStats(reports = allReports) {
  const total = reports.length;
  const lost = reports.filter(
    report => report.type === "Lost"
  ).length;
  const found = reports.filter(
    report => report.type === "Found"
  ).length;

  // These IDs match the replacement index.html.
  setText("total-reports", total);
  setText("lost-count", lost);
  setText("found-count", found);
}

// ========================================
// CONTACT LINK HELPERS
// ========================================

function getWhatsAppNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return "91" + digits;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return "91" + digits.slice(1);
  }

  return null;
}

function createContactLink(label, href, external = false) {
  const link = document.createElement("a");

  link.textContent = label;
  link.href = href;

  if (external) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  return link;
}

// ========================================
// REPORT CARD
// ========================================

function createReportCard(report) {
  const card = document.createElement("article");
  card.className = "item-card";

  // Photo area
  const imageArea = document.createElement("div");
  imageArea.className = "item-image";

  // Supports future Supabase image URLs and older saved URLs.
  const imageUrl =
    typeof report.imageUrl === "string" ? report.imageUrl :
    typeof report.photoURL === "string" ? report.photoURL :
    typeof report.imageURL === "string" ? report.imageURL :
    "";

  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    const image = document.createElement("img");

    image.src = imageUrl;
    image.alt = report.name
      ? "Photo of " + report.name
      : "Reported item photo";

    image.loading = "lazy";

    image.addEventListener("error", () => {
      image.remove();
      imageArea.textContent = getCategoryEmoji(report.category);
    });

    imageArea.appendChild(image);
  } else {
    imageArea.textContent = getCategoryEmoji(report.category);
  }

  card.appendChild(imageArea);

  // Card body
  const content = document.createElement("div");
  content.className = "item-content";

  const badges = document.createElement("div");
  badges.className = "item-badges";

  const typeBadge = document.createElement("span");
  typeBadge.className =
    "item-badge " +
    (report.type === "Found" ? "found" : "lost");
  typeBadge.textContent = report.type || "Report";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "item-badge";
  categoryBadge.textContent = report.category || "Other";

  badges.append(typeBadge, categoryBadge);

  const title = document.createElement("h3");
  title.textContent = report.name || "Unnamed item";

  const description = document.createElement("p");
  description.className = "item-description";
  description.textContent =
    report.description || "No description provided.";

  const metadata = document.createElement("div");
  metadata.className = "item-meta";

  const location = document.createElement("span");
  location.textContent = "📍 " + (report.location || "Location not provided");

  const date = document.createElement("span");
  date.textContent = "📅 " + formatDate(report.date);

  const reporter = document.createElement("span");
  reporter.textContent =
    "👤 " + (report.reporter || "CampusFind user");

  metadata.append(location, date, reporter);

  content.append(badges, title, description, metadata);

  // Contact actions
  const actions = document.createElement("div");
  actions.className = "item-actions";

  const email = String(report.email || "").trim();

  if (
    email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    actions.appendChild(
      createContactLink("✉ Email", "mailto:" + email)
    );
  }

  const whatsappNumber = getWhatsAppNumber(report.phone);

  if (whatsappNumber) {
    const message = encodeURIComponent(
      "Hi, I saw your CampusFind report for: " +
      (report.name || "an item") +
      ". I would like to discuss it."
    );

    actions.appendChild(
      createContactLink(
        "💬 WhatsApp",
        "https://wa.me/" + whatsappNumber + "?text=" + message,
        true
      )
    );
  }

  if (actions.children.length > 0) {
    content.appendChild(actions);
  }

  card.appendChild(content);

  return card;
}

// ========================================
// FILTERING AND DISPLAY
// ========================================

function renderReports() {
  const grid = getElement("items-grid");

  if (!grid) {
    console.error(
      'Missing HTML element: #items-grid. Check index.html.'
    );
    return;
  }

  const searchInput = getElement("search-input");
  const typeFilter = getElement("type-filter");
  const categoryFilter = getElement("category-filter");

  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const selectedType = typeFilter
    ? typeFilter.value
    : "all";

  const selectedCategory = categoryFilter
    ? categoryFilter.value
    : "all";

  const visibleReports = allReports.filter(report => {
    if (isExpired(report)) return false;

    if (
      selectedType !== "all" &&
      report.type !== selectedType
    ) {
      return false;
    }

    if (
      selectedCategory !== "all" &&
      report.category !== selectedCategory
    ) {
      return false;
    }

    const searchableText = [
      report.name,
      report.description,
      report.location,
      report.category,
      report.type
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm);
  });

  grid.replaceChildren();

  visibleReports.forEach(report => {
    grid.appendChild(createReportCard(report));
  });

  const loadingMessage = getElement("loading-message");

  if (loadingMessage) {
    loadingMessage.hidden = true;
  }

  const emptyState = getElement("empty-state");

  if (emptyState) {
    emptyState.hidden = visibleReports.length !== 0;
  }

  // Statistics describe all active reports, not only search results.
  updateStats(allReports.filter(report => !isExpired(report)));
}

// ========================================
// LOAD REPORTS FROM FIRESTORE
// ========================================

async function loadReports() {
  const loadingMessage = getElement("loading-message");
  const grid = getElement("items-grid");
  const emptyState = getElement("empty-state");

  if (loadingMessage) {
    loadingMessage.hidden = false;
    loadingMessage.textContent = "Loading reports...";
  }

  try {
    const reportsQuery = query(
      reportsCollection,
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(reportsQuery);

    allReports = snapshot.docs.map(documentSnapshot => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    }));

    renderReports();
  } catch (error) {
    console.error("Firestore loading error:", error);

    if (loadingMessage) {
      loadingMessage.hidden = false;
      loadingMessage.textContent =
        "Unable to load reports. Check your Firebase configuration and Firestore rules.";
    }

    if (grid) {
      grid.replaceChildren();
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    showToast(
      "Could not load reports. Open the browser console for details."
    );
  }
}

// ========================================
// IMAGE VALIDATION
// ========================================

function validateSelectedImage(file) {
  if (!file) return true;

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    showToast("Please select a JPG, PNG, or WebP image.");
    return false;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    showToast("The photo must be 5 MB or smaller.");
    return false;
  }

  return true;
}

// ========================================
// SUBMIT REPORT TO FIRESTORE
// ========================================

async function handleReportSubmit(event) {
  event.preventDefault();

  const form = getElement("report-form");

  if (!form) return;

  if (!form.reportValidity()) {
    return;
  }

  const submitButton = getElement("submit-report");
  const imageInput = getElement("item-image");

  const selectedFile =
    imageInput && imageInput.files
      ? imageInput.files[0]
      : null;

  if (!validateSelectedImage(selectedFile)) {
    return;
  }

  const type = getElement("item-type")?.value.trim();
  const category = getElement("item-category")?.value.trim();
  const name = getElement("item-name")?.value.trim();
  const description = getElement("item-description")?.value.trim();
  const location = getElement("item-location")?.value.trim();
  const date = getElement("item-date")?.value;
  const reporter = getElement("reporter-name")?.value.trim();
  const phone = getElement("reporter-phone")?.value.trim();
  const email = getElement("reporter-email")?.value.trim();

  if (
    !type ||
    !category ||
    !name ||
    !description ||
    !location ||
    !date ||
    !reporter ||
    !phone ||
    !email
  ) {
    showToast("Please complete all required fields.");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showToast("Enter a valid 10-digit Indian mobile number.");
    return;
  }

  if (name.length > 100 || description.length > 1000) {
    showToast("Please shorten the item details.");
    return;
  }

  if (location.length > 200) {
    showToast("Please shorten the location.");
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
  }

  try {
    const now = new Date();

    const reportData = {
      type,
      category,
      name,
      description,
      location,
      date,
      reporter,
      phone,
      email,
      createdAt: serverTimestamp(),
      expiresAt: new Date(
        now.getTime() + EXPIRY_DAYS * DAY_MS
      )
    };

    /*
      Photo uploads are not connected yet.

      The selected image currently previews locally only.
      We will add the Supabase upload and imageUrl field
      after testing this Firestore version.
    */

    await addDoc(reportsCollection, reportData);

    form.reset();

    if (imageInput) {
      imageInput.value = "";
    }

    clearImagePreview();

    const dateInput = getElement("item-date");

    if (dateInput) {
      dateInput.max = new Date().toISOString().split("T")[0];
    }

    showToast("Report submitted successfully!");

    await loadReports();

    const browseSection = getElement("browse");

    if (browseSection) {
      browseSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  } catch (error) {
    console.error("Report submission error:", error);

    showToast(
      "Could not submit the report. Please check Firebase and try again."
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Report";
    }
  }
}

// ========================================
// IMAGE PREVIEW CLEANUP
// ========================================

function clearImagePreview() {
  const imageInput = getElement("item-image");
  const imagePreview = getElement("image-preview");
  const previewContainer = getElement("image-preview-container");

  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  if (imageInput) {
    imageInput.value = "";
  }

  if (imagePreview) {
    imagePreview.removeAttribute("src");
  }

  if (previewContainer) {
    previewContainer.hidden = true;
  }
}

function handleImageSelection() {
  const imageInput = getElement("item-image");
  const imagePreview = getElement("image-preview");
  const previewContainer = getElement("image-preview-container");

  if (!imageInput || !imagePreview || !previewContainer) {
    return;
  }

  const file = imageInput.files && imageInput.files[0];

  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  if (!file) {
    imagePreview.removeAttribute("src");
    previewContainer.hidden = true;
    return;
  }

  if (!validateSelectedImage(file)) {
    imageInput.value = "";
    imagePreview.removeAttribute("src");
    previewContainer.hidden = true;
    return;
  }

  previewObjectUrl = URL.createObjectURL(file);
  imagePreview.src = previewObjectUrl;
  previewContainer.hidden = false;
}

// ========================================
// INITIALIZE PAGE
// ========================================

function initializeCampusFind() {
  const reportForm = getElement("report-form");

  if (reportForm) {
    reportForm.addEventListener("submit", handleReportSubmit);
  }

  const searchInput = getElement("search-input");
  const typeFilter = getElement("type-filter");
  const categoryFilter = getElement("category-filter");

  if (searchInput) {
    searchInput.addEventListener("input", renderReports);
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", renderReports);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", renderReports);
  }

  const imageInput = getElement("item-image");

  if (imageInput) {
    imageInput.addEventListener("change", handleImageSelection);
  }

  const dateInput = getElement("item-date");

  if (dateInput) {
    dateInput.max = new Date().toISOString().split("T")[0];
  }

  setText("current-year", new Date().getFullYear());

  loadReports();
}

initializeCampusFind();
