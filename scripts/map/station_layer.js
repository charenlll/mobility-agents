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

  const imageWidth = mapImage.clientWidth || mapImage.naturalWidth;
  const imageHeight = mapImage.clientHeight || mapImage.naturalHeight;

  if (!imageWidth || !imageHeight) {
    console.error("地图尺寸无效，无法渲染站点");
    return;
  }

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
      geoReference,
      imageWidth,
      imageHeight
    );

    if (!pixel) {
      return;
    }

    const point = document.createElement("button");
    point.className = "station-point";
    point.style.left = `${pixel.x}px`;
    point.style.top = `${pixel.y}px`;
    point.title = station.station_name || station.name || "未命名站点";

    point.addEventListener("click", async () => {
      try {
        const stationId = station.station_id || station.id;
        const stationData = await fetchStationDetail(stationId, stationType);
        const agentData = await fetchStationSuggestion(stationId, stationType);
        showStationCard(stationData, agentData);
      } catch (error) {
        console.error("加载站点详情失败:", error);
      }
    });

    stationLayer.appendChild(point);
    renderedCount += 1;
  });

  console.log(`[地图] ${stationType} 已渲染站点数:`, renderedCount);
}

