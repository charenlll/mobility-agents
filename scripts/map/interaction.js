// ===== 地图缩放和拖拽控制 =====
let mapState = {
  scale: 1,
  fitScale: 1,
  offsetX: 0,
  offsetY: 0,
  isInitialized: false
};

const ABSOLUTE_MIN_SCALE = 0.04;
const MAX_SCALE = 5;
const ICON_VISIBILITY_RATIO = 0.96;

const pointerState = {
  pointers: new Map(),
  dragStartPoint: null,
  dragStartOffsetX: 0,
  dragStartOffsetY: 0,
  pinchStartDistance: 0,
  pinchStartScale: 1,
  pinchWorldX: 0,
  pinchWorldY: 0,
  isPinching: false
};

let transformFrame = null;
let resizeTimer = null;
let activeGeoReference = null;

function getViewport() {
  return document.getElementById("map-viewport");
}

function getMapImage() {
  return document.getElementById("map-image");
}

function getMapDimensions(mapImage = getMapImage()) {
  if (!mapImage && !activeGeoReference) return { width: 0, height: 0 };

  return {
    width: activeGeoReference?.canvas_width || Number(mapImage?.getAttribute("width")) || mapImage?.naturalWidth,
    height: activeGeoReference?.canvas_height || Number(mapImage?.getAttribute("height")) || mapImage?.naturalHeight
  };
}

function updateStationIconVisibility() {
  const stationLayer = document.getElementById("station-layer");
  if (!stationLayer) return;

  stationLayer.classList.toggle("zoom-hidden", mapState.scale < mapState.fitScale * ICON_VISIBILITY_RATIO);
}

function constrainOffsets() {
  const viewport = getViewport();
  const mapImage = getMapImage();
  const { width: imageWidth, height: imageHeight } = getMapDimensions(mapImage);
  if (!viewport || !imageWidth || !imageHeight) return;

  const scaledWidth = imageWidth * mapState.scale;
  const scaledHeight = imageHeight * mapState.scale;

  if (scaledWidth <= viewport.clientWidth) {
    mapState.offsetX = (viewport.clientWidth - scaledWidth) / 2;
  } else {
    mapState.offsetX = Math.min(0, Math.max(viewport.clientWidth - scaledWidth, mapState.offsetX));
  }

  if (scaledHeight <= viewport.clientHeight) {
    mapState.offsetY = (viewport.clientHeight - scaledHeight) / 2;
  } else {
    mapState.offsetY = Math.min(0, Math.max(viewport.clientHeight - scaledHeight, mapState.offsetY));
  }
}

function updateMapTransform() {
  if (transformFrame) return;

  transformFrame = requestAnimationFrame(() => {
    transformFrame = null;
    const container = document.getElementById("map-container");
    if (!container) return;

    constrainOffsets();
    container.style.transform = `translate3d(${mapState.offsetX}px, ${mapState.offsetY}px, 0) scale(${mapState.scale})`;
    updateStationIconVisibility();
  });
}

function fitMapToViewport() {
  const viewport = getViewport();
  const mapImage = getMapImage();
  const { width: imageWidth, height: imageHeight } = getMapDimensions(mapImage);
  if (!viewport || !imageWidth || !imageHeight) return;

  const scaleX = viewport.clientWidth / imageWidth;
  const scaleY = viewport.clientHeight / imageHeight;
  mapState.fitScale = Math.max(scaleX, scaleY);
  mapState.scale = mapState.fitScale;
  mapState.offsetX = (viewport.clientWidth - imageWidth * mapState.scale) / 2;
  mapState.offsetY = (viewport.clientHeight - imageHeight * mapState.scale) / 2;

  updateMapTransform();
}

function clampScale(scale) {
  const minScale = Math.max(ABSOLUTE_MIN_SCALE, mapState.fitScale * 0.9);
  return Math.max(minScale, Math.min(MAX_SCALE, scale));
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

function zoomMapBy(factor) {
  const viewport = getViewport();
  if (!viewport) return;

  zoomAtPoint(viewport.clientWidth / 2, viewport.clientHeight / 2, mapState.scale * factor);
}

function resetMapView() {
  fitMapToViewport();
}

function focusMapOnPixel(pixelX, pixelY, options = {}) {
  const viewport = getViewport();
  if (!viewport || !Number.isFinite(pixelX) || !Number.isFinite(pixelY)) return;

  const desiredScale = options.scale || Math.max(mapState.fitScale * 2.6, 0.42);
  mapState.scale = clampScale(desiredScale);
  mapState.offsetX = viewport.clientWidth / 2 - pixelX * mapState.scale;
  mapState.offsetY = viewport.clientHeight / 2 - pixelY * mapState.scale;

  updateMapTransform();
}

function getDistance(pointA, pointB) {
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

function getCenter(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2
  };
}

function getViewportPoint(viewport, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrag(point) {
  pointerState.dragStartPoint = point;
  pointerState.dragStartOffsetX = mapState.offsetX;
  pointerState.dragStartOffsetY = mapState.offsetY;
}

function resetPinchState() {
  pointerState.pinchStartDistance = 0;
  pointerState.pinchStartScale = mapState.scale;
  pointerState.isPinching = false;
}

function initPointerPinch() {
  const points = Array.from(pointerState.pointers.values());
  if (points.length !== 2) return;

  const center = getCenter(points[0], points[1]);
  pointerState.pinchStartDistance = getDistance(points[0], points[1]);
  pointerState.pinchStartScale = mapState.scale;
  pointerState.pinchWorldX = (center.x - mapState.offsetX) / mapState.scale;
  pointerState.pinchWorldY = (center.y - mapState.offsetY) / mapState.scale;
  pointerState.isPinching = true;
}

function updatePointerPinch() {
  const points = Array.from(pointerState.pointers.values());
  if (points.length !== 2 || !pointerState.isPinching || !pointerState.pinchStartDistance) return;

  const center = getCenter(points[0], points[1]);
  const scaleRatio = getDistance(points[0], points[1]) / pointerState.pinchStartDistance;
  mapState.scale = clampScale(pointerState.pinchStartScale * scaleRatio);
  mapState.offsetX = center.x - pointerState.pinchWorldX * mapState.scale;
  mapState.offsetY = center.y - pointerState.pinchWorldY * mapState.scale;
  updateMapTransform();
}

function initMapInteraction(stationType) {
  const viewport = getViewport();
  if (!viewport || mapState.isInitialized) return;

  activeGeoReference = GEO_REFERENCE[stationType] || null;
  mapState.isInitialized = true;
  fitMapToViewport();

  document.querySelectorAll(".map-controls button").forEach((button) => {
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
  });

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = getViewportPoint(viewport, event.clientX, event.clientY);
    zoomAtPoint(point.x, point.y, mapState.scale * Math.exp(-event.deltaY * 0.0015));
  }, { passive: false });

  viewport.addEventListener("dblclick", (event) => {
    const point = getViewportPoint(viewport, event.clientX, event.clientY);
    zoomAtPoint(point.x, point.y, mapState.scale * 1.45);
  });

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest?.(".station-point, .map-controls, .map-switcher")) return;

    viewport.setPointerCapture(event.pointerId);
    const point = getViewportPoint(viewport, event.clientX, event.clientY);
    pointerState.pointers.set(event.pointerId, point);
    viewport.classList.add("dragging");

    if (pointerState.pointers.size === 1) startDrag(point);
    if (pointerState.pointers.size === 2) initPointerPinch();
    event.preventDefault();
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointerState.pointers.has(event.pointerId)) return;

    const point = getViewportPoint(viewport, event.clientX, event.clientY);
    pointerState.pointers.set(event.pointerId, point);

    if (pointerState.pointers.size === 2) {
      updatePointerPinch();
    } else if (pointerState.pointers.size === 1 && !pointerState.isPinching && pointerState.dragStartPoint) {
      mapState.offsetX = pointerState.dragStartOffsetX + point.x - pointerState.dragStartPoint.x;
      mapState.offsetY = pointerState.dragStartOffsetY + point.y - pointerState.dragStartPoint.y;
      updateMapTransform();
    }
    event.preventDefault();
  });

  function handlePointerEnd(event) {
    pointerState.pointers.delete(event.pointerId);
    if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);

    if (pointerState.pointers.size < 2) resetPinchState();
    if (pointerState.pointers.size === 1) startDrag(Array.from(pointerState.pointers.values())[0]);
    if (pointerState.pointers.size === 0) {
      pointerState.dragStartPoint = null;
      viewport.classList.remove("dragging");
    }
  }

  viewport.addEventListener("pointerup", handlePointerEnd);
  viewport.addEventListener("pointercancel", handlePointerEnd);

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fitMapToViewport, 160);
  });
}
