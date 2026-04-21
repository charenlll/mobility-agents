async function fetchHomeWeatherRecommendation() {
  const url = `${API_BASE_URL}/home/weather-recommendation`;

  console.log("[API] 请求首页天气推荐 URL:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`获取首页天气推荐失败，状态码: ${response.status}`);
  }

  const result = await response.json();
  console.log("[API] 首页天气推荐返回结果:", result);

  const data = result.data ?? result;

  if (
    !data ||
    typeof data.city !== "string" ||
    typeof data.weather !== "string" ||
    typeof data.temperature === "undefined" ||
    !Array.isArray(data.recommendations)
  ) {
    throw new Error("首页天气推荐返回格式不正确");
  }

  return data;
}
