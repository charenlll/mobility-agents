function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return value;
}

function renderStationCard(stationData, agentData) {
  const chartHtml = renderChartSection(stationData);
  const suggestionHtml = renderSuggestionSection(agentData);

  return `
    <div class="station-detail">
      <p class="station-detail-eyebrow">STATION INSIGHT</p>
      <h2>${formatValue(stationData.station_name)}</h2>

      <p><strong>站点类型：</strong>${formatValue(stationData.station_type)}</p>
      <p><strong>总客流：</strong>${formatValue(stationData.total_flow)}</p>

      <hr />

      ${chartHtml}

      <hr />

      ${suggestionHtml}
    </div>
  `;
}
