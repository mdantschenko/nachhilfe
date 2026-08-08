/* ============================================================
   MatheGanzEinfach — interaction logic
   ============================================================ */
(function () {
  "use strict";

  var WA_NUMBER = "4917661516445";
  var EMAIL = "info@matheganzeinfach.com";

  /* ============================================================
     THEME — system default + manual toggle (persisted)
     Initial theme is set pre-paint by the inline <head> script.
     Accent colour follows the theme automatically (CSS handles it).
     ============================================================ */
  var THEME_KEY = "mge-theme";
  function setTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
  }
  window.toggleTheme = function () {
    var next = document.documentElement.getAttribute("data-theme") === "dunkel" ? "hell" : "dunkel";
    setTheme(next, true);
  };
  // Follow the OS setting live — but only while the visitor hasn't made a manual choice.
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
      if (!saved) setTheme(e.matches ? "dunkel" : "hell", false);
    });
  } catch (e) {}

  /* ============================================================
     NAV scroll state
     ============================================================ */
  var nav = document.querySelector(".nav");
  var navScrolled = null;
  function onScroll() {
    if (!nav) return;
    var scrolled = window.scrollY > 12;
    if (scrolled === navScrolled) return;
    navScrolled = scrolled;
    nav.classList.toggle("scrolled", scrolled);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  window.toggleMenu = function (btn) {
    if (!nav) return;
    var open = nav.classList.toggle("open");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  window.closeMenu = function () {
    if (!nav) return;
    nav.classList.remove("open");
    var btn = nav.querySelector(".menu-toggle");
    if (btn) btn.setAttribute("aria-expanded", "false");
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") window.closeMenu();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) window.closeMenu();
  });

  /* ============================================================
     EMAIL MODAL (mit Fokus-Trap)
     ============================================================ */
  var modal = document.getElementById("emailModal");
  var lastFocus = null;
  window.openEmailModal = function () {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("open");
    var first = modal.querySelector(".modal-close");
    if (first) first.focus();
  };
  window.closeEmailModal = function () {
    if (!modal) return;
    modal.classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) window.closeEmailModal(); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") { window.closeEmailModal(); return; }
      if (e.key === "Tab") {
        var focusables = modal.querySelectorAll("button, a[href]");
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ============================================================
     BOOKING — build a prefilled WhatsApp / E-Mail request
     ============================================================ */
  var booking = { tag: [], zeit: [] };
  function bindChips(group, key, multi) {
    var wrap = document.querySelector('[data-chips="' + group + '"]');
    if (!wrap) return;
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      var was = btn.getAttribute("aria-pressed") === "true";
      if (multi) {
        btn.setAttribute("aria-pressed", was ? "false" : "true");
        var vals = [];
        wrap.querySelectorAll('.chip[aria-pressed="true"]').forEach(function (c) { vals.push(c.dataset.value); });
        booking[key] = vals;
      } else {
        wrap.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", was ? "false" : "true");
        booking[key] = was ? "" : btn.dataset.value;
      }
    });
  }
  bindChips("tag", "tag", true);
  bindChips("zeit", "zeit", true);

  function buildMessage() {
    var klasse = (document.getElementById("booking-klasse") || {}).value || "";
    var note = (document.getElementById("booking-note") || {}).value || "";
    var lines = ["Hallo Michael, ich möchte gern eine Mathe-Nachhilfe vereinbaren."];
    var detail = [];
    if (klasse.trim()) detail.push("Klassenstufe: " + klasse.trim());
    if (booking.tag.length) detail.push("Wunschtage: " + booking.tag.join(", "));
    if (booking.zeit.length) detail.push("Uhrzeit: " + booking.zeit.join(", "));
    if (detail.length) lines.push("", detail.join("\n"));
    if (note.trim()) lines.push("", note.trim());
    return lines.join("\n");
  }

  window.bookViaWhatsApp = function () {
    var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(buildMessage());
    window.open(url, "_blank", "noopener");
  };
  window.bookViaEmail = function () {
    var url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Terminanfrage Mathe-Nachhilfe") +
      "&body=" + encodeURIComponent(buildMessage());
    window.location.href = url;
  };
})();
