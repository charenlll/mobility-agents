function renderStationLayer(stationType, stations) {
  const mapImage = document.getElementById("map-image");
  const stationLayer = document.getElementById("station-layer");

  if (!mapImage || !stationLayer) {
    console.error("地图图片或站点图层不存在");
    return;
  }

  stationLayer.innerHTML = "";

  const geoReference = GEO_REFERENCE[stationType];

  if (!geoReference) {
    console.error(`未找到站点类型 ${stationType} 对应的地理参考配置`);
    return;
  }

  const stationList = Array.isArray(stations) ? stations : [];

  const imageWidth = mapImage.naturalWidth || mapImage.clientWidth;
  const imageHeight = mapImage.naturalHeight || mapImage.clientHeight;

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
    point.title = station.station_name || station.name || "未命名站点";

    point.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        const stationId = station.station_id || station.id;
        const stationData = await fetchStationById(stationId, stationType);
        const agentData = await fetchStationSuggestion(stationId, stationType);

        if (typeof renderStationCard === "function") {
          renderStationCard(stationData, agentData);
        } else {
          console.error("renderStationCard 未定义");
          return;
        }

        if (typeof openStationCard === "function") {
          openStationCard();
        }
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
