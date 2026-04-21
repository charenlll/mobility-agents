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
