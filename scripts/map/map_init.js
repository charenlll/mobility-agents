async function initMap(stationType) {
  const mapImage = document.getElementById("map-image");

  if (!mapImage) {
    console.error("地图图片元素不存在");
    return;
  }

  const loadStationsAndRender = async () => {
    if (typeof mapImage.decode === "function") {
      try {
        await mapImage.decode();
      } catch (error) {
        console.warn("[地图] 图片解码未完成，继续初始化", error);
      }
    }

    if (typeof initMapInteraction === "function") {
      initMapInteraction(stationType);
    }

    requestAnimationFrame(() => {
      if (typeof fitMapToViewport === "function") {
        fitMapToViewport();
      }
    });

    try {
      console.log(`[地图] 开始加载 ${stationType} 站点数据`);
      const stations = await fetchAllStations(stationType);
      console.log(`[地图] ${stationType} 站点数量:`, Array.isArray(stations) ? stations.length : 0);

      renderStationLayer(stationType, stations);
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
