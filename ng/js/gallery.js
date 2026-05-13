/**
 * Custom Sucrette - Gallery
 * Utilise le Worker Cloudflare comme backend sécurisé
 */

const WORKER_URL = "https://cs-gallery.clarisse-eynard.workers.dev";

function openSubmitPopup() {
  $("#submit-error").text("");
  $("#submit-popup-overlay").addClass("active").css("display", "flex");
}

function closeSubmitPopup() {
  $("#submit-popup-overlay").removeClass("active").css("display", "none");
  $("#submit-error").text("");
}

$(document).ready(() => {
  customTheme();
  userSettings();
  currentPage("gallery");
  loadGallery();

  $(document).on("click", "#btn-submit-outfit", function (e) {
    e.preventDefault();
    openSubmitPopup();
  });

  $("#submit-popup-overlay").on("click", function (e) {
    if (e.target === this) closeSubmitPopup();
  });
  $("#submit-cancel-btn").on("click", closeSubmitPopup);

  $("#submit-confirm-btn").on("click", submitOutfit);

  $("#submit-pseudo, #submit-code").on("keydown", function (e) {
    if (e.key === "Enter") submitOutfit();
  });

  $(".cs-gallery-content").on("click", ".load-outfit-btn", function (e) {
    e.stopPropagation();
    const code = $(this).attr("data-code");
    localStorage.setItem("tempCode", code);
    const v = code[0] !== "3" ? `v${code[0]}` : "ng";
    window.open(`../${v}/wardrobe.html`, "_blank");
  });

  $(".cs-gallery-content").on("click", ".post-found-message", function () {
    $(this).siblings(".author-message").toggleClass("hidden");
  });

  $("#page-back").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    loadGallery(currentPageNum - 1);
    $(".cs-gallery-container").scrollTop(0);
  });

  $("#page-next").on("click", function () {
    if ($(this).hasClass("disabled")) return;
    loadGallery(currentPageNum + 1);
    $(".cs-gallery-container").scrollTop(0);
  });
});

const POSTS_PER_PAGE = 32;
let currentPageNum = 1;
let totalPages = 1;

// ─── Charger et afficher les tenues ───────────────────────────────────────────

const loadGallery = async (page = 1) => {
  showLoading(true);
  $(".cs-gallery-content").html("");

  try {
    const res = await fetch(`${WORKER_URL}/outfits?page=${page}`);

    if (!res.ok) throw new Error("Erreur réseau");

    const data = await res.json();

    currentPageNum = page;
    totalPages = data.totalPages || 1;

    renderOutfits(data.outfits || []);
  } catch (e) {
    $(".cs-gallery-content").append(
      '<div class="empty-gallery">Erreur lors du chargement de la galerie. Veuillez réessayer.</div>',
    );
  }

  showLoading(false);
  updatePagination();
};

const renderOutfits = (outfits) => {
  if (outfits.length === 0) {
    $(".cs-gallery-content").append(
      '<div class="empty-gallery">Aucune tenue à afficher. Soyez le premier à partager !</div>',
    );
    return;
  }

  outfits.forEach((outfit) => {
    const date = new Date(outfit.date).toLocaleDateString("es-ES");
    const card = `
            <div class="post-container outfit-card">
                <div class="post-content">
                    <div class="author-info">enviado por <strong>${escapeHtml(outfit.pseudo)}</strong></div>
                    <div class="outfit-preview">
                        <div class="outfit-code-display">${escapeHtml(outfit.code)}</div>
                    </div>
                    <div class="outfit-footer">
                        <span class="outfit-date">${date}</span>
                        <button class="load-outfit-btn" data-code="${escapeHtml(outfit.code)}">
                            <span class="material-symbols-outlined">checkroom</span>
                            Cargar tenue
                        </button>
                    </div>
                    ${
                      outfit.message
                        ? `
                        <div class="post-found-message" title="Ver mensaje">
                            <span class="material-symbols-outlined">chat</span>
                        </div>
                        <div class="author-message hidden">${escapeHtml(outfit.message)}</div>
                    `
                        : ""
                    }
                </div>
            </div>`;
    $(".cs-gallery-content").append(card);
  });
};

const updatePagination = () => {
  $("#page-info").text(currentPageNum);
  $("#page-info").attr("data-current", currentPageNum);

  currentPageNum <= 1
    ? $("#page-back").addClass("disabled")
    : $("#page-back").removeClass("disabled");

  currentPageNum >= totalPages
    ? $("#page-next").addClass("disabled")
    : $("#page-next").removeClass("disabled");

  totalPages <= 1 ? $(".pagination").hide() : $(".pagination").show();
};

// ─── Soumettre une tenue ──────────────────────────────────────────────────────

const submitOutfit = async () => {
  const pseudo = $("#submit-pseudo").val().trim();
  const code = $("#submit-code").val().trim();
  const message = $("#submit-message").val().trim();

  if (!pseudo || !code) {
    showSubmitError("Merci de renseigner le pseudo et le code.");
    return;
  }

  $("#submit-confirm-btn").prop("disabled", true).text("Publication...");

  try {
    const res = await fetch(`${WORKER_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo, code, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      showSubmitError(data.error || "Erreur lors de la publication. Réessaie.");
      return;
    }

    // Succès
    $("#submit-pseudo").val("");
    $("#submit-code").val("");
    $("#submit-message").val("");
    $("#submit-error").text("");
    closeSubmitPopup();
    showSuccessToast("Tenue publiée ! 🎉");

    // Recharger la première page
    loadGallery(1);
  } catch (e) {
    showSubmitError("Erreur de connexion. Réessaie.");
  } finally {
    $("#submit-confirm-btn")
      .prop("disabled", false)
      .html(
        '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">send</span> Publier',
      );
  }
};

// ─── UI helpers ───────────────────────────────────────────────────────────────

const showLoading = (show) => {
  show ? $("#loading-layout").addClass("show") : $("#loading-layout").removeClass("show");
};

const showSubmitError = (msg) => {
  $("#submit-error").text(msg);
};

const showSuccessToast = (msg) => {
  $("body").append(`<div class="gallery-toast">${msg}</div>`);
  setTimeout(
    () =>
      $(".gallery-toast").fadeOut(400, function () {
        $(this).remove();
      }),
    2500,
  );
};

const escapeHtml = (str) => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

