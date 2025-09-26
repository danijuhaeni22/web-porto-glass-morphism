// ============ Mobile Nav Toggle ============
const btnMenu = document.getElementById("btnMenu");
const mobileNav = document.getElementById("mobileNav");

if (btnMenu && mobileNav) {
  btnMenu.addEventListener("click", () => {
    const expanded = btnMenu.getAttribute("aria-expanded") === "true";
    btnMenu.setAttribute("aria-expanded", String(!expanded));
    mobileNav.style.maxHeight = expanded
      ? "0px"
      : mobileNav.scrollHeight + "px";
  });

  mobileNav.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      btnMenu.setAttribute("aria-expanded", "false");
      mobileNav.style.maxHeight = "0px";
    });
  });
}

// ============ Smooth Scroll ============
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (e) => {
    const id = anchor.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  });
});

// ============ Footer Year ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============ Navbar scroll state (stabil, anti-godek) ============
(() => {
  const header = document.getElementById("appHeader");
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

// ============ Reveal on Scroll ============
(() => {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || items.length === 0) {
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

// ============ Back to Top ============
(() => {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  const toggle = () => {
    if ((window.scrollY || document.documentElement.scrollTop) > 300) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  };
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  });
})();

// ============ Force Download CV (Blob) ============
async function forceDownload(url, filename) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "CV.pdf";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  } catch (e) {
    window.open(url, "_blank");
  }
}
const dl1 = document.getElementById("downloadCv");
if (dl1) {
  dl1.addEventListener("click", (e) => {
    e.preventDefault();
    forceDownload(dl1.getAttribute("href"), "Raka_Pratama_CV.pdf");
  });
}
const dl2 = document.getElementById("downloadCvMobile");
if (dl2) {
  dl2.addEventListener("click", (e) => {
    e.preventDefault();
    forceDownload(dl2.getAttribute("href"), "Raka_Pratama_CV.pdf");
  });
}

// ============ Theme Manager (Light/Dark) ============
(() => {
  const html = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const btnMobile = document.getElementById("themeToggleMobile");

  const setPressed = (isDark) => {
    [btn, btnMobile].forEach(
      (b) => b && b.setAttribute("aria-pressed", String(isDark))
    );
  };

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    html.classList.toggle("dark", isDark);
    html.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    setPressed(isDark);
  };

  const currentTheme = () =>
    html.getAttribute("data-theme") ||
    (html.classList.contains("dark") ? "dark" : "light");

  const toggle = () => applyTheme(currentTheme() === "dark" ? "light" : "dark");

  // Inisialisasi state tombol sesuai tema aktif (dipasang dari bootstrap <head>)
  setPressed(currentTheme() === "dark");

  // Event click
  [btn, btnMobile].forEach((b) => b && b.addEventListener("click", toggle));

  // Ikuti perubahan sistem HANYA bila user belum memilih manual (tidak ada localStorage)
  let hasUserChoice = false;
  try {
    hasUserChoice = !!localStorage.getItem("theme");
  } catch {}

  const mql =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = (e) => {
    if (!hasUserChoice) applyTheme(e.matches ? "dark" : "light");
  };
  if (mql && (mql.addEventListener || mql.addListener)) {
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange); // Safari lama
  }
})();

// ============ Util: Toast Notifikasi ============
function showToast({
  title = "Berhasil",
  message = "",
  type = "success",
} = {}) {
  // type: success | error | info
  const wrap = document.createElement("div");
  wrap.className = "fixed bottom-4 right-4 z-50 animate-[fadeIn_.2s_ease]";

  const base =
    "min-w-[260px] max-w-[92vw] sm:max-w-sm px-4 py-3 rounded-xl ring-1 shadow-xl flex items-start gap-3 " +
    "backdrop-blur";
  const tone =
    type === "success"
      ? "bg-white/95 ring-white/70 text-slate-900 dark:bg-slate-900/90 dark:text-white dark:ring-white/15"
      : type === "error"
      ? "bg-rose-50/95 ring-rose-200 text-rose-900 dark:bg-rose-900/80 dark:text-rose-50 dark:ring-rose-700/40"
      : "bg-white/95 ring-white/70 text-slate-900 dark:bg-slate-900/90 dark:text-white dark:ring-white/15";

  const icon =
    type === "success"
      ? `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round"/></svg>`
      : type === "error"
      ? `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 9v4m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" stroke-width="2" stroke-linecap="round"/></svg>`
      : `<svg class="w-5 h-5 mt-0.5 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 16h-1v-4h-1m1-4h.01M12 19a7 7 0 110-14 7 7 0 010 14z" stroke-width="2" stroke-linecap="round"/></svg>`;

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
  const closeBtn = wrap.querySelector("button");
  const remove = () => {
    wrap.style.animation = "fadeOut .18s ease forwards";
    setTimeout(() => wrap.remove(), 180);
  };
  closeBtn.addEventListener("click", remove);
  setTimeout(remove, 4200);
}

// Inject keyframes fadeIn/fadeOut sekali saja
(() => {
  const id = "toast-anim";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent =
      "@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}" +
      "@keyframes fadeOut{to{opacity:0;transform:translateY(6px)}}";
    document.head.appendChild(s);
  }
})();

// ============ Contact Form — Formspree only (no mailto) ============
(() => {
  const FORM_ENDPOINT = "https://formspree.io/f/mjkakjpl"; // <- endpoint kamu
  const form =
    document.getElementById("contactForm") ||
    document.getElementById("kontakForm");
  if (!form) return;

  const $id = (id) => document.getElementById(id);
  const btn = document.getElementById("btnKirim");
  const formMsg = $id("formMsg");

  const setBusy = (busy) => {
    if (!btn) return;
    btn.disabled = busy;
    btn.style.opacity = busy ? "0.75" : "1";
    btn.style.pointerEvents = busy ? "none" : "auto";
    btn.innerHTML = busy
      ? `<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" stroke-width="2" opacity=".25"/><path d="M12 3a9 9 0 0 1 9 9" stroke-width="2"/></svg> Mengirim...`
      : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13" stroke-width="2" stroke-linecap="round"/><path d="M22 2L15 22l-4-9-9-4 20-7Z" stroke-width="2" stroke-linecap="round"/></svg> Kirim`;
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
    // Honeypot harus kosong. Jika terisi, pura-pura sukses (supaya bot diam), tapi jangan kirim.
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

    // Kirim ke Formspree
    try {
      setBusy(true);
      if (formMsg) {
        formMsg.textContent = "Mengirim...";
        formMsg.className = "mt-1 md:col-span-2 text-sm text-slate-600";
      }

      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama, email, pesan }),
      });

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
        // coba baca pesan error dari Formspree
        let errText = "Gagal mengirim. Coba lagi sebentar lagi.";
        try {
          const data = await res.json();
          if (data?.errors && data.errors.length) {
            errText = data.errors.map((e) => e.message).join(", ");
          }
        } catch {}
        showToast({ title: "Gagal mengirim", message: errText, type: "error" });
        if (formMsg) {
          formMsg.textContent = errText;
          formMsg.className = "mt-1 md:col-span-2 text-sm text-rose-600";
        }
      }
    } catch (err) {
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
