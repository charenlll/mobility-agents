// ===== 地图缩放和拖拽控制 =====
let mapState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isInitialized: false
};

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ICON_VISIBILITY_SCALE = 0.8;

const pointerState = {
  pointers: new Map(),
  isMouseDragging: false,
  mouseStartX: 0,
  mouseStartY: 0,
  mouseStartOffsetX: 0,
  mouseStartOffsetY: 0,
  pinchStartDistance: 0,
  pinchStartScale: 1,
  pinchWorldX: 0,
  pinchWorldY: 0,
  isPinching: false
};

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

function zoomAtPoint(pointX, pointY, newScale) {
  const clampedScale = clampScale(newScale);

  const worldX = (pointX - mapState.offsetX) / mapState.scale;
  const worldY = (pointY - mapState.offsetY) / mapState.scale;

  mapState.offsetX = pointX - worldX * clampedScale;
  mapState.offsetY = pointY - worldY * clampedScale;
  mapState.scale = clampedScale;

  updateMapTransform();
}

function getDistance(pointA, pointB) {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  };
}

function getViewportPoint(viewport, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function resetPinchState() {
  pointerState.pinchStartDistance = 0;
  pointerState.pinchStartScale = mapState.scale;
  pointerState.pinchWorldX = 0;
  pointerState.pinchWorldY = 0;
  pointerState.isPinching = false;
}

function initPointerPinch(viewport) {
  const points = Array.from(pointerState.pointers.values());
  if (points.length !== 2) return;

  const p1 = points[0];
  const p2 = points[1];
  const center = getCenter(p1, p2);

  pointerState.pinchStartDistance = getDistance(p1, p2);
  pointerState.pinchStartScale = mapState.scale;
  pointerState.pinchWorldX = (center.x - mapState.offsetX) / mapState.scale;
  pointerState.pinchWorldY = (center.y - mapState.offsetY) / mapState.scale;
  pointerState.isPinching = true;
}

function updatePointerPinch() {
  const points = Array.from(pointerState.pointers.values());
  if (points.length !== 2 || !pointerState.isPinching || !pointerState.pinchStartDistance) {
    return;
  }

  const p1 = points[0];
  const p2 = points[1];

  const currentDistance = getDistance(p1, p2);
  const center = getCenter(p1, p2);

  const scaleRatio = currentDistance / pointerState.pinchStartDistance;
  const newScale = clampScale(pointerState.pinchStartScale * scaleRatio);

  mapState.scale = newScale;
  mapState.offsetX = center.x - pointerState.pinchWorldX * newScale;
  mapState.offsetY = center.y - pointerState.pinchWorldY * newScale;

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

    const point = getViewportPoint(viewport, e.clientX, e.clientY);
    const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = mapState.scale + scrollDelta;

    zoomAtPoint(point.x, point.y, newScale);
  }, { passive: false });

  // ===== 鼠标拖拽 =====
  viewport.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;

    pointerState.isMouseDragging = true;
    pointerState.mouseStartX = e.clientX;
    pointerState.mouseStartY = e.clientY;
    pointerState.mouseStartOffsetX = mapState.offsetX;
    pointerState.mouseStartOffsetY = mapState.offsetY;
    viewport.classList.add("dragging");

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!pointerState.isMouseDragging) return;

    const deltaX = e.clientX - pointerState.mouseStartX;
    const deltaY = e.clientY - pointerState.mouseStartY;

    mapState.offsetX = pointerState.mouseStartOffsetX + deltaX;
    mapState.offsetY = pointerState.mouseStartOffsetY + deltaY;

    updateMapTransform();
  });

  document.addEventListener("mouseup", () => {
    pointerState.isMouseDragging = false;
    viewport.classList.remove("dragging");
  });

  // ===== Pointer Events：手机/平板触摸支持 =====
  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;

    viewport.setPointerCapture(e.pointerId);

    const point = getViewportPoint(viewport, e.clientX, e.clientY);
    pointerState.pointers.set(e.pointerId, point);

    if (pointerState.pointers.size === 1) {
      pointerState.mouseStartX = e.clientX;
      pointerState.mouseStartY = e.clientY;
      pointerState.mouseStartOffsetX = mapState.offsetX;
      pointerState.mouseStartOffsetY = mapState.offsetY;
    } else if (pointerState.pointers.size === 2) {
      initPointerPinch(viewport);
    }

    e.preventDefault();
  });

  viewport.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") return;
    if (!pointerState.pointers.has(e.pointerId)) return;

    const point = getViewportPoint(viewport, e.clientX, e.clientY);
    pointerState.pointers.set(e.pointerId, point);

    if (pointerState.pointers.size === 1 && !pointerState.isPinching) {
      const deltaX = e.clientX - pointerState.mouseStartX;
      const deltaY = e.clientY - pointerState.mouseStartY;

      mapState.offsetX = pointerState.mouseStartOffsetX + deltaX;
      mapState.offsetY = pointerState.mouseStartOffsetY + deltaY;

      updateMapTransform();
    } else if (pointerState.pointers.size === 2) {
      updatePointerPinch();
    }

    e.preventDefault();
  });

  function handlePointerEnd(e) {
    if (e.pointerType !== "mouse") {
      pointerState.pointers.delete(e.pointerId);

      if (pointerState.pointers.size < 2) {
        resetPinchState();
      }

      if (pointerState.pointers.size === 1) {
        const remainingPoint = Array.from(pointerState.pointers.values())[0];
        pointerState.mouseStartX = remainingPoint.x;
        pointerState.mouseStartY = remainingPoint.y;
        pointerState.mouseStartOffsetX = mapState.offsetX;
        pointerState.mouseStartOffsetY = mapState.offsetY;
      }
    }

    if (viewport.hasPointerCapture && viewport.hasPointerCapture(e.pointerId)) {
      viewport.releasePointerCapture(e.pointerId);
    }
  }

  viewport.addEventListener("pointerup", handlePointerEnd);
  viewport.addEventListener("pointercancel", handlePointerEnd);

  // ===== 窗口变化时重新适配 =====
  window.addEventListener("resize", () => {
    fitMapToViewport();
  });
}
