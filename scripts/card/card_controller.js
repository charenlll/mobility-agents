function isMobileView() {
  return window.innerWidth <= 768;
}

function openStationCard() {
  const panel = document.getElementById("station-card-panel");
  if (panel) {
    panel.style.display = "block";
  }
}

function closeStationCard() {
  const panel = document.getElementById("station-card-panel");
  if (panel) {
    panel.style.display = "none";
  }
}

function openMobileStationCard() {
  const overlay = document.getElementById("mobile-station-card-overlay");
  if (overlay) {
    overlay.style.display = "block";
  }
}

function closeMobileStationCard() {
  const overlay = document.getElementById("mobile-station-card-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}

function getStationCardContainer() {
  if (isMobileView()) {
    return document.getElementById("mobile-station-card-content");
  }
  return document.getElementById("station-card-content");
}

function openCurrentStationCard() {
  if (isMobileView()) {
    openMobileStationCard();
  } else {
    openStationCard();
  }
}

function closeCurrentStationCard() {
  if (isMobileView()) {
    closeMobileStationCard();
  } else {
    closeStationCard();
  }
}

async function loadStationCard(stationId, stationType) {
  const container = getStationCardContainer();

  if (!container) {
    console.error("未找到卡片容器");
    return;
  }

  container.innerHTML = `<p>加载中...</p>`;
  openCurrentStationCard();

  try {
    const stationData = await fetchStationDetail(stationId, stationType);
    console.log("stationData =", stationData);

    // 先渲染主体，建议区显示“加载中”
    container.innerHTML = renderStationCard(stationData, {
      summary: "智能建议生成中...",
      suggestions: ["系统正在分析当前站点，请稍候。"]
    });

    try {
      const agentData = await fetchStationSuggestion(stationId, stationType);
      console.log("agentData =", agentData);

      const suggestionContainer = document.getElementById("station-suggestion-section");
      if (suggestionContainer) {
        suggestionContainer.innerHTML = renderSuggestionSection(agentData);
      }
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
    console.error("加载站点卡片失败:", error);
    container.innerHTML = `<p>加载失败，请稍后重试</p>`;
  }
}

