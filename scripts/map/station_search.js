const STATION_SEARCH_PINYIN_URL = "https://cdn.jsdelivr.net/npm/pinyin-pro@3.28.1/+esm";

const stationSearchState = {
  stationType: null,
  stations: [],
  pinyin: null,
  match: null,
  activeElement: null,
  initialized: false
};

function normalizeStationSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\u00b7.\-_()/\uff08\uff09]/g, "");
}

function getStationSearchName(station) {
  return station.stationName || station.station_name || station.name || "";
}

function buildStationSearchKeywords(item) {
  const name = getStationSearchName(item);
  const keywords = new Set([
    normalizeStationSearchText(name),
    normalizeStationSearchText(name.slice(0, 1)),
    normalizeStationSearchText(item.stationId),
    normalizeStationSearchText(item.station?.station_id)
  ]);

  if (stationSearchState.pinyin && name) {
    try {
      const fullPinyin = stationSearchState.pinyin(name, { toneType: "none" });
      const initials = stationSearchState.pinyin(name, { pattern: "first", toneType: "none" });

      keywords.add(normalizeStationSearchText(fullPinyin));
      keywords.add(normalizeStationSearchText(initials));
    } catch (error) {
      console.warn("[Station Search] pinyin conversion failed:", error);
    }
  }

  return Array.from(keywords).filter(Boolean);
}

function rebuildStationSearchKeywords() {
  stationSearchState.stations.forEach((item) => {
    item.keywords = buildStationSearchKeywords(item);
  });
}

async function loadStationSearchPinyin() {
  if (stationSearchState.pinyin) return stationSearchState.pinyin;

  try {
    const module = await import(STATION_SEARCH_PINYIN_URL);
    stationSearchState.pinyin = module.pinyin || module.default?.pinyin || window.pinyinPro?.pinyin || null;
    stationSearchState.match = module.match || module.default?.match || window.pinyinPro?.match || null;
    rebuildStationSearchKeywords();
  } catch (error) {
    console.warn("[Station Search] pinyin library unavailable:", error);
  }

  return stationSearchState.pinyin;
}

function resetStationSearchIndex(stationType) {
  stationSearchState.stationType = stationType;
  stationSearchState.stations = [];
  stationSearchState.activeElement = null;
}

function registerStationForSearch(entry) {
  const item = {
    ...entry,
    keywords: buildStationSearchKeywords(entry)
  };

  stationSearchState.stations.push(item);
}

function getStationSearchElements() {
  return {
    input: document.getElementById("station-search-input"),
    results: document.getElementById("station-search-results"),
    clearButton: document.getElementById("station-search-clear"),
    status: document.getElementById("station-search-status"),
    root: document.querySelector(".station-search")
  };
}

function setStationSearchStatus(message) {
  const { status } = getStationSearchElements();
  if (status) status.textContent = message;
}

function hideStationSearchResults() {
  const { results, root } = getStationSearchElements();
  if (results) {
    results.hidden = true;
    results.innerHTML = "";
  }
  if (root) root.setAttribute("aria-expanded", "false");
}

function getStationSearchMatches(query) {
  const normalizedQuery = normalizeStationSearchText(query);
  if (!normalizedQuery) return [];

  return stationSearchState.stations
    .map((item) => {
      const matchedKeyword = item.keywords.find((keyword) => keyword.includes(normalizedQuery));
      const name = getStationSearchName(item);
      const pinyinMatched = stationSearchState.match ? stationSearchState.match(name, normalizedQuery) : null;
      if (!matchedKeyword && !pinyinMatched) return null;

      const nameKey = normalizeStationSearchText(name);
      let score = 0;
      if (nameKey === normalizedQuery) score += 100;
      if (nameKey.startsWith(normalizedQuery)) score += 60;
      if (matchedKeyword?.startsWith(normalizedQuery)) score += 40;
      if (pinyinMatched) score += 35;
      score -= Math.max(0, (matchedKeyword?.length || nameKey.length) - normalizedQuery.length) * 0.01;

      return { item, score };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((match) => match.item);
}

function renderStationSearchResults(query) {
  const { results, root } = getStationSearchElements();
  if (!results) return;

  const matches = getStationSearchMatches(query);
  results.innerHTML = "";

  if (!normalizeStationSearchText(query)) {
    setStationSearchStatus("");
    hideStationSearchResults();
    return;
  }

  if (!matches.length) {
    results.hidden = false;
    results.innerHTML = '<div class="station-search-empty">未找到相关站点</div>';
    setStationSearchStatus("未找到相关站点");
    if (root) root.setAttribute("aria-expanded", "true");
    return;
  }

  matches.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "station-search-option";
    button.setAttribute("role", "option");

    const name = document.createElement("span");
    name.className = "station-search-option-name";
    name.textContent = getStationSearchName(item);

    const meta = document.createElement("span");
    meta.className = "station-search-option-meta";
    meta.textContent = item.stationType === STATION_TYPES.METRO ? "地铁站点" : "公交站点";

    button.appendChild(name);
    button.appendChild(meta);
    button.addEventListener("click", () => selectStationSearchResult(item));
    results.appendChild(button);
  });

  results.hidden = false;
  if (root) root.setAttribute("aria-expanded", "true");
  setStationSearchStatus(`找到 ${matches.length} 个相关站点`);
}

async function focusStationSearchResult(item, options = {}) {
  if (!item || !item.pixel) return;

  if (stationSearchState.activeElement) {
    stationSearchState.activeElement.classList.remove("is-focused");
  }

  stationSearchState.activeElement = item.element;
  item.element?.classList.add("is-focused");

  if (typeof focusMapOnPixel === "function") {
    focusMapOnPixel(item.pixel.x, item.pixel.y, options);
  }

  window.setTimeout(() => {
    item.element?.focus({ preventScroll: true });
  }, 180);

  if (options.openDetails !== false && typeof loadStationCard === "function") {
    await loadStationCard(item.stationId, item.stationType);
  }
}

function selectStationSearchResult(item) {
  const { input } = getStationSearchElements();
  if (input) input.value = getStationSearchName(item);

  hideStationSearchResults();
  focusStationSearchResult(item, { openDetails: true });
}

function initStationSearch(stationType) {
  const { input, results, clearButton } = getStationSearchElements();
  if (!input || !results) return;

  stationSearchState.stationType = stationType;
  rebuildStationSearchKeywords();
  loadStationSearchPinyin().then(() => {
    if (input.value) renderStationSearchResults(input.value);
  });

  if (stationSearchState.initialized) return;
  stationSearchState.initialized = true;

  input.addEventListener("input", () => {
    renderStationSearchResults(input.value);
  });

  input.addEventListener("focus", () => {
    renderStationSearchResults(input.value);
  });

  input.addEventListener("keydown", (event) => {
    const options = Array.from(results.querySelectorAll(".station-search-option"));
    if (event.key === "Escape") {
      hideStationSearchResults();
      input.blur();
    }
    if (event.key === "Enter" && options.length) {
      event.preventDefault();
      options[0].click();
    }
  });

  clearButton?.addEventListener("click", () => {
    input.value = "";
    hideStationSearchResults();
    input.focus();
    setStationSearchStatus("");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest?.(".station-search")) {
      hideStationSearchResults();
    }
  });
}
