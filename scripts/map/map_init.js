async function initMap(stationType) {
  const mapImage = document.getElementById("map-image");

  if (!mapImage) {
    console.error("地图图片元素不存在");
    return;
  }

  const loadStationsAndRender = async () => {
    try {
      console.log(`[地图] 开始加载 ${stationType} 站点数据`);
      const stations = await fetchAllStations(stationType);
      console.log(`[地图] ${stationType} 站点数量:`, Array.isArray(stations) ? stations.length : 0);

      renderStationLayer(stationType, stations);

      if (typeof initMapInteraction === "function") {
        initMapInteraction();
      }
    } catch (error) {
      console.error(`[地图] 初始化失败:`, error);
    }
  };

  if (mapImage.complete) {
    await loadStationsAndRender();
    return;
  }

  mapImage.addEventListener("load", async () => {
    await loadStationsAndRender();
  }, { once: true });

  mapImage.addEventListener("error", () => {
    console.error("地图图片加载失败:", mapImage.src);
  }, { once: true });
}
