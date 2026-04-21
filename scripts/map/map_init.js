async function initMap(stationType) {
  const mapImage = document.getElementById("map-image");

  if (!mapImage) {
    console.error("未找到地图图片元素 map-image");
    return;
  }

  let stations = [];

  try {
    stations = await fetchAllStations(stationType);
  } catch (error) {
    console.error("加载站点列表失败:", error);
    return;
  }

  const render = () => {
    renderStationLayer(stationType, stations);
  };

  if (mapImage.complete) {
    render();
  } else {
    mapImage.onload = () => {
      render();
    };
  }

  window.addEventListener("resize", () => {
    render();
  });
  
  // 初始化地图交互（缩放、拖拽）
  initMapInteraction();
}
