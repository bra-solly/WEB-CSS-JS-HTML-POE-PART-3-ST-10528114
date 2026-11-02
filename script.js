

(function () {
  "use strict";

  /* -------------------------------------------------------
     0. Tiny helpers
     ------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------------------------------------------------
     1. SERVICE DATA (used for dynamic render + search)
     ------------------------------------------------------- */
  const SERVICES = [
    {
      key: "basic",
      img: "Thunder presents.png",
      alt: "Basic Wash",
      title: "Basic Wash - R120",
      price: 120,
      desc: "Exterior wash, rinse, and dry. A quick refresh for your daily driver."
    },
    {
      key: "standard",
      img: "Thunder presents.png",
      alt: "Standard Wash",
      title: "Standard Wash - R200",
      price: 200,
      desc: "Exterior wash plus interior vacuum and window cleaning."
    },
    {
      key: "premium",
      img: "Thunder presents.png",
      alt: "Premium Wash",
      title: "Premium Wash - R450",
      price: 450,
      desc: "Full detail inside and out, wax coating, and tire shine."
    }
  ];

  // Map key -> exact <option> text used in the booking <select>
  const SERVICE_TITLES = {
    basic:    "Basic Wash - R120",
    standard: "Standard Wash - R200",
    premium:  "Premium Wash - R450"
  };

  /* -------------------------------------------------------
     2. DYNAMIC CONTENT: render service cards from JS
     ------------------------------------------------------- */
  function renderServices(filterText = "") {
    const container = $("#services .cards");
    if (!container) return;

    const q = filterText.trim().toLowerCase();
    const list = SERVICES.filter(s =>
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.desc.toLowerCase().includes(q)
    );

    if (list.length === 0) {
      container.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;color:#777;">' +
        "No wash packages match your search.</p>";
      return;
    }

    container.innerHTML = list.map(s => `
      <div class="card" data-key="${s.key}" data-price="${s.price}">
        <img src="${s.img}" alt="${s.alt}"
             class="service-img" loading="lazy">
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <a href="#booking" class="btn-book" data-key="${s.key}">
          Book ${s.alt.replace(" Wash", "")}
        </a>
      </div>
    `).join("");

    bindCardEvents();
  }

  /* -------------------------------------------------------
     3. SEARCH / FILTER (assignment 2.2)
     ------------------------------------------------------- */
  function initServiceSearch() {
    const section = $("#services");
    if (!section) return;

    const wrap = document.createElement("div");
    wrap.style.cssText = "max-width:480px;margin:0 auto 30px;";
    wrap.innerHTML = `
      <label for="serviceSearch" style="display:block;font-weight:600;
             color:var(--blue);font-size:14px;margin-bottom:4px;">
        Search wash packages
      </label>
      <input id="serviceSearch" type="search"
             placeholder="e.g. premium, vacuum, wax..."
             style="width:100%;padding:10px 12px;border:1px solid #cdd5dd;
                    border-radius:6px;font-family:inherit;font-size:15px;"
             aria-label="Search wash packages">
    `;
    section.querySelector(".container").insertBefore(wrap, $(".cards"));

    $("#serviceSearch").addEventListener("input", e => {
      renderServices(e.target.value);
    });
  }

  /* -------------------------------------------------------
     4. LIGHTBOX MODAL (assignment 2.1)
     ------------------------------------------------------- */
  function buildLightbox() {
    const lb = document.createElement("div");
    lb.id = "lightbox";
    lb.setAttribute("hidden", "");
    lb.style.cssText = `
      position:fixed;inset:0;background:rgba(26,58,92,0.85);
      display:flex;align-items:center;justify-content:center;
      z-index:300;padding:20px;`;
    lb.innerHTML = `
      <div style="position:relative;max-width:90%;max-height:90%;">
        <button id="lightboxClose" aria-label="Close"
          style="position:absolute;top:-40px;right:0;background:var(--gold);
                 color:var(--blue);border:none;width:36px;height:36px;
                 border-radius:50%;font-weight:700;cursor:pointer;
                 font-size:18px;">&times;</button>
        <img id="lightboxImg" src="" alt=""
          style="max-width:80vw;max-height:75vh;border-radius:8px;
                 box-shadow:0 10px 40px rgba(0,0,0,0.5);background:#fff;">
        <p id="lightboxCaption"
          style="color:#fff;text-align:center;margin-top:12px;
                 font-family:'Montserrat',sans-serif;"></p>
      </div>`;
    document.body.appendChild(lb);

    const img = $("#lightboxImg");
    const cap = $("#lightboxCaption");

    function open(src, alt) {
      img.src = src;
      img.alt = alt;
      cap.textContent = alt;
      lb.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
    }
    function close() {
      lb.setAttribute("hidden", "");
      document.body.style.overflow = "";
    }
    lb.addEventListener("click", e => {
      if (e.target === lb || e.target.id === "lightboxClose") close();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !lb.hasAttribute("hidden")) close();
    });

    return open;
  }

  /* -------------------------------------------------------
     5. Per-card events (lightbox + book-button prefill)
     ------------------------------------------------------- */
  let openLightbox = null;

  function bindCardEvents() {
    $$(".service-img").forEach(img => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => {
        if (openLightbox) openLightbox(img.src, img.alt);
      });
    });

    $$(".card .btn-book[data-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.key;
        const select = $("#bookingService");
        if (select) {
          const match = SERVICE_TITLES[key];
          if (match) select.value = match;
          updateBookingPrice();
        }
      });
    });
  }

  /* -------------------------------------------------------
     6. CONFIRMATION MODAL (used by both forms)
     ------------------------------------------------------- */
  function buildConfirmModal() {
    const m = document.createElement("div");
    m.id = "confirmModal";
    m.setAttribute("hidden", "");
    m.style.cssText = `
      position:fixed;inset:0;background:rgba(26,58,92,0.7);
      display:flex;align-items:center;justify-content:center;
      z-index:350;padding:20px;`;
    m.innerHTML = `
      <div style="background:#fff;border-radius:10px;padding:30px;
                  max-width:420px;width:100%;text-align:center;
                  box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="font-size:42px;color:var(--gold);">&#9889;</div>
        <h3 id="confirmTitle" style="margin:10px 0;">Thank you!</h3>
        <p id="confirmBody" style="color:#555;margin-bottom:20px;"></p>
        <button id="confirmOk"
          style="background:var(--blue);color:#fff;border:none;
                 padding:10px 28px;border-radius:30px;font-weight:700;
                 cursor:pointer;">OK</button>
      </div>`;
    document.body.appendChild(m);

    const ok = $("#confirmOk");
    function close() { m.setAttribute("hidden", ""); }
    ok.addEventListener("click", close);
    m.addEventListener("click", e => { if (e.target === m) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !m.hasAttribute("hidden")) close();
    });

    return (title, body) => {
      $("#confirmTitle").textContent = title;
      $("#confirmBody").textContent  = body;
      m.removeAttribute("hidden");
    };
  }

  let showConfirm = null;

  /* -------------------------------------------------------
     7. FORM VALIDATION HELPERS
     ------------------------------------------------------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(\+?27|0)[\s-]?(\d[\s-]?){8,9}\d$/; // SA format

  function showError(input, msg) {
    clearError(input);
    input.style.borderColor = "#d93025";
    input.setAttribute("aria-invalid", "true");
    const e = document.createElement("div");
    e.className = "field-error";
    e.style.cssText = "color:#d93025;font-size:12.5px;margin-top:-10px;" +
                      "margin-bottom:10px;font-weight:600;";
    e.textContent = msg;
    input.parentNode.insertBefore(e, input.nextSibling);
  }

  function clearError(input) {
    input.style.borderColor = "";
    input.removeAttribute("aria-invalid");
    const sib = input.nextElementSibling;
    if (sib && sib.classList && sib.classList.contains("field-error")) {
      sib.remove();
    }
  }

  function validField(input, test, msg) {
    if (!test(input.value.trim())) { showError(input, msg); return false; }
    clearError(input);
    return true;
  }

  /* -------------------------------------------------------
     8. CONTACT FORM validation + AJAX-style submit
     ------------------------------------------------------- */
  function initContactForm() {
    const form = $("#contact form");
    if (!form) return;

    form.removeAttribute("onsubmit");
    form.addEventListener("submit", e => {
      e.preventDefault();

      const name  = $("#cName");
      const email = $("#cEmail");
      const msg   = $("#cMsg");

      let ok = true;
      ok &= validField(name,
        v => v.length >= 2,
        "Please enter your name (min 2 characters).");
      ok &= validField(email,
        v => EMAIL_RE.test(v),
        "Please enter a valid email address.");
      ok &= validField(msg,
        v => v.length >= 10,
        "Message must be at least 10 characters.");

      if (!ok) return;

      const data = {
        name: name.value.trim(),
        email: email.value.trim(),
        message: msg.value.trim(),
        _subject: "New website enquiry - Thunder Brothers"
      };

      // Real AJAX (uncomment + replace endpoint with Formspree URL):
      // fetch("https://formspree.io/f/XXXX", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", "Accept": "application/json" },
      //   body: JSON.stringify(data)
      // }).then(r => r.ok
      //   ? showConfirm("Message sent!", "Thanks " + data.name + ", we will reply within 24 hours.")
      //   : showConfirm("Oops", "Something went wrong. Please email us directly.")
      // ).catch(() => showConfirm("Oops", "Network error. Please try again."));

      // Simulated success (works on GitHub Pages with no backend):
      showConfirm(
        "Message sent!",
        "Thanks " + data.name + ", we will reply to " +
        data.email + " within 24 hours."
      );
      form.reset();
    });

    [$("#cName"), $("#cEmail"), $("#cMsg")].forEach(inp => {
      inp.addEventListener("input", () => clearError(inp));
    });
  }

  /* -------------------------------------------------------
     9. BOOKING FORM validation + price + AJAX submit
     ------------------------------------------------------- */
  function initBookingForm() {
    const form = $("#booking form");
    if (!form) return;

    const inputs = form.querySelectorAll("input, select, textarea");
    const ids = [
      "bookingFname", "bookingLname", "bookingPhone",
      "bookingMake", "bookingModel",
      "bookingService", "bookingDate", "bookingTime"
    ];
    inputs.forEach((el, i) => { if (ids[i] && !el.id) el.id = ids[i]; });

    const serviceSelect = form.querySelector("select");
    const dateInput     = form.querySelector("input[type='date']");

    if (dateInput) {
      const today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
    }

    form.removeAttribute("onsubmit");
    form.addEventListener("submit", e => {
      e.preventDefault();

      const fname = $("#bookingFname");
      const lname = $("#bookingLname");
      const phone = $("#bookingPhone");
      const make  = $("#bookingMake");
      const model = $("#bookingModel");
      const svc   = $("#bookingService");
      const date  = $("#bookingDate");
      const time  = $("#bookingTime");

      let ok = true;
      ok &= validField(fname, v => v.length >= 2, "Enter your first name.");
      ok &= validField(lname, v => v.length >= 2, "Enter your last name.");
      ok &= validField(phone,
        v => PHONE_RE.test(v),
        "Enter a valid SA phone (e.g. 083 257 0119).");
      ok &= validField(make, v => v.length >= 2, "Enter the car make.");
      ok &= validField(model, v => v.length >= 1, "Enter the car model.");
      ok &= validField(svc, v => v !== "", "Please choose a service.");
      ok &= validField(date,
        v => v && new Date(v) >= new Date(new Date().toDateString()),
        "Pick today or a future date.");
      ok &= validField(time, v => v !== "", "Please pick a time slot.");

      if (!ok) return;

      const data = {
        firstName: fname.value.trim(),
        lastName:  lname.value.trim(),
        phone:     phone.value.trim(),
        carMake:   make.value.trim(),
        carModel:  model.value.trim(),
        service:   svc.value,
        date:      date.value,
        time:      time.value
      };

      showConfirm(
        "Booking confirmed!",
        "See you on " + data.date + " at " + data.time +
        " for your " + data.service + ", " + data.firstName + "."
      );
      form.reset();
      updateBookingPrice();
    });

    inputs.forEach(el =>
      el.addEventListener("input", () => clearError(el)));
    if (serviceSelect) serviceSelect.addEventListener("change", updateBookingPrice);
  }

  /* -------------------------------------------------------
     10. BOOKING PRICE CALCULATOR
     ------------------------------------------------------- */
  function ensurePriceBox() {
    const form = $("#booking form");
    if (!form || $("#bookingPriceBox")) return;
    const box = document.createElement("div");
    box.id = "bookingPriceBox";
    box.style.cssText = `
      background:var(--light-bg);border:1px solid var(--border);
      border-radius:8px;padding:12px 15px;margin:15px 0;
      font-family:'Montserrat',sans-serif;color:var(--blue);`;
    box.innerHTML = `
      <strong>Estimated total:</strong>
      <span id="bookingPrice" style="float:right;font-size:18px;">
        R 0
      </span>`;
    form.appendChild(box);
  }

  function updateBookingPrice() {
    const sel = $("#bookingService");
    const out = $("#bookingPrice");
    if (!sel || !out) return;
    let price = 0;
    if (sel.value.includes("Basic"))    price = 120;
    if (sel.value.includes("Standard")) price = 200;
    if (sel.value.includes("Premium"))  price = 450;
    out.textContent = "R " + price;
  }

  /* -------------------------------------------------------
     11. ACTIVE NAV LINK on scroll + FAB visibility
     ------------------------------------------------------- */
  function initScrollHelpers() {
    const sections = $$("section[id]");
    const navLinks = $$(".nav-links a[href^='#']");
    const fab = $(".fab");

    function onScroll() {
      const pos = window.scrollY + 120;

      let current = "";
      sections.forEach(sec => {
        if (pos >= sec.offsetTop) current = sec.id;
      });
      navLinks.forEach(a => {
        if (a.classList.contains("btn-book")) return;
        if (a.getAttribute("href") === "#" + current) {
          a.style.background = "rgba(255,255,255,0.15)";
        } else {
          a.style.background = "";
        }
      });

      if (fab) {
        fab.style.display = window.scrollY > 500 ? "block" : "none";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    navLinks.forEach(a => {
      a.addEventListener("click", e => {
        const target = $(a.getAttribute("href"));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /* -------------------------------------------------------
     12. SCROLL REVEAL animation (CSS + JS, assignment 2.1)
     ------------------------------------------------------- */
  function initReveal() {
    const targets = $$(".card, .team li, .info-block, form");
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.style.opacity = "1";
          en.target.style.transform = "translateY(0)";
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });

    targets.forEach(t => {
      t.style.opacity = "0";
      t.style.transform = "translateY(20px)";
      t.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      io.observe(t);
    });
  }

  /* -------------------------------------------------------
     13. MOBILE NAV TOGGLE (hamburger)
     ------------------------------------------------------- */
  function initMobileNav() {
    const nav = $("nav");
    const links = $(".nav-links");
    if (!nav || !links) return;

    const btn = document.createElement("button");
    btn.className = "nav-toggle";
    btn.setAttribute("aria-label", "Toggle navigation");
    btn.innerHTML = "&#9776;";
    btn.style.cssText = `
      display:none;background:transparent;border:none;color:#fff;
      font-size:24px;cursor:pointer;order:3;`;
    nav.appendChild(btn);

    function needToggle() {
      btn.style.display = window.innerWidth <= 768 ? "block" : "none";
      if (window.innerWidth > 768) {
        links.style.display = "";
      }
    }
    needToggle();
    window.addEventListener("resize", needToggle);

    btn.addEventListener("click", () => {
      const open = links.style.display === "flex";
      links.style.display = open ? "none" : "flex";
      links.style.width = "100%";
      links.style.justifyContent = "center";
    });
  }

  /* -------------------------------------------------------
     14. FOOTER YEAR (auto-update)
     ------------------------------------------------------- */
  function initFooterYear() {
    const p = $("footer p");
    if (!p) return;
    p.innerHTML = p.innerHTML.replace(
      /&copy; (\d{4})|© (\d{4})/,
      "&copy; " + new Date().getFullYear()
    );
  }


  document.addEventListener("DOMContentLoaded", () => {
    openLightbox = buildLightbox();
    showConfirm  = buildConfirmModal();

    renderServices();
    initServiceSearch();
    bindCardEvents();
    initContactForm();
    initBookingForm();
    ensurePriceBox();
    updateBookingPrice();
    initScrollHelpers();
    initReveal();
    initMobileNav();
    initFooterYear();

    console.log("%c\u26A1 Thunder Brothers JS ready",
                "color:#f5a623;font-weight:bold;font-size:14px;");
  });
})();