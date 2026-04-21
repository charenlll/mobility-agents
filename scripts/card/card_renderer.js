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
    <div style="padding: 16px;">
      <h2 style="margin-bottom: 12px;">${formatValue(stationData.station_name)}</h2>

      <p><strong>站点类型：</strong>${formatValue(stationData.station_type)}</p>
      <p><strong>总客流：</strong>${formatValue(stationData.total_flow)}</p>

      <hr style="margin: 16px 0;" />

      ${chartHtml}

      <hr style="margin: 16px 0;" />

      ${suggestionHtml}
    </div>
  `;
}
