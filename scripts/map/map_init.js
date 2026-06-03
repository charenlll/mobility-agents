function getMapLoadingOverlay() {
  const mapViewport = document.getElementById("map-viewport");
  if (!mapViewport) return null;

  let overlay = document.getElementById("map-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "map-loading-overlay";
    overlay.className = "map-loading-overlay";
    overlay.innerHTML = `
      <div class="map-loading-card">
        <div class="map-loading-spinner"></div>
        <div class="map-loading-title">地图加载中</div>
        <div id="map-loading-text" class="map-loading-text">正在准备地图资源</div>
      </div>
    `;
    mapViewport.appendChild(overlay);
  }

  return overlay;
}

function setMapLoading(message) {
  const overlay = getMapLoadingOverlay();
  if (!overlay) return;

  const text = document.getElementById("map-loading-text");
  if (text) text.textContent = message || "正在准备地图资源";
  overlay.hidden = false;
}

function hideMapLoading() {
  const overlay = document.getElementById("map-loading-overlay");
  if (!overlay) return;

  overlay.classList.add("is-hiding");
  window.setTimeout(() => {
    overlay.hidden = true;
    overlay.classList.remove("is-hiding");
  }, 180);
}

async function initMap(stationType) {
  const mapImage = document.getElementById("map-image");

  if (!mapImage) {
    console.error("Map image element is missing.");
    return;
  }

  setMapLoading("正在加载地图图片");

  const loadStationsAndRender = async () => {
    if (typeof mapImage.decode === "function") {
      try {
        await mapImage.decode();
      } catch (error) {
        console.warn("[Map] Image decode did not complete, continuing.", error);
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
      setMapLoading("正在获取站点数据");
      console.log(`[Map] Loading ${stationType} stations.`);
      const stations = await fetchAllStations(stationType);
      console.log(`[Map] ${stationType} station count:`, Array.isArray(stations) ? stations.length : 0);

      setMapLoading("正在渲染站点");
      await renderStationLayer(stationType, stations, {
        onProgress(rendered, total) {
          setMapLoading(`正在渲染站点 ${rendered}/${total}`);
        }
      });

      hideMapLoading();
    } catch (error) {
      console.error("[Map] Initialization failed.", error);
      setMapLoading("地图加载失败，请刷新页面重试");
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
    console.error("Map image failed to load:", mapImage.src);
    setMapLoading("地图图片加载失败，请刷新页面重试");
  }, { once: true });
}
