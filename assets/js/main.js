(function () {
  "use strict";
  var FORM_EMAIL = "bubble.youthimpact@gmail.com";
  var AJAX_URL = "https://formsubmit.co/ajax/" + FORM_EMAIL;
  var body = document.body;
  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  var isPreview = body.getAttribute("data-mode") === "preview";
  root.classList.add("js");

  /* ---------- Header on scroll ---------- */
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) { var first = menu.querySelector("a"); if (first) first.focus({ preventScroll: true }); }
  }
  toggle.addEventListener("click", function () { setMenu(!body.classList.contains("menu-open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); }
    if (e.key === "Tab" && body.classList.contains("menu-open")) {
      var f = [toggle].concat([].slice.call(menu.querySelectorAll("a,button")));
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  var mq = window.matchMedia("(min-width:1025px)");
  var mqHandler = function (m) { if (m.matches) setMenu(false); };
  if (mq.addEventListener) mq.addEventListener("change", mqHandler); else if (mq.addListener) mq.addListener(mqHandler);
  setMenu(false);

  /* ---------- Back to top ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-top]");
    if (t) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  /* ---------- Active nav ---------- */
  function markActive(key) {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      if (a.getAttribute("data-nav") === key) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------- Scroll reveal ---------- */
  var io = "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  function reveal(scope) {
    scope.querySelectorAll(".card,.stat,.dish,.split > *,.job,.res-card,.founder,.section-head,.form-card").forEach(function (el) {
      if (el.classList.contains("in")) return;
      if (!io) { el.classList.add("in"); return; }
      el.classList.add("reveal"); io.observe(el);
    });
  }

  /* ---------- Preview router (single-file preview only) ---------- */
  if (isPreview) {
    var pages = document.querySelectorAll("main > [data-page]");
    var render = function (name) {
      var parts = (name || "home").split("--");
      var target = document.querySelector('[data-page="' + parts[0] + '"]');
      if (!target) return false;
      pages.forEach(function (p) { p.hidden = p !== target; });
      markActive(target.getAttribute("data-section"));
      document.title = target.getAttribute("data-title");
      setMenu(false);
      reveal(target);
      var anchor = parts[1] && target.querySelector("#" + parts[1]);
      if (anchor) { anchor.scrollIntoView(); } else { window.scrollTo(0, 0); }
      onScroll();
      return true;
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.hasAttribute("data-top")) return;
      var name = a.getAttribute("href").slice(1);
      if (name === "main") return;
      if (document.querySelector('[data-page="' + name.split("--")[0] + '"]')) {
        e.preventDefault();
        render(name);
        try { history.pushState(null, "", "#" + name); } catch (err) { /* sandboxed viewer: ignore */ }
      }
    });
    var fromHash = function () { render((location.hash || "#home").slice(1)) || render("home"); };
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    fromHash();
  } else {
    markActive(body.getAttribute("data-section"));
    reveal(document);
  }

  /* ---------- Carousel ---------- */
  document.querySelectorAll(".carousel").forEach(function (c) {
    var track = c.querySelector(".carousel-track");
    var slides = track.children;
    var dotsWrap = c.parentNode.querySelector(".dots");
    var dots = [];
    for (var i = 0; i < slides.length; i++) {
      (function (n) {
        var b = document.createElement("button");
        b.type = "button"; b.setAttribute("aria-label", "Go to slide " + (n + 1));
        b.addEventListener("click", function () { go(n); });
        dotsWrap.appendChild(b); dots.push(b);
      })(i);
    }
    function current() { return track.clientWidth ? Math.round(track.scrollLeft / track.clientWidth) : 0; }
    function go(n) { n = (n + slides.length) % slides.length; track.scrollTo({ left: n * track.clientWidth }); }
    function sync() { var n = current(); dots.forEach(function (d, j) { d.setAttribute("aria-current", String(j === n)); }); }
    track.addEventListener("scroll", function () { window.requestAnimationFrame(sync); }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
    });
    // Autoplay every 4s; pauses on hover/focus, when the tab is hidden, or with reduced motion.
    var timer = null, paused = false;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function start() {
      stop();
      if (reduce) return;
      timer = setInterval(function () {
        if (paused || document.hidden || !track.clientWidth) return;
        go(current() + 1);
      }, 4000);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    c.addEventListener("mouseenter", function () { paused = true; });
    c.addEventListener("mouseleave", function () { paused = false; });
    c.addEventListener("focusin", function () { paused = true; });
    c.addEventListener("focusout", function () { paused = false; });
    c.querySelector(".prev").addEventListener("click", function () { go(current() - 1); start(); });
    c.querySelector(".next").addEventListener("click", function () { go(current() + 1); start(); });
    dots.forEach(function (d) { d.addEventListener("click", start); });
    track.addEventListener("touchstart", start, { passive: true });
    sync();
    start();
  });

  /* ---------- Gallery lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var content = lb.querySelector(".lightbox-content");
    var count = lb.querySelector(".lb-count");
    var items = [], idx = 0, lastFocus = null;
    var show = function (n) {
      idx = (n + items.length) % items.length;
      var src = items[idx].querySelector("img");
      var im = document.createElement("img");
      im.src = src.currentSrc || src.src; im.alt = src.alt;
      content.innerHTML = ""; content.appendChild(im);
      count.textContent = (idx + 1) + " / " + items.length;
    };
    var close = function () { lb.classList.remove("open"); body.style.overflow = ""; if (lastFocus) lastFocus.focus(); };
    document.querySelectorAll(".gallery").forEach(function (g) {
      var list = [].slice.call(g.querySelectorAll(".gallery-item"));
      list.forEach(function (it, n) {
        it.addEventListener("click", function () {
          items = list; lastFocus = it; show(n);
          lb.classList.add("open"); body.style.overflow = "hidden";
          lb.querySelector(".lb-close").focus();
        });
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target === content) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Document (PDF) viewer ---------- */
  var dv = document.querySelector(".doc-viewer");
  if (dv) {
    var dvBody = dv.querySelector(".dv-body");
    var dvCount = dv.querySelector(".dv-count");
    var dvPages = [].slice.call(dv.querySelectorAll(".dv-img"));
    var dvLast = null;
    var dvSync = function () {
      var top = dvBody.getBoundingClientRect().top + 80, cur = 1;
      for (var i = 0; i < dvPages.length; i++) { if (dvPages[i].getBoundingClientRect().top <= top) cur = i + 1; else break; }
      dvCount.textContent = "Page " + cur + " / " + dvPages.length;
    };
    var dvOpen = function (page, opener) {
      dvLast = opener;
      dv.hidden = false;
      body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        dv.classList.add("open");
        var target = dvPages[Math.max(0, Math.min(dvPages.length, page) - 1)];
        // load the target page and its neighbours right away
        for (var k = page - 2; k <= page + 1; k++) if (dvPages[k]) dvPages[k].loading = "eager";
        dvBody.scrollTop = target.offsetTop - 12;
        dvSync();
        dv.querySelector(".dv-close").focus({ preventScroll: true });
      });
    };
    var dvClose = function () {
      dv.classList.remove("open");
      dv.hidden = true;
      body.style.overflow = "";
      if (dvLast) dvLast.focus();
    };
    document.addEventListener("click", function (e) {
      var o = e.target.closest("[data-doc-open]");
      if (o) { e.preventDefault(); dvOpen(parseInt(o.getAttribute("data-doc-open"), 10) || 1, o); }
    });
    dv.querySelector(".dv-close").addEventListener("click", dvClose);
    dv.addEventListener("click", function (e) { if (e.target === dv) dvClose(); });
    dvBody.addEventListener("scroll", function () { requestAnimationFrame(dvSync); }, { passive: true });
    document.addEventListener("keydown", function (e) { if (!dv.hidden && e.key === "Escape") dvClose(); });
  }

  /* ---------- File upload label ---------- */
  document.querySelectorAll(".upload").forEach(function (u) {
    var input = u.querySelector("input[type=file]");
    var label = u.querySelector(".upload-text");
    var original = label.innerHTML;
    input.addEventListener("change", function () {
      if (input.files.length) {
        label.textContent = "📄 " + input.files[0].name;
        var s = document.createElement("small"); s.textContent = "Click to change"; label.appendChild(s);
      } else { label.innerHTML = original; }
      u.classList.remove("invalid");
    });
    ["dragenter", "dragover"].forEach(function (ev) { u.addEventListener(ev, function () { u.classList.add("drag"); }); });
    ["dragleave", "drop"].forEach(function (ev) { u.addEventListener(ev, function () { u.classList.remove("drag"); }); });
  });

  /* ---------- Forms → FormSubmit ---------- */
  function say(msg, text, isError) { msg.textContent = text; msg.className = "form-msg show" + (isError ? " error" : ""); }
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var msg = form.querySelector(".form-msg");
    var btn = form.querySelector("button[type=submit]");
    var btnText = btn.textContent;
    form.addEventListener("input", function (e) { if (e.target.classList) e.target.classList.remove("invalid"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
        var valid = el.type === "file" ? el.files.length > 0 : el.checkValidity() && el.value.trim() !== "";
        var box = el.type === "file" ? el.closest(".upload") : el;
        box.classList.toggle("invalid", !valid);
        if (!valid && ok) { ok = false; el.focus(); }
      });
      if (!ok) { say(msg, "Please fill in the highlighted fields.", true); return; }

      var honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) { say(msg, form.getAttribute("data-success") || "Thank you!"); form.reset(); return; }

      if (isPreview) {
        say(msg, "Preview only — this form can't send from the preview. On the live site it is delivered by email through FormSubmit.");
        return;
      }

      if (form.getAttribute("data-mode-submit") === "native") {
        // Native multipart POST so the resume file is attached; FormSubmit redirects to the thank-you page.
        form.querySelector('[name="_next"]').value = new URL(form.getAttribute("data-next"), location.href).href;
        btn.disabled = true; btn.textContent = "Sending…";
        HTMLFormElement.prototype.submit.call(form);
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(AJAX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && String(res.j.success) !== "false") { say(msg, form.getAttribute("data-success")); form.reset(); }
          else { say(msg, (res.j && res.j.message) || "Something went wrong. Please try again.", true); }
        })
        .catch(function () { say(msg, "We couldn't send your message. Please check your connection and try again.", true); })
        .then(function () { btn.disabled = false; btn.textContent = btnText; });
    });
  });

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
