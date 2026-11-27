/* 꿀픽로그 대시보드 — app.js
   모든 수치는 data.json 에서 읽어 렌더링합니다. */

(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var nf = new Intl.NumberFormat("ko-KR");
  var won = function (n) { return nf.format(n) + "원"; };

  var PF = {
    naver:     { color: "#03C75A", mark: "N" },
    coupang:   { color: "#FF5A3C", mark: "C" },
    toss:      { color: "#3182F6", mark: "T" },
    youtube:   { color: "#FF4D4D", mark: "Y" },
    instagram: { color: "#FF7AA2", mark: "I" },
    threads:   { color: "#B47BFF", mark: "S" },
    tiktok:    { color: "#2BE3DC", mark: "T" },
    blog:      { color: "#3BC48C", mark: "B" }
  };
  var pfOf = function (key) { return PF[key] || { color: "#E8B33C", mark: "·" }; };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- 테마 ---------- */
  var themeBtn = $("#theme-toggle");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#F6F3EC" : "#0C0D11");
  }
  applyTheme(document.documentElement.getAttribute("data-theme") || "dark");
  themeBtn.addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("kkulpicklog-theme", next); } catch (e) {}
  });

  /* ---------- 토스트 ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1900);
  }

  function copy(text, okMsg) {
    var done = function () { toast(okMsg || "복사했어요"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("복사가 안 돼요 — 링크를 길게 눌러 복사해 주세요"); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- 렌더 ---------- */
  function renderHead(d) {
    if (d.brand) {
      if (d.brand.name) $("#brand-name").textContent = d.brand.name;
      if (d.brand.handle) $("#brand-handle").textContent = d.brand.handle;
      if (d.brand.dashboard_title) $("#brand-title").textContent = d.brand.dashboard_title;
      if (d.brand.name) document.title = d.brand.name + " 대시보드 · " + (d.brand.handle || "");
    }
    var label = (d.meta && (d.meta.updated_label || d.meta.updated_at)) || "";
    if (label) {
      $("#updated").textContent = label + " 기준";
      $("#footer-updated").textContent = "데이터 " + label;
    }
    if (d.meta && d.meta.note) $("#foot-note").textContent = d.meta.note;
  }

  function renderKpis(list) {
    var grid = $("#kpi-grid");
    grid.innerHTML = (list || []).map(function (k) {
      return '<article class="kpi ' + esc(k.tone || "") + '">' +
        '<div class="kpi-label">' + esc(k.label) + '</div>' +
        '<div class="kpi-value"><strong>' + esc(k.value) + '</strong>' +
        (k.unit ? '<span class="kpi-unit">' + esc(k.unit) + '</span>' : '') + '</div>' +
        (k.sub ? '<div class="kpi-sub">' + esc(k.sub) + '</div>' : '') +
      '</article>';
    }).join("");
  }

  function renderGoal(c) {
    if (!c) return;
    var pct = typeof c.percent === "number" ? c.percent
      : (c.target ? (c.current / c.target) * 100 : 0);
    pct = Math.max(0, Math.min(100, pct));
    if (c.label) $("#goal-sub").textContent = c.label + " 기준";
    $("#goal-current").textContent = won(c.current);
    $("#goal-target").textContent = won(c.target);
    $("#goal-pct").textContent = pct.toFixed(1).replace(/\.0$/, "") + "%";

    var r = 52, circ = 2 * Math.PI * r;
    var bar = $("#ring-bar");
    bar.style.strokeDasharray = circ.toFixed(1);
    bar.style.strokeDashoffset = circ.toFixed(1);
    var fill = $("#goal-track-fill");
    fill.style.width = "0%";
    requestAnimationFrame(function () {
      setTimeout(function () {
        bar.style.strokeDashoffset = (circ * (1 - pct / 100)).toFixed(1);
        fill.style.width = pct + "%";
      }, 120);
    });

    $("#goal-rows").innerHTML = (c.rows || []).map(function (row) {
      return '<div><dt>' + esc(row.label) + '</dt><dd>' + esc(row.value) + '</dd></div>';
    }).join("");
  }

  function renderMix(list) {
    var svg = $("#mix-donut");
    var total = (list || []).reduce(function (a, b) { return a + (b.value || 0); }, 0);
    $("#mix-total").textContent = nf.format(total);
    if (!total) { svg.innerHTML = ""; return; }

    var r = 46, circ = 2 * Math.PI * r, offset = 0, gap = 2.4;
    var parts = [];
    parts.push('<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="var(--track)" stroke-width="14"></circle>');
    list.forEach(function (it) {
      var len = (it.value / total) * circ;
      var dash = Math.max(len - gap, 0.5);
      parts.push('<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="' + esc(it.color || "#E8B33C") +
        '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + " " + (circ - dash).toFixed(1) +
        '" stroke-dashoffset="' + (-offset).toFixed(1) + '" transform="rotate(0 60 60)"></circle>');
      offset += len;
    });
    svg.innerHTML = parts.join("");

    $("#mix-legend").innerHTML = list.map(function (it) {
      return '<li><span class="dotc" style="background:' + esc(it.color || "#E8B33C") + '"></span>' +
        '<span class="nm">' + esc(it.label) + '</span>' +
        '<span class="vl">' + nf.format(it.value) + '건</span></li>';
    }).join("");
  }

  function renderCommission(list, limit) {
    var rows = (list || []).filter(function (a) { return typeof a.commission === "number"; })
      .sort(function (a, b) { return b.commission - a.commission; })
      .slice(0, limit || 6);
    var max = rows.length ? rows[0].commission : 1;
    $("#commission-bars").innerHTML = rows.map(function (a) {
      var p = Math.max(6, (a.commission / max) * 100);
      return '<li class="' + (a.platform_key === "coupang" ? "p3" : "") + '">' +
        '<span class="bar-name">' + esc(a.product) + ' · ' + esc(a.platform) + '</span>' +
        '<span class="bar-val">' + a.commission + '%</span>' +
        '<span class="bar-line"><span data-w="' + p.toFixed(1) + '"></span></span>' +
      '</li>';
    }).join("");
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(document.querySelectorAll("#commission-bars .bar-line span"), function (el) {
        el.style.width = el.getAttribute("data-w") + "%";
      });
    });
  }

  function renderPlatforms(list) {
    $("#platform-grid").innerHTML = (list || []).map(function (p) {
      return '<article class="pill-card">' +
        '<div class="pill-top"><span class="pill-name">' + esc(p.name) + '</span>' +
        '<span class="state ' + esc(p.state_key || "") + '">' + esc(p.state) + '</span></div>' +
        (p.detail ? '<div class="pill-detail">' + esc(p.detail) + '</div>' : '') +
      '</article>';
    }).join("");
  }

  function renderContents(list) {
    $("#content-grid").innerHTML = (list || []).map(function (c) {
      var pf = pfOf(c.platform_key);
      return '<a class="content-card" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer" ' +
        'style="--pf:' + esc(pf.color) + '">' +
        '<div class="cc-top"><span class="pf-badge">' + esc(pf.mark) + '</span>' +
        '<span class="cc-platform">' + esc(c.platform) + '</span><span class="cc-arrow" aria-hidden="true">↗</span></div>' +
        '<div class="cc-title">' + esc(c.title) + '</div>' +
        '<div class="cc-kind">' + esc(c.kind) + '</div>' +
      '</a>';
    }).join("");
  }

  function renderAffiliates(list) {
    $("#aff-body").innerHTML = (list || []).map(function (a, i) {
      var pf = pfOf(a.platform_key);
      var rate = typeof a.commission === "number"
        ? '<span class="rate">' + a.commission + '%</span>'
        : '<span class="rate none">미표기</span>';
      return '<tr>' +
        '<td data-label="상품"><div class="aff-prod">' + esc(a.product) + '</div></td>' +
        '<td data-label="분류"><span class="aff-cat">' + esc(a.category || "—") + '</span></td>' +
        '<td data-label="플랫폼"><span class="aff-plat" style="--pf:' + esc(pf.color) + '"><i>' + esc(pf.mark) + '</i>' +
          esc(a.platform) + '</span></td>' +
        '<td data-label="수수료" class="num">' + rate + '</td>' +
        '<td data-label="링크" class="act"><div class="aff-actions">' +
          '<button class="btn" type="button" data-copy="' + esc(a.url) + '" data-idx="' + i + '" aria-label="' + esc(a.product) + ' 링크 복사">' +
            '<span aria-hidden="true">⧉</span><span class="lbl-full">복사</span></button>' +
          '<a class="btn primary" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(a.product) + ' 링크 열기">열기</a>' +
        '</div></td>' +
      '</tr>';
    }).join("");
  }

  function renderChannels(list) {
    $("#channel-grid").innerHTML = (list || []).map(function (c) {
      var pf = pfOf(c.key);
      return '<a class="channel" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer" style="--pf:' + esc(pf.color) + '">' +
        '<span class="channel-mark">' + esc(pf.mark) + '</span>' +
        '<span class="channel-txt"><span class="channel-name">' + esc(c.name) + '</span>' +
        '<span class="channel-handle">' + esc(c.handle) + '</span></span>' +
      '</a>';
    }).join("");
  }

  function renderChecklist(list) {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("kkulpicklog-todo") || "{}"); } catch (e) {}
    $("#todo-list").innerHTML = (list || []).map(function (t) {
      var done = !!saved[t.id];
      return '<li class="todo' + (done ? " done" : "") + '" data-id="' + esc(t.id) + '">' +
        '<input type="checkbox"' + (done ? " checked" : "") + ' aria-label="' + esc(t.task) + ' 완료">' +
        '<div class="todo-txt"><div class="todo-task">' + esc(t.task) +
          (t.urgent ? '<span class="due">마감</span>' : "") + '</div>' +
          (t.detail ? '<div class="todo-detail">' + esc(t.detail) + '</div>' : '') +
        '</div></li>';
    }).join("");
    var remain = (list || []).filter(function (t) { return !saved[t.id]; }).length;
    $("#todo-sub").textContent = remain ? remain + "개 남음 · 체크는 이 브라우저에만 저장돼요" : "모두 완료 · 이 브라우저에만 저장돼요";
  }

  /* ---------- 이벤트 ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (btn) { copy(btn.getAttribute("data-copy"), "제휴 링크를 복사했어요"); }
  });

  document.addEventListener("change", function (e) {
    var cb = e.target.closest(".todo input[type=checkbox]");
    if (!cb) return;
    var li = cb.closest(".todo");
    var id = li.getAttribute("data-id");
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem("kkulpicklog-todo") || "{}"); } catch (err) {}
    saved[id] = cb.checked;
    try { localStorage.setItem("kkulpicklog-todo", JSON.stringify(saved)); } catch (err) {}
    li.classList.toggle("done", cb.checked);
    var items = document.querySelectorAll("#todo-list .todo");
    var left = 0;
    Array.prototype.forEach.call(items, function (x) {
      var c = x.querySelector("input");
      if (c && !c.checked) left++;
    });
    $("#todo-sub").textContent = left ? left + " 남음 · 체크는 이 브라우저에만 저장돼요" : "모두 완료 · 이 브라우저에만 저장돼요";
  });

  /* ---------- 로드 ---------- */
  function loadData() {
    if (window.__DATA__) return Promise.resolve(window.__DATA__);
    return fetch("data.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  loadData()
    .then(function (d) {
      renderHead(d);
      renderKpis(d.kpis);
      renderGoal(d.coupang);
      renderMix(d.content_mix);
      renderCommission(d.affiliates, 6);
      renderPlatforms(d.platform_status);
      renderContents(d.contents);
      renderAffiliates(d.affiliates);
      renderChannels(d.channels);
      renderChecklist(d.checklist);
    })
    .catch(function (err) {
      $("#kpi-grid").innerHTML =
        '<div class="card" style="padding:16px;grid-column:1/-1">데이터를 불러오지 못했어요. ' +
        '(data.json 확인 필요) <br><small style="color:var(--text-3)">' + esc(err.message) + '</small></div>';
      $("#updated").textContent = "불러오기 실패";
    });
})();
