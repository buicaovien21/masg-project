const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");
const themeToggle = document.getElementById("themeToggle");
const siteHeader = document.getElementById("siteHeader");
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
const mobileLinks = document.querySelectorAll('.mobile-nav a[href^="#"]');

const rootElement = document.documentElement;
const savedTheme = localStorage.getItem("masg-theme");
if (savedTheme === "dark") {
  rootElement.setAttribute("data-theme", "dark");
}

const syncThemeButton = () => {
  if (!themeToggle) return;
  const isDark = rootElement.getAttribute("data-theme") === "dark";
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
};

syncThemeButton();

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  });
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = rootElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      rootElement.removeAttribute("data-theme");
      localStorage.setItem("masg-theme", "light");
    } else {
      rootElement.setAttribute("data-theme", "dark");
      localStorage.setItem("masg-theme", "dark");
    }
    syncThemeButton();
  });
}

// Active section highlighting
const sections = Array.from(document.querySelectorAll("main section[id]"));
if (sections.length && navLinks.length) {
  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        setActiveLink(visible[0].target.id);
      }
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0.2, 0.5, 0.8] }
  );

  sections.forEach((section) => observer.observe(section));
}

// Scroll-based header shadow
if (siteHeader) {
  const onScroll = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Reveal-on-scroll
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

// Animated counters
const counters = document.querySelectorAll("[data-count]");
if (counters.length) {
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => counterObserver.observe(el));
}

// Button ripple position
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("pointerdown", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty("--ripple-x", `${x}%`);
    btn.style.setProperty("--ripple-y", `${y}%`);
  });
});

// ---------- Filter chips for Focus Areas ----------
const chips = document.querySelectorAll(".filter-bar .chip");
const focusCards = document.querySelectorAll("#focusGrid .focus-card");
const filterCount = document.getElementById("filterCount");
const emptyState = document.getElementById("emptyState");

const applyFilter = (filter) => {
  let visible = 0;
  focusCards.forEach((card) => {
    const matches = filter === "all" || card.dataset.category === filter;
    card.classList.toggle("hidden", !matches);
    if (matches) {
      card.classList.remove("filter-anim");
      void card.offsetWidth;
      card.classList.add("filter-anim");
      visible++;
    }
  });
  if (filterCount) {
    filterCount.textContent = `${visible} program${visible === 1 ? "" : "s"}`;
  }
  if (emptyState) emptyState.hidden = visible !== 0;
};

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    applyFilter(chip.dataset.filter);
  });
});

if (chips.length) applyFilter("all");

// ---------- Search panel ----------
const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const searchIndex = (() => {
  const items = [];
  document.querySelectorAll("main section[id]").forEach((section) => {
    const sectionId = section.id;
    const sectionTitle =
      section.querySelector(".section-head h2, h2")?.textContent.trim() || sectionId;
    section.querySelectorAll("article.card, .autumn-feature").forEach((card) => {
      const title =
        card.querySelector("h3, h2")?.textContent.trim() || sectionTitle;
      const description = card.querySelector("p:not(.card-kicker):not(.focus-icon)")?.textContent.trim() || "";
      items.push({
        title,
        description,
        section: sectionTitle,
        anchor: `#${sectionId}`,
        haystack: `${title} ${description} ${sectionTitle}`.toLowerCase(),
      });
    });
    if (!section.querySelector("article.card") && !section.querySelector(".autumn-feature")) {
      const description =
        section.querySelector(".section-lead, .lead, p")?.textContent.trim() || "";
      items.push({
        title: sectionTitle,
        description,
        section: sectionTitle,
        anchor: `#${sectionId}`,
        haystack: `${sectionTitle} ${description}`.toLowerCase(),
      });
    }
  });
  return items;
})();

const escapeHtml = (str) =>
  str.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const highlight = (text, query) => {
  if (!query) return escapeHtml(text);
  const safe = escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
};

const renderSearch = (query) => {
  if (!searchResults) return;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    searchResults.innerHTML = `<p class="search-empty">Start typing to search…</p>`;
    return;
  }
  const matches = searchIndex
    .filter((item) => item.haystack.includes(trimmed))
    .slice(0, 8);

  if (!matches.length) {
    searchResults.innerHTML = `<p class="search-empty">No results for "<strong>${escapeHtml(query)}</strong>"</p>`;
    return;
  }

  searchResults.innerHTML = matches
    .map(
      (m) => `
        <a class="search-result" href="${m.anchor}" role="option">
          <span class="search-result-section">${escapeHtml(m.section)}</span>
          <span class="search-result-title">${highlight(m.title, trimmed)}</span>
          ${m.description ? `<span>${highlight(m.description.slice(0, 110), trimmed)}${m.description.length > 110 ? "…" : ""}</span>` : ""}
        </a>
      `
    )
    .join("");
};

const openSearch = () => {
  if (!searchPanel || !searchToggle) return;
  searchPanel.hidden = false;
  searchToggle.setAttribute("aria-expanded", "true");
  setTimeout(() => searchInput?.focus(), 30);
  if (searchInput && !searchInput.value) renderSearch("");
};

const closeSearch = () => {
  if (!searchPanel || !searchToggle) return;
  searchPanel.hidden = true;
  searchToggle.setAttribute("aria-expanded", "false");
};

if (searchToggle) {
  searchToggle.addEventListener("click", () => {
    if (searchPanel?.hidden) openSearch();
    else closeSearch();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => renderSearch(e.target.value));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
  });
}

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    if (searchPanel?.hidden) openSearch();
    else closeSearch();
  }
});

document.addEventListener("click", (e) => {
  if (!searchPanel || searchPanel.hidden) return;
  if (e.target.closest(".search-result")) {
    closeSearch();
    return;
  }
  if (
    !searchPanel.contains(e.target) &&
    !searchToggle?.contains(e.target)
  ) {
    closeSearch();
  }
});

// ==========================================================================
// Impact Dashboard
// ==========================================================================
(function initImpactDashboard() {
  const data = window.MASG_IMPACT;
  const section = document.getElementById("impact");
  if (!data || !section) return;

  const yearButtons = section.querySelectorAll(".year-btn");
  const kpiValues = section.querySelectorAll("[data-kpi]");
  const trendChart = document.getElementById("trendChart");
  const trendTable = document.getElementById("trendTable");
  const donutChart = document.getElementById("donutChart");
  const donutLegend = document.getElementById("donutLegend");
  const donutValue = document.getElementById("donutValue");
  const updatedEl = document.getElementById("impactUpdated");
  if (updatedEl) updatedEl.textContent = data.updated;

  let activeYear = 2026;
  let hasAnimated = false;

  const animateNumber = (el, target, suffix = "", duration = 1200) => {
    const start = Number(el.dataset.current || 0);
    const diff = target - start;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + diff * eased);
      el.textContent = val.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.dataset.current = target;
    };
    requestAnimationFrame(step);
  };

  const renderKpis = (year) => {
    const yearData = data.years[year];
    if (!yearData) return;
    kpiValues.forEach((el) => {
      const key = el.dataset.kpi;
      const suffix = el.dataset.suffix || "";
      const target = yearData[key] || 0;
      animateNumber(el, target, suffix);
    });
  };

  const renderTrend = () => {
    if (!trendChart) return;
    const points = data.trend;
    const w = 520;
    const h = 220;
    const padL = 34;
    const padR = 16;
    const padT = 18;
    const padB = 28;
    const maxVal = Math.max(...points.map((p) => p.value));
    const minYear = points[0].year;
    const maxYear = points[points.length - 1].year;

    const xFor = (yr) =>
      padL + ((yr - minYear) / (maxYear - minYear)) * (w - padL - padR);
    const yFor = (v) => padT + (1 - v / maxVal) * (h - padT - padB);

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.year)} ${yFor(p.value)}`)
      .join(" ");

    const areaPath =
      `M ${xFor(minYear)} ${h - padB} ` +
      points.map((p) => `L ${xFor(p.year)} ${yFor(p.value)}`).join(" ") +
      ` L ${xFor(maxYear)} ${h - padB} Z`;

    const targetY = yFor(0);

    const gridLines = [0, 0.5, 1]
      .map((t) => {
        const y = padT + t * (h - padT - padB);
        return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.08" />`;
      })
      .join("");

    const dots = points
      .map(
        (p) => `
          <g>
            <circle class="trend-dot" cx="${xFor(p.year)}" cy="${yFor(p.value)}" r="5">
              <title>${p.year}: ${p.value} ktCO₂e</title>
            </circle>
            <text class="trend-dot-label" x="${xFor(p.year)}" y="${yFor(p.value) - 10}" text-anchor="middle">${p.value}</text>
          </g>`
      )
      .join("");

    const xLabels = points
      .map(
        (p) =>
          `<text class="axis-label" x="${xFor(p.year)}" y="${h - 8}" text-anchor="middle">${p.year}</text>`
      )
      .join("");

    trendChart.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.35" />
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${gridLines}
        <path class="trend-area" d="${areaPath}" />
        <path class="trend-line" d="${linePath}" />
        <line class="target-line" x1="${padL}" x2="${w - padR}" y1="${targetY}" y2="${targetY}" />
        <text class="axis-label" x="${w - padR}" y="${targetY - 4}" text-anchor="end">Net Zero 2030</text>
        ${dots}
        ${xLabels}
      </svg>
    `;

    if (trendTable) {
      trendTable.innerHTML =
        `<caption>Emissions (ktCO₂e) by year</caption>` +
        `<thead><tr><th>Year</th><th>ktCO₂e</th></tr></thead><tbody>` +
        points.map((p) => `<tr><td>${p.year}</td><td>${p.value}</td></tr>`).join("") +
        `</tbody>`;
    }
  };

  const renderDonut = (year) => {
    if (!donutChart) return;
    const segs = data.breakdown[year] || [];
    const total = segs.reduce((sum, s) => sum + s.value, 0);
    const radius = 64;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const existing = donutChart.querySelectorAll(".donut-seg");
    existing.forEach((el) => el.remove());

    segs.forEach((seg) => {
      const len = (seg.value / total) * circumference;
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "80");
      circle.setAttribute("cy", "80");
      circle.setAttribute("r", String(radius));
      circle.setAttribute("class", "donut-seg");
      circle.setAttribute("stroke", seg.color);
      circle.setAttribute("stroke-dasharray", `${len} ${circumference - len}`);
      circle.setAttribute("stroke-dashoffset", String(-offset));
      circle.style.setProperty("--seg-len", circumference);
      circle.style.setProperty("--seg-end", String(-offset));
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${seg.label}: ${seg.value} t (${Math.round((seg.value / total) * 100)}%)`;
      circle.appendChild(title);
      donutChart.appendChild(circle);
      offset += len;
    });

    if (donutValue) donutValue.textContent = total.toLocaleString();
    if (donutLegend) {
      donutLegend.innerHTML = segs
        .map(
          (s) => `
            <li>
              <span class="legend-swatch" style="background:${s.color}"></span>
              <span>${s.label}</span>
              <span class="legend-value">${s.value.toLocaleString()} t</span>
            </li>`
        )
        .join("");
    }
  };

  const renderAll = (year) => {
    activeYear = year;
    yearButtons.forEach((btn) => {
      const isActive = Number(btn.dataset.year) === year;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    renderKpis(year);
    renderDonut(year);
  };

  yearButtons.forEach((btn) => {
    btn.addEventListener("click", () => renderAll(Number(btn.dataset.year)));
  });

  renderTrend();

  const impactObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          renderAll(activeYear);
          obs.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );
  impactObserver.observe(section);
})();

// ==========================================================================
// Projects Map (Leaflet)
// ==========================================================================
(function initProjectsMap() {
  const mapEl = document.getElementById("masgMap");
  const detailEl = document.getElementById("mapDetail");
  const projects = window.MASG_PROJECTS;
  const mapChips = document.querySelectorAll(".map-controls .chip[data-map-filter]");
  const nearMeBtn = document.getElementById("nearMeBtn");

  if (!mapEl || !projects || typeof L === "undefined") return;

  const lightTiles = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const darkTiles =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  const map = L.map(mapEl, {
    center: [-37.066, 144.2],
    zoom: 11,
    scrollWheelZoom: false,
  });

  let tileLayer = L.tileLayer(
    document.documentElement.getAttribute("data-theme") === "dark" ? darkTiles : lightTiles,
    { attribution, maxZoom: 18 }
  ).addTo(map);

  const updateTiles = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const url = isDark ? darkTiles : lightTiles;
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(url, { attribution, maxZoom: 18 }).addTo(map);
  };

  // Re-theme when the user toggles dark mode
  const themeObs = new MutationObserver(() => updateTiles());
  themeObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const catEmoji = {
    waste: "♻️",
    energy: "☀️",
    efficiency: "🏠",
    agriculture: "🌱",
  };
  const catLabel = {
    waste: "Waste",
    energy: "Energy",
    efficiency: "Efficiency",
    agriculture: "Agriculture",
  };

  const makeIcon = (cat) =>
    L.divIcon({
      className: "",
      html: `<div class="map-pin pin-${cat}"><span>${catEmoji[cat] || "📍"}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 30],
      popupAnchor: [0, -28],
    });

  const showDetail = (p) => {
    detailEl.innerHTML = `
      <p class="card-kicker">${catEmoji[p.category] || ""} ${catLabel[p.category] || ""}</p>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="meta-row">
        <span><strong>📍</strong> ${p.address}, ${p.town}</span>
        <span><strong>🗓</strong> ${p.nextEvent}</span>
      </div>
      <a href="#get-involved" class="card-link">Get involved</a>
    `;
  };

  const markers = projects.map((p) => {
    const marker = L.marker([p.lat, p.lng], { icon: makeIcon(p.category) });
    marker.bindPopup(
      `<div class="popup-cat">${catEmoji[p.category]} ${catLabel[p.category]}</div>
       <div class="popup-title">${p.title}</div>
       <div>${p.town}</div>`
    );
    marker.on("click", () => showDetail(p));
    marker.project = p;
    return marker;
  });

  const layer = L.layerGroup(markers).addTo(map);

  const applyMapFilter = (filter) => {
    layer.clearLayers();
    markers.forEach((m) => {
      if (filter === "all" || m.project.category === filter) {
        layer.addLayer(m);
      }
    });
  };

  mapChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      mapChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      applyMapFilter(chip.dataset.mapFilter);
    });
  });

  if (nearMeBtn && "geolocation" in navigator) {
    nearMeBtn.addEventListener("click", () => {
      nearMeBtn.textContent = "Locating…";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 12);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            color: "#ec4899",
            fillColor: "#ec4899",
            fillOpacity: 0.5,
          })
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();
          nearMeBtn.textContent = "📍 Near me";
        },
        () => {
          nearMeBtn.textContent = "📍 Location blocked";
          setTimeout(() => (nearMeBtn.textContent = "📍 Near me"), 2000);
        }
      );
    });
  }

  // Fix tile rendering when the map section becomes visible
  const mapObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => map.invalidateSize(), 120);
        }
      });
    },
    { threshold: 0.05 }
  );
  mapObs.observe(mapEl);
})();

// ==========================================================================
// Youth Network — expandable lessons + XP progress
// ==========================================================================
(function initYouthTrack() {
  const section = document.getElementById("youth");
  if (!section) return;

  const toggles = section.querySelectorAll(".lesson-toggle");
  const completeButtons = section.querySelectorAll("[data-lesson-complete]");
  const fill = document.getElementById("youthXpFill");
  const label = document.getElementById("youthXpLabel");

  const STORAGE_KEY = "masg-youth-progress";
  const lessons = ["climate", "energy", "regen"];

  const load = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch (e) {
      return new Set();
    }
  };

  const save = (set) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  };

  const updateProgress = (completed) => {
    const pct = (completed.size / lessons.length) * 100;
    if (fill) fill.style.width = `${pct}%`;
    if (label) {
      label.textContent = `${completed.size} / ${lessons.length} lessons complete`;
    }
    lessons.forEach((id) => {
      const li = section.querySelector(`[data-lesson="${id}"]`)?.closest("li");
      if (li) li.classList.toggle("completed", completed.has(id));
    });
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const li = toggle.closest("li");
      const isOpen = li.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  const completed = load();
  updateProgress(completed);

  completeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.lessonComplete;
      if (completed.has(id)) {
        completed.delete(id);
        btn.textContent = "Mark complete";
      } else {
        completed.add(id);
        btn.textContent = "✓ Completed";
      }
      save(completed);
      updateProgress(completed);
    });
  });

  // Initialize button labels
  completeButtons.forEach((btn) => {
    if (completed.has(btn.dataset.lessonComplete)) {
      btn.textContent = "✓ Completed";
    }
  });
})();
