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
  isInitialized: false
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

function initMapInteraction() {
  const viewport = document.getElementById("map-viewport");

  if (!viewport) {
    console.error("地图容器不存在");
    return;
  }

  mapState.isInitialized = true;
  fitMapToViewport();
  console.log("[地图] 交互初始化完成");

  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();

    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, mapState.scale + scrollDelta));

    const worldX = (mouseX - mapState.offsetX) / mapState.scale;
    const worldY = (mouseY - mapState.offsetY) / mapState.scale;

    mapState.offsetX = mouseX - worldX * newScale;
    mapState.offsetY = mouseY - worldY * newScale;
    mapState.scale = newScale;

    updateMapTransform();
  }, { passive: false });

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

  window.addEventListener("resize", () => {
    fitMapToViewport();
  });
}
