function renderStationLayer(stationType, stations) {
  const mapImage = document.getElementById("map-image");
  const stationLayer = document.getElementById("station-layer");
  const mapViewport = document.getElementById("map-viewport");

  if (!mapImage || !stationLayer || !mapViewport) {
    console.error("地图图片或站点图层不存在");
    return;
  }

  stationLayer.innerHTML = "";

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

  const imageWidth = Number(mapImage.getAttribute("width")) || mapImage.naturalWidth || mapImage.clientWidth;
  const imageHeight = Number(mapImage.getAttribute("height")) || mapImage.naturalHeight || mapImage.clientHeight;

  let renderedCount = 0;

  stationList.forEach((station) => {
    if (
      station.longitude === null ||
      station.longitude === undefined ||
      station.latitude === null ||
      station.latitude === undefined
    ) {
      return;
    }

    const pixel = geoToPixel(
      Number(station.longitude),
      Number(station.latitude),
      geoReference
    );

    if (!pixel || Number.isNaN(pixel.x) || Number.isNaN(pixel.y)) {
      return;
    }

    const point = document.createElement("button");
    point.className = "station-point";
    point.type = "button";
    point.style.left = `${pixel.x}px`;
    point.style.top = `${pixel.y}px`;
    const stationName = station.station_name || station.name || "未命名站点";
    point.setAttribute("aria-label", stationName);

    point.addEventListener("pointerenter", (event) => {
      showStationTooltip(event, stationName);
    });

    point.addEventListener("pointermove", (event) => {
      positionStationTooltip(event.clientX, event.clientY);
    });

    point.addEventListener("pointerleave", hideStationTooltip);

    point.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideStationTooltip();

      try {
        const stationId = station.station_id || station.id;

        if (typeof loadStationCard !== "function") {
          console.error("loadStationCard 未定义");
          return;
        }

        await loadStationCard(stationId, stationType);
      } catch (error) {
        console.error("加载站点详情失败:", error);
      }
    });

    stationLayer.appendChild(point);
    renderedCount += 1;
  });

  stationLayer.style.width = `${imageWidth}px`;
  stationLayer.style.height = `${imageHeight}px`;

  console.log(`[地图] ${stationType} 已渲染站点数:`, renderedCount);
}
