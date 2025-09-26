"use strict";

/* ======================================================================
   index.js — Refactor modular & defensif
   Catatan: Tidak mengubah layout, styling, dan fungsi yang sudah ada.
   ====================================================================== */

/* ---------- Util DOM ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced =
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ======================================================================
   1) Mobile Nav Toggle
   ====================================================================== */
(() => {
  const btnMenu = $("#btnMenu");
  const mobileNav = $("#mobileNav");
  if (!btnMenu || !mobileNav) return;

  const setExpanded = (val) => {
    btnMenu.setAttribute("aria-expanded", String(val));
    mobileNav.style.maxHeight = val ? `${mobileNav.scrollHeight}px` : "0px";
  };

  btnMenu.addEventListener("click", () => {
    const expanded = btnMenu.getAttribute("aria-expanded") === "true";
    setExpanded(!expanded);
  });

  // Close after in-page navigation
  $$('a[href^="#"]', mobileNav).forEach((a) => {
    a.addEventListener("click", () => setExpanded(false));
  });
})();

/* ======================================================================
   2) Smooth Scroll (respect reduced motion)
   ====================================================================== */
(() => {
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;

      // biarkan ctrl/cmd+click open in new tab default
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
  });
})();

/* ======================================================================
   3) Footer Year
   ====================================================================== */
(() => {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

/* ======================================================================
   4) Navbar Scroll State (stabil, throttled by rAF)
   ====================================================================== */
(() => {
  const header = $("#appHeader");
  if (!header) return;

  const ENTER = 24;
  const EXIT = 6;
  let ticking = false;
  let isOn = false;

  const update = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!isOn && y > ENTER) {
      header.classList.add("nav-scrolled");
      isOn = true;
    } else if (isOn && y < EXIT) {
      header.classList.remove("nav-scrolled");
      isOn = false;
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ======================================================================
   5) Reveal on Scroll (IntersectionObserver fallback)
   ====================================================================== */
(() => {
  const items = $$(".reveal");
  if (items.length === 0) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
})();

/* ======================================================================
   6) Back to Top
   ====================================================================== */
(() => {
  const btn = $("#backToTop");
  if (!btn) return;

  const toggle = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.classList.toggle("show", y > 300);
  };

  window.addEventListener("scroll", toggle, { passive: true });
  toggle();

  btn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  });
})();

/* ======================================================================
   7) Force Download CV (Blob dengan cleanup & fallback)
   ====================================================================== */
(() => {
  const forceDownload = async (url, filename = "CV.pdf") => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = filename;

      // append to DOM untuk Safari
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(href);
        a.remove();
      }, 0);
    } catch {
      // Fallback open in new tab jika gagal fetch (CORS/HTTP error)
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const dl1 = $("#downloadCv");
  const dl2 = $("#downloadCvMobile");
  if (dl1) {
    dl1.addEventListener("click", (e) => {
      e.preventDefault();
      forceDownload(dl1.getAttribute("href"), "Raka_Pratama_CV.pdf");
    });
  }
  if (dl2) {
    dl2.addEventListener("click", (e) => {
      e.preventDefault();
      forceDownload(dl2.getAttribute("href"), "Raka_Pratama_CV.pdf");
    });
  }
})();

/* ======================================================================
   8) Theme Manager (Light/Dark) — sync ARIA, simpan preferensi
   ====================================================================== */
(() => {
  const html = document.documentElement;
  const btn = $("#themeToggle");
  const btnMobile = $("#themeToggleMobile");

  const setPressed = (isDark) => {
    [btn, btnMobile].forEach(
      (b) => b && b.setAttribute("aria-pressed", String(isDark))
    );
  };

  const currentTheme = () =>
    html.getAttribute("data-theme") ||
    (html.classList.contains("dark") ? "dark" : "light");

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    html.classList.toggle("dark", isDark);
    html.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore quota/denied */
    }
    setPressed(isDark);
  };

  const toggle = () => applyTheme(currentTheme() === "dark" ? "light" : "dark");

  // Inisialisasi state tombol (tema sudah diset sejak <head>)
  setPressed(currentTheme() === "dark");

  // Event click
  [btn, btnMobile].forEach((b) => b && b.addEventListener("click", toggle));

  // Ikuti sistem hanya jika user belum memilih manual
  let hasUserChoice = false;
  try {
    hasUserChoice = !!localStorage.getItem("theme");
  } catch {
    hasUserChoice = false;
  }

  const mql =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = (e) => {
    if (!hasUserChoice) applyTheme(e.matches ? "dark" : "light");
  };
  if (mql) {
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else if (mql.addListener) mql.addListener(onChange); // Safari lama
  }
})();

/* ======================================================================
   9) Toast Notification Utility
   ====================================================================== */
function showToast({
  title = "Berhasil",
  message = "",
  type = "success",
} = {}) {
  // type: success | error | info
  const wrap = document.createElement("div");
  wrap.className = "fixed bottom-4 right-4 z-50 animate-[fadeIn_.2s_ease]";

  const base =
    "min-w-[260px] max-w-[92vw] sm:max-w-sm px-4 py-3 rounded-xl ring-1 shadow-xl flex items-start gap-3 backdrop-blur";
  const tone =
    type === "success"
      ? "bg-white/95 ring-white/70 text-slate-900 dark:bg-slate-900/90 dark:text-white dark:ring-white/15"
      : type === "error"
      ? "bg-rose-50/95 ring-rose-200 text-rose-900 dark:bg-rose-900/80 dark:text-rose-50 dark:ring-rose-700/40"
      : "bg-white/95 ring-white/70 text-slate-900 dark:bg-slate-900/90 dark:text-white dark:ring-white/15";

  const icon =
    type === "success"
      ? `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round"/></svg>`
      : type === "error"
      ? `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 9v4m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" stroke-width="2" stroke-linecap="round"/></svg>`
      : `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" stroke-width="2" stroke-linecap="round"/></svg>`;

  wrap.innerHTML = `
    <div class="${base} ${tone}">
      ${icon}
      <div class="flex-1">
        <p class="font-semibold">${title}</p>
        ${
          message ? `<p class="text-sm mt-0.5 leading-snug">${message}</p>` : ""
        }
      </div>
      <button aria-label="Tutup" class="shrink-0 rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">✕</button>
    </div>
  `;
  document.body.appendChild(wrap);

  const closeBtn = $("button", wrap);
  const remove = () => {
    wrap.style.animation = "fadeOut .18s ease forwards";
    setTimeout(() => wrap.remove(), 180);
  };
  closeBtn && closeBtn.addEventListener("click", remove, { passive: true });
  setTimeout(remove, 4200);
}

// Inject keyframes fadeIn/fadeOut sekali saja
(() => {
  const id = "toast-anim";
  if (!$("#" + id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent =
      "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
      "@keyframes fadeOut{to{opacity:0;transform:translateY(6px)}}";
    document.head.appendChild(s);
  }
})();

/* ======================================================================
   10) Contact Form — Formspree only (honeypot & validasi)
   ====================================================================== */
(() => {
  const FORM_ENDPOINT = "https://formspree.io/f/mjkakjpl"; // endpoint kamu
  const form = $("#contactForm") || $("#kontakForm");
  if (!form) return;

  const $id = (id) => document.getElementById(id);
  const btn = $("#btnKirim");
  const formMsg = $id("formMsg");

  const setBusy = (busy) => {
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? "0.75" : "1";
    btn.style.pointerEvents = busy ? "none" : "auto";
    btn.innerHTML = busy
      ? `<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-width="2" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="2"/></svg> Mengirim...`
      : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M22 2L11 13" stroke-width="2" stroke-linecap="round"/><path d="M22 2L15 22l-4-9-9-4 20-7Z" stroke-width="2" stroke-linecap="round"/></svg> Kirim`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const namaEl = $id("nama");
    const emailEl = $id("email");
    const pesanEl = $id("pesan");
    const hpEl = $id("website"); // honeypot

    const nama = (namaEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const pesan = (pesanEl?.value || "").trim();
    const honeypot = (hpEl?.value || "").trim();

    // Reset error
    ["err-nama", "err-email", "err-pesan"].forEach((id) => {
      const n = $id(id);
      if (n) n.textContent = "";
    });
    if (formMsg) {
      formMsg.textContent = "";
      formMsg.className = "mt-1 md:col-span-2 text-sm";
    }

    // Validasi sederhana
    let valid = true;
    if (!nama) {
      $id("err-nama") && ($id("err-nama").textContent = "Nama wajib diisi.");
      valid = false;
    }
    if (!email) {
      $id("err-email") && ($id("err-email").textContent = "Email wajib diisi.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      $id("err-email") &&
        ($id("err-email").textContent = "Format email tidak valid.");
      valid = false;
    }
    if (!pesan) {
      $id("err-pesan") && ($id("err-pesan").textContent = "Pesan wajib diisi.");
      valid = false;
    }

    // Honeypot: jika terisi, pura-pura sukses (tahan bot)
    if (honeypot) {
      showToast({
        title: "Terkirim",
        message: "Terima kasih! Kami akan segera membalas.",
        type: "success",
      });
      form.reset();
      return;
    }
    if (!valid) return;

    // Kirim ke Formspree (pakai FormData agar aman CORS, tanpa preflight)
    try {
      setBusy(true);
      if (formMsg) {
        formMsg.textContent = "Mengirim...";
        formMsg.className = "mt-1 md:col-span-2 text-sm text-slate-600";
      }

      const fd = new FormData();
      fd.append("nama", nama);
      fd.append("email", email);
      fd.append("pesan", pesan);
      // opsional berguna di Formspree
      fd.append("_replyto", email);
      fd.append("_subject", "Kontak dari portfolio");

      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" }, // JANGAN set Content-Type
        body: fd,
      });

      let payload = null;
      try {
        payload = await res.json();
      } catch {
        /* ignore parse error */
      }

      if (res.ok) {
        showToast({
          title: "Pesan terkirim 🎉",
          message: "Terima kasih! Saya akan membalas secepatnya ke email Anda.",
          type: "success",
        });
        if (formMsg) {
          formMsg.textContent =
            "Terkirim. Cek email Anda untuk konfirmasi (bila diminta).";
          formMsg.className = "mt-1 md:col-span-2 text-sm text-emerald-600";
        }
        form.reset();
      } else {
        const errText =
          (payload?.errors &&
            payload.errors.map((e) => e.message).join(", ")) ||
          `Gagal mengirim. Status ${res.status}.`;
        showToast({ title: "Gagal mengirim", message: errText, type: "error" });
        if (formMsg) {
          formMsg.textContent = errText;
          formMsg.className = "mt-1 md:col-span-2 text-sm text-rose-600";
        }
      }
    } catch {
      showToast({
        title: "Jaringan bermasalah",
        message: "Periksa koneksi Anda lalu coba lagi.",
        type: "error",
      });
      if (formMsg) {
        formMsg.textContent = "Jaringan bermasalah. Silakan coba lagi.";
        formMsg.className = "mt-1 md:col-span-2 text-sm text-rose-600";
      }
    } finally {
      setBusy(false);
    }
  });
})();
