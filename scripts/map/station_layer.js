function waitForStationRenderFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

async function renderStationLayer(stationType, stations, options = {}) {
  const mapImage = document.getElementById("map-image");
  const stationLayer = document.getElementById("station-layer");
  const mapViewport = document.getElementById("map-viewport");

  if (!mapImage || !stationLayer || !mapViewport) {
    console.error("地图图片或站点图层不存在");
    return;
  }

  stationLayer.innerHTML = "";

  if (typeof resetStationSearchIndex === "function") {
    resetStationSearchIndex(stationType);
  }

  let stationTooltip = document.getElementById("station-tooltip");
  if (!stationTooltip) {
    stationTooltip = document.createElement("div");
    stationTooltip.id = "station-tooltip";
    stationTooltip.className = "station-tooltip";
    stationTooltip.hidden = true;
    stationTooltip.innerHTML = `
      <span class="station-tooltip-dot"></span>
      <span>
        <strong class="station-tooltip-name"></strong>
        <small class="station-tooltip-type"></small>
      </span>
    `;
    mapViewport.appendChild(stationTooltip);
  }
  stationTooltip.hidden = true;

  const tooltipName = stationTooltip.querySelector(".station-tooltip-name");
  const tooltipType = stationTooltip.querySelector(".station-tooltip-type");

  function positionStationTooltip(clientX, clientY) {
    const viewportRect = mapViewport.getBoundingClientRect();
    const tooltipWidth = stationTooltip.offsetWidth;
    const tooltipHeight = stationTooltip.offsetHeight;
    const gap = 14;

    const left = Math.min(
      clientX - viewportRect.left + gap,
      viewportRect.width - tooltipWidth - 10
    );
    const top = Math.min(
      clientY - viewportRect.top + gap,
      viewportRect.height - tooltipHeight - 10
    );

    stationTooltip.style.left = `${Math.max(10, left)}px`;
    stationTooltip.style.top = `${Math.max(10, top)}px`;
  }

  function showStationTooltip(event, stationName) {
    tooltipName.textContent = stationName;
    tooltipType.textContent = stationType === "metro" ? "地铁站点" : "公交站点";
    stationTooltip.hidden = false;
    positionStationTooltip(event.clientX, event.clientY);
  }

  function hideStationTooltip() {
    stationTooltip.hidden = true;
  }

  const geoReference = GEO_REFERENCE[stationType];

  if (!geoReference) {
    console.error(`未找到站点类型 ${stationType} 对应的地理参考配置`);
    return;
  }

  const stationList = Array.isArray(stations) ? stations : [];

  const imageWidth = geoReference.canvas_width;
  const imageHeight = geoReference.canvas_height;

  if (!imageWidth || !imageHeight) {
    console.error(`站点类型 ${stationType} 缺少地图参考画布尺寸`);
    return;
  }

  let renderedCount = 0;
  const batchSize = options.batchSize || 180;
  let fragment = document.createDocumentFragment();

  for (let index = 0; index < stationList.length; index += 1) {
    const station = stationList[index];
    if (
      station.longitude === null ||
      station.longitude === undefined ||
      station.latitude === null ||
      station.latitude === undefined
    ) {
      continue;
    }

    const pixel = geoToPixel(
      Number(station.longitude),
      Number(station.latitude),
      geoReference
    );

    if (!pixel || Number.isNaN(pixel.x) || Number.isNaN(pixel.y)) {
      continue;
    }

    const point = document.createElement("button");
    point.className = "station-point";
    point.type = "button";
    point.style.left = `${pixel.x}px`;
    point.style.top = `${pixel.y}px`;
    const stationName = station.station_name || station.name || "未命名站点";
    const stationId = station.station_id || station.id;
    let lastPointerOpenAt = 0;
    point.setAttribute("aria-label", stationName);

    async function openStationDetails() {
      hideStationTooltip();

      try {
        if (typeof loadStationCard !== "function") {
          console.error("loadStationCard 未定义");
          return;
        }

        await loadStationCard(stationId, stationType);
      } catch (error) {
        console.error("加载站点详情失败:", error);
      }
    }

    point.addEventListener("pointerenter", (event) => {
      showStationTooltip(event, stationName);
    });

    point.addEventListener("pointermove", (event) => {
      positionStationTooltip(event.clientX, event.clientY);
    });

    point.addEventListener("pointerleave", hideStationTooltip);

    point.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    point.addEventListener("pointerup", (event) => {
      event.stopPropagation();

      if (event.pointerType === "mouse" && event.button === 0) {
        lastPointerOpenAt = Date.now();
        openStationDetails();
      }
    });

    point.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (Date.now() - lastPointerOpenAt < 500) return;
      await openStationDetails();
    });

    fragment.appendChild(point);

    if (typeof registerStationForSearch === "function") {
      registerStationForSearch({
        station,
        stationId,
        stationName,
        stationType,
        pixel,
        element: point
      });
    }

    renderedCount += 1;

    if (renderedCount % batchSize === 0) {
      stationLayer.appendChild(fragment);
      fragment = document.createDocumentFragment();
      options.onProgress?.(renderedCount, stationList.length);
      await waitForStationRenderFrame();
    }
  }

  if (fragment.childNodes.length) {
    stationLayer.appendChild(fragment);
  }

  options.onProgress?.(renderedCount, stationList.length);

  stationLayer.style.width = `${imageWidth}px`;
  stationLayer.style.height = `${imageHeight}px`;

  console.log(`[地图] ${stationType} 已渲染站点数:`, renderedCount);

  if (typeof initStationSearch === "function") {
    initStationSearch(stationType);
  }
}
