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

// ============ Contact Form (mailto) ============
// DUKUNG KEDUA ID: "contactForm" atau "kontakForm"
const form =
  document.getElementById("contactForm") ||
  document.getElementById("kontakForm");

if (form) {
  const $id = (id) => document.getElementById(id);
  const TO_EMAIL = "danijuhaenimo@gmail.com";

  // Pastikan tombol submit ada type="submit" di HTML.
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const namaEl = $id("nama");
    const emailEl = $id("email");
    const pesanEl = $id("pesan");
    const nama = (namaEl?.value || "").trim();
    const email = (emailEl?.value || "").trim();
    const pesan = (pesanEl?.value || "").trim();

    // reset error
    ["err-nama", "err-email", "err-pesan"].forEach((id) => {
      const n = $id(id);
      if (n) n.textContent = "";
    });
    const formMsg = $id("formMsg");
    if (formMsg) {
      formMsg.textContent = "";
      formMsg.className = "mt-3 text-sm";
    }

    // validasi ringan
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
    if (!valid) return;

    // Bangun mailto
    const subject = encodeURIComponent(`[Portofolio] Pesan dari ${nama}`);
    const body = encodeURIComponent(
      `Nama  : ${nama}\nEmail : ${email}\n\nPesan:\n${pesan}`
    );
    const mailtoURL = `mailto:${TO_EMAIL}?subject=${subject}&body=${body}`;

    // Fallback 1: anchor.click() (paling kompatibel di iOS/Safari)
    const a = document.createElement("a");
    a.href = mailtoURL;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Fallback 2: location.assign (Chrome/Edge/Firefox lazim)
    setTimeout(() => {
      try {
        window.location.assign(mailtoURL);
      } catch {}

      // Fallback 3: window.open (beberapa browser/handler mail)
      setTimeout(() => {
        try {
          window.open(mailtoURL, "_self");
        } catch {}
      }, 120);
    }, 80);

    if (formMsg) {
      formMsg.textContent = `Membuka aplikasi email Anda... Jika tidak muncul, kirim manual ke ${TO_EMAIL}`;
      formMsg.className = "mt-3 text-sm text-slate-700";
    }
  });
} else {
  // Jika form tidak ditemukan, bantu debug di Console
  // console.warn("Form kontak tidak ditemukan. Pastikan id-nya 'contactForm' atau 'kontakForm'.");
}

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
