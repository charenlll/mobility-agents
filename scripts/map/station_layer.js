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

  const imageWidth = mapImage.clientWidth;
  const imageHeight = mapImage.clientHeight;

  let renderedCount = 0;

  stationList.forEach((station) => {
    if (
      station.longitude === null ||
      station.longitude === undefined ||
      station.latitude === null ||
      station.latitude === undefined
    ) {
      console.warn(`站点 ${station.station_name || station.station_id} 缺少经纬度，跳过渲染`, station);
      return;
    }

    const { x, y } = geoToPixel(
      station.longitude,
      station.latitude,
      geoReference
    );

    // 超出图片可视范围的点先不渲染
    if (x < 0 || x > imageWidth || y < 0 || y > imageHeight) {
      console.warn(`站点 ${station.station_name} 超出图片范围，不显示`, {
        station,
        pixel: { x, y },
        imageWidth,
        imageHeight
      });
      return;
    }

    const stationElement = document.createElement("button");
    const imgElement = document.createElement("img");
    
    if (stationType === "metro") {
      imgElement.src = "../assets/icons/metro_icon.png";
      imgElement.alt = "地铁站";
    } else {
      imgElement.src = "../assets/icons/bus_map.png";
      imgElement.alt = "公交站";
    }
    
    imgElement.style.width = "30px";
    imgElement.style.height = "30px";
    imgElement.style.display = "block";
    imgElement.style.objectFit = "contain";
    imgElement.style.imageRendering = "crisp-edges";
    imgElement.style.imageRendering = "-webkit-optimize-contrast";
    stationElement.appendChild(imgElement);
    
    stationElement.title = station.station_name || station.station_id || "未知站点";

    stationElement.style.position = "absolute";
    stationElement.style.left = `${x}px`;
    stationElement.style.top = `${y}px`;
    stationElement.style.transform = "translate(-50%, -50%)";
    stationElement.style.border = "none";
    stationElement.style.background = "transparent";
    stationElement.style.padding = "0";
    stationElement.style.cursor = "pointer";
    stationElement.style.zIndex = "10";
    stationElement.style.width = "40px";
    stationElement.style.height = "40px";

    bindStationClick(stationElement, station);
    stationLayer.appendChild(stationElement);
    renderedCount += 1;
  });

  console.log(`已渲染 ${stationType} 站点数量:`, renderedCount);

  // 更新 icon 可见性
  if (typeof updateStationIconVisibility === 'function') {
    updateStationIconVisibility();
  }
}
