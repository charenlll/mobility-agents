async function fetchAllStations(stationType) {
  const url = `${API_BASE_URL}/stations?type=${encodeURIComponent(stationType)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`获取站点列表失败，状态码: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "获取站点列表失败");
  }

  return Array.isArray(result.data) ? result.data : [];
}

async function fetchStationDetail(stationId, stationType) {
  const url = `${API_BASE_URL}/station?station_id=${encodeURIComponent(stationId)}&type=${encodeURIComponent(stationType)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`请求失败，状态码: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "获取站点详情失败");
  }

  return result.data;
}

async function fetchStationSuggestion(stationId, stationType) {
  const url = `${API_BASE_URL}/agent/suggest`;

  console.log("[API] 获取智能建议 URL:", url);
  console.log("[API] 获取智能建议参数:", {
    station_id: stationId,
    station_type: stationType
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      station_id: stationId,
      station_type: stationType
    })
  });

  console.log("[API] 获取智能建议状态码:", response.status);

  if (!response.ok) {
    throw new Error(`获取智能建议失败，状态码: ${response.status}`);
  }

  const result = await response.json();
  console.log("[API] 智能建议返回结果:", result);

  if (!result || !result.summary || !Array.isArray(result.suggestions)) {
    throw new Error("智能建议返回格式不正确");
  }

  return result;
}

