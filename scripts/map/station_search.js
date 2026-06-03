const STATION_SEARCH_PINYIN_URL = "https://cdn.jsdelivr.net/npm/pinyin-pro@3.28.1/+esm";

const stationSearchState = {
  stationType: null,
  stations: [],
  pinyin: null,
  activeElement: null,
  initialized: false,
  pinyinIndexing: false
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

function getBasicStationSearchKeywords(item) {
  const name = getStationSearchName(item);
  return [
    normalizeStationSearchText(name),
    normalizeStationSearchText(name.slice(0, 1)),
    normalizeStationSearchText(item.stationId),
    normalizeStationSearchText(item.station?.station_id)
  ].filter(Boolean);
}

function appendStationPinyinKeywords(item) {
  const name = getStationSearchName(item);
  if (!stationSearchState.pinyin || !name || item.hasPinyinKeywords) return;

  try {
    const pinyinList = stationSearchState.pinyin(name, { toneType: "none", type: "array" });
    const fullPinyin = Array.isArray(pinyinList) ? pinyinList.join("") : pinyinList;
    const initials = Array.isArray(pinyinList)
      ? pinyinList.map((part) => part.slice(0, 1)).join("")
      : "";

    item.keywords.push(normalizeStationSearchText(fullPinyin));
    item.keywords.push(normalizeStationSearchText(initials));
    item.keywords = Array.from(new Set(item.keywords.filter(Boolean)));
    item.hasPinyinKeywords = true;
  } catch (error) {
    console.warn("[Station Search] Failed to build pinyin keywords.", error);
  }
}

function waitForSearchIndexIdle() {
  return new Promise((resolve) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(resolve, { timeout: 120 });
      return;
    }
    window.setTimeout(resolve, 16);
  });
}

async function buildPinyinSearchIndexInChunks() {
  if (!stationSearchState.pinyin || stationSearchState.pinyinIndexing) return;

  stationSearchState.pinyinIndexing = true;
  const batchSize = 120;

  for (let index = 0; index < stationSearchState.stations.length; index += batchSize) {
    const batch = stationSearchState.stations.slice(index, index + batchSize);
    batch.forEach(appendStationPinyinKeywords);
    await waitForSearchIndexIdle();
  }

  stationSearchState.pinyinIndexing = false;
}

async function loadStationSearchPinyin() {
  if (stationSearchState.pinyin) return stationSearchState.pinyin;

  try {
    const module = await import(STATION_SEARCH_PINYIN_URL);
    stationSearchState.pinyin = module.pinyin || module.default?.pinyin || window.pinyinPro?.pinyin || null;
    buildPinyinSearchIndexInChunks();
  } catch (error) {
    console.warn("[Station Search] Pinyin library unavailable.", error);
  }

  return stationSearchState.pinyin;
}

function resetStationSearchIndex(stationType) {
  stationSearchState.stationType = stationType;
  stationSearchState.stations = [];
  stationSearchState.activeElement = null;
  stationSearchState.pinyinIndexing = false;
}

function registerStationForSearch(entry) {
  const item = {
    ...entry,
    keywords: getBasicStationSearchKeywords(entry),
    hasPinyinKeywords: false
  };

  if (stationSearchState.pinyin) {
    appendStationPinyinKeywords(item);
  }

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
      if (!matchedKeyword) return null;

      const nameKey = normalizeStationSearchText(getStationSearchName(item));
      let score = 0;
      if (nameKey === normalizedQuery) score += 100;
      if (nameKey.startsWith(normalizedQuery)) score += 60;
      if (matchedKeyword.startsWith(normalizedQuery)) score += 40;
      score -= Math.max(0, matchedKeyword.length - normalizedQuery.length) * 0.01;

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
    results.innerHTML = '<div class="station-search-empty">No matching station</div>';
    setStationSearchStatus("No matching station");
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
    meta.textContent = item.stationType === STATION_TYPES.METRO ? "Metro station" : "Bus station";

    button.appendChild(name);
    button.appendChild(meta);
    button.addEventListener("click", () => selectStationSearchResult(item));
    results.appendChild(button);
  });

  results.hidden = false;
  if (root) root.setAttribute("aria-expanded", "true");
  setStationSearchStatus(`${matches.length} matching stations`);
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
  loadStationSearchPinyin().then(() => {
    if (input.value) renderStationSearchResults(input.value);
  });

  if (stationSearchState.initialized) return;
  stationSearchState.initialized = true;

  let searchTimer = null;
  input.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      renderStationSearchResults(input.value);
    }, 120);
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
