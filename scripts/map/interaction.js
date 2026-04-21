// ===== 地图缩放和拖拽控制 =====
let mapState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartOffsetX: 0,
  dragStartOffsetY: 0,
  isInitialized: false,
  touchMode: null,
  touchStartDistance: 0,
  touchStartScale: 1,
  touchStartCenterX: 0,
  touchStartCenterY: 0,
  touchWorldX: 0,
  touchWorldY: 0
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ICON_VISIBILITY_SCALE = 0.8;

function updateStationIconVisibility() {
  const stationLayer = document.getElementById("station-layer");
  if (!stationLayer) return;

  if (mapState.scale < ICON_VISIBILITY_SCALE) {
    stationLayer.classList.add("zoom-hidden");
  } else {
    stationLayer.classList.remove("zoom-hidden");
  }
}

function updateMapTransform() {
  const container = document.getElementById("map-container");
  if (!container) return;

  container.style.transform = `translate(${mapState.offsetX}px, ${mapState.offsetY}px) scale(${mapState.scale})`;
  updateStationIconVisibility();
}

function fitMapToViewport() {
  const viewport = document.getElementById("map-viewport");
  const mapImage = document.getElementById("map-image");

  if (!viewport || !mapImage) return;
  if (!mapImage.naturalWidth || !mapImage.naturalHeight) return;

  const viewportWidth = viewport.clientWidth;
  const viewportHeight = viewport.clientHeight;
  const imageWidth = mapImage.naturalWidth;
  const imageHeight = mapImage.naturalHeight;

  if (!viewportWidth || !viewportHeight || !imageWidth || !imageHeight) return;

  const scaleX = viewportWidth / imageWidth;
  const scaleY = viewportHeight / imageHeight;
  const fitScale = Math.max(scaleX, scaleY);

  mapState.scale = fitScale;

  const scaledWidth = imageWidth * fitScale;
  const scaledHeight = imageHeight * fitScale;

  mapState.offsetX = (viewportWidth - scaledWidth) / 2;
  mapState.offsetY = (viewportHeight - scaledHeight) / 2;

  updateMapTransform();
}

function clampScale(scale) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
}

function getTouchDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(touch1, touch2, viewportRect) {
  return {
    x: ((touch1.clientX + touch2.clientX) / 2) - viewportRect.left,
    y: ((touch1.clientY + touch2.clientY) / 2) - viewportRect.top
  };
}

function zoomAtPoint(pointX, pointY, newScale) {
  const clampedScale = clampScale(newScale);

  const worldX = (pointX - mapState.offsetX) / mapState.scale;
  const worldY = (pointY - mapState.offsetY) / mapState.scale;

  mapState.offsetX = pointX - worldX * clampedScale;
  mapState.offsetY = pointY - worldY * clampedScale;
  mapState.scale = clampedScale;

  updateMapTransform();
}

function initMapInteraction() {
  const viewport = document.getElementById("map-viewport");

  if (!viewport) {
    console.error("地图容器不存在");
    return;
  }

  mapState.isInitialized = true;
  fitMapToViewport();
  console.log("[地图] 交互初始化完成");

  // ===== 桌面端滚轮缩放 =====
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = mapState.scale + scrollDelta;

    zoomAtPoint(mouseX, mouseY, newScale);
  }, { passive: false });

  // ===== 桌面端鼠标拖拽 =====
  viewport.addEventListener("mousedown", (e) => {
    mapState.isDragging = true;
    mapState.dragStartX = e.clientX;
    mapState.dragStartY = e.clientY;
    mapState.dragStartOffsetX = mapState.offsetX;
    mapState.dragStartOffsetY = mapState.offsetY;
    viewport.classList.add("dragging");
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!mapState.isDragging) return;

    const deltaX = e.clientX - mapState.dragStartX;
    const deltaY = e.clientY - mapState.dragStartY;

    mapState.offsetX = mapState.dragStartOffsetX + deltaX;
    mapState.offsetY = mapState.dragStartOffsetY + deltaY;

    updateMapTransform();
  });

  document.addEventListener("mouseup", () => {
    mapState.isDragging = false;
    viewport.classList.remove("dragging");
  });

  // ===== 手机端触摸拖拽 + 双指缩放 =====
  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      mapState.touchMode = "pan";
      mapState.dragStartX = touch.clientX;
      mapState.dragStartY = touch.clientY;
      mapState.dragStartOffsetX = mapState.offsetX;
      mapState.dragStartOffsetY = mapState.offsetY;
    } else if (e.touches.length === 2) {
      const rect = viewport.getBoundingClientRect();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const center = getTouchCenter(touch1, touch2, rect);

      mapState.touchMode = "pinch";
      mapState.touchStartDistance = getTouchDistance(touch1, touch2);
      mapState.touchStartScale = mapState.scale;
      mapState.touchStartCenterX = center.x;
      mapState.touchStartCenterY = center.y;
      mapState.touchWorldX = (center.x - mapState.offsetX) / mapState.scale;
      mapState.touchWorldY = (center.y - mapState.offsetY) / mapState.scale;
    }
  }, { passive: false });

  viewport.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && mapState.touchMode === "pan") {
      e.preventDefault();

      const touch = e.touches[0];
      const deltaX = touch.clientX - mapState.dragStartX;
      const deltaY = touch.clientY - mapState.dragStartY;

      mapState.offsetX = mapState.dragStartOffsetX + deltaX;
      mapState.offsetY = mapState.dragStartOffsetY + deltaY;

      updateMapTransform();
    } else if (e.touches.length === 2) {
      e.preventDefault();

      const rect = viewport.getBoundingClientRect();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = getTouchDistance(touch1, touch2);
      if (!mapState.touchStartDistance) return;

      const scaleRatio = currentDistance / mapState.touchStartDistance;
      const newScale = clampScale(mapState.touchStartScale * scaleRatio);

      const center = getTouchCenter(touch1, touch2, rect);

      mapState.scale = newScale;
      mapState.offsetX = center.x - mapState.touchWorldX * newScale;
      mapState.offsetY = center.y - mapState.touchWorldY * newScale;

      updateMapTransform();
    }
  }, { passive: false });

  viewport.addEventListener("touchend", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      mapState.touchMode = "pan";
      mapState.dragStartX = touch.clientX;
      mapState.dragStartY = touch.clientY;
      mapState.dragStartOffsetX = mapState.offsetX;
      mapState.dragStartOffsetY = mapState.offsetY;
    } else if (e.touches.length === 0) {
      mapState.touchMode = null;
      mapState.touchStartDistance = 0;
    }
  });

  viewport.addEventListener("touchcancel", () => {
    mapState.touchMode = null;
    mapState.touchStartDistance = 0;
  });

  window.addEventListener("resize", () => {
    fitMapToViewport();
  });
}

