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
const ICON_VISIBILITY_SCALE = 0.8; // 80% 缩放时显示 icon

function updateStationIconVisibility() {
  const stationLayer = document.getElementById("station-layer");
  if (!stationLayer) return;
  
  // 根据缩放比例控制 icon 显示
  if (mapState.scale < ICON_VISIBILITY_SCALE) {
    stationLayer.classList.add("zoom-hidden");
  } else {
    stationLayer.classList.remove("zoom-hidden");
  }
}

function initMapInteraction() {
  const viewport = document.getElementById("map-viewport");
  const container = document.getElementById("map-container");
  const stationLayer = document.getElementById("station-layer");

  if (!viewport || !container) {
    console.error("地图容器不存在");
    return;
  }

  // 初始化状态
  mapState.isInitialized = true;
  updateStationIconVisibility();
  console.log("[地图] 交互初始化完成");

  // 鼠标滚轮缩放
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scrollDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, mapState.scale + scrollDelta));
    
    // 计算缩放中心
    const scaleDiff = newScale - mapState.scale;
    mapState.offsetX -= mouseX * scaleDiff / mapState.scale;
    mapState.offsetY -= mouseY * scaleDiff / mapState.scale;
    mapState.scale = newScale;
    
    updateMapTransform();
  }, { passive: false });

  // 拖拽平移（鼠标）
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
    
    // 计算新的偏移并进行边界限制
    let newOffsetX = mapState.dragStartOffsetX + deltaX;
    let newOffsetY = mapState.dragStartOffsetY + deltaY;
    
    // 根据缩放比例计算可用的拖拽范围
    const mapImage = document.getElementById("map-image");
    if (mapImage) {
      const viewportRect = viewport.getBoundingClientRect();
      const maxOffsetX = 0;
      const minOffsetX = viewportRect.width - (mapImage.offsetWidth * mapState.scale);
      const maxOffsetY = 0;
      const minOffsetY = viewportRect.height - (mapImage.offsetHeight * mapState.scale);
      
      newOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
      newOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));
    }
    
    mapState.offsetX = newOffsetX;
    mapState.offsetY = newOffsetY;
    
    updateMapTransform();
  });

  document.addEventListener("mouseup", () => {
    mapState.isDragging = false;
    viewport.classList.remove("dragging");
  });

  // 触摸缩放（两指）- 手机端
  let touchStartDistance = 0;
  let touchStartScale = 1;

  viewport.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      // 两指缩放模式
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistance = Math.sqrt(dx * dx + dy * dy);
      touchStartScale = mapState.scale;
      mapState.isDragging = false; // 禁用拖拽
    } else if (e.touches.length === 1) {
      // 单指拖拽模式
      mapState.isDragging = true;
      mapState.dragStartX = e.touches[0].clientX;
      mapState.dragStartY = e.touches[0].clientY;
      mapState.dragStartOffsetX = mapState.offsetX;
      mapState.dragStartOffsetY = mapState.offsetY;
    }
  }, { passive: true });

  viewport.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      // 两指缩放
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scaleFactor = distance / (touchStartDistance || 1);
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchStartScale * scaleFactor));
      
      mapState.scale = newScale;
      updateMapTransform();
    } else if (e.touches.length === 1 && mapState.isDragging) {
      // 单指拖拽
      e.preventDefault();
      const deltaX = e.touches[0].clientX - mapState.dragStartX;
      const deltaY = e.touches[0].clientY - mapState.dragStartY;
      
      // 计算新的偏移并进行边界限制
      let newOffsetX = mapState.dragStartOffsetX + deltaX;
      let newOffsetY = mapState.dragStartOffsetY + deltaY;
      
      // 根据缩放比例计算可用的拖拽范围
      const mapImage = document.getElementById("map-image");
      if (mapImage) {
        const viewportRect = viewport.getBoundingClientRect();
        const maxOffsetX = 0;
        const minOffsetX = viewportRect.width - (mapImage.offsetWidth * mapState.scale);
        const maxOffsetY = 0;
        const minOffsetY = viewportRect.height - (mapImage.offsetHeight * mapState.scale);
        
        newOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
        newOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));
      }
      
      mapState.offsetX = newOffsetX;
      mapState.offsetY = newOffsetY;
      
      updateMapTransform();
    }
  }, { passive: false });

  viewport.addEventListener("touchend", () => {
    mapState.isDragging = false;
    touchStartDistance = 0;
  }, { passive: true });
}

function updateMapTransform() {
  const container = document.getElementById("map-container");
  if (!container) return;
  
  container.style.transform = `translate(${mapState.offsetX}px, ${mapState.offsetY}px) scale(${mapState.scale})`;
  
  // 根据缩放比例显示/隐藏 icon
  updateStationIconVisibility();
}

// ===== 站点点击事件 =====
function bindStationClick(stationElement, station) {
  stationElement.addEventListener("click", async () => {
    try {
      console.log("点击站点:", station);

      const stationDetail = await fetchStationDetail(
        station.station_id,
        station.station_type
      );

      console.log("后端返回站点详情:", stationDetail);

      if (!stationDetail) {
        console.error("站点详情为空");
        return;
      }

      const panel = document.getElementById("station-card-panel");
      const container = document.getElementById("station-card-container");

      if (!panel || !container) {
        console.error("未找到卡片面板或容器");
        return;
      }

      // 先显示基础卡片 + 占位建议
      panel.style.display = "block";
      container.innerHTML = renderStationCard(stationDetail, {
        summary: "智能建议生成中...",
        suggestions: ["系统正在分析当前站点，请稍候。"]
      });

      console.log("基础卡片已显示，准备请求智能建议");

      // 再异步请求 Agent 建议
      try {
        const agentData = await fetchStationSuggestion(
          station.station_id,
          station.station_type
        );

        console.log("后端返回智能建议:", agentData);

        const suggestionContainer = document.getElementById("station-suggestion-section");
        console.log("suggestionContainer =", suggestionContainer);

        if (!suggestionContainer) {
          console.error("未找到建议区容器 #station-suggestion-section");
          return;
        }

        suggestionContainer.innerHTML = renderSuggestionSection(agentData);
        console.log("智能建议已更新");
      } catch (agentError) {
        console.error("获取智能建议失败:", agentError);

        const suggestionContainer = document.getElementById("station-suggestion-section");
        if (suggestionContainer) {
          suggestionContainer.innerHTML = renderSuggestionSection({
            summary: "智能建议暂时不可用",
            suggestions: ["建议服务暂时异常，但基础信息已正常加载。"]
          });
        }
      }

    } catch (error) {
      console.error("获取站点详情失败:", error);
    }
  });
}
