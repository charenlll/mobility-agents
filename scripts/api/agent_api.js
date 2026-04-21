async function fetchStationSuggestion(stationId, stationType) {
  const response = await fetch("http://127.0.0.1:8000/agent/suggest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      station_id: stationId,
      station_type: stationType
    })
  });

  if (!response.ok) {
    throw new Error("获取智能建议失败");
  }

  return await response.json();
}

