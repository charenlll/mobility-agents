document.addEventListener("DOMContentLoaded", async () => {
  const weatherCard = document.getElementById("weather-card");
  const travelCard = document.getElementById("travel-card");

  function translateWeatherToChinese(weather) {
    if (!weather) return "未知";

    const weatherMap = {
      "Sunny": "晴",
      "Clear": "晴",
      "Partly cloudy": "多云",
      "Cloudy": "阴",
      "Overcast": "阴",
      "Light rain": "小雨",
      "Moderate rain": "中雨",
      "Heavy rain": "大雨",
      "Shower": "阵雨",
      "Thunderstorm": "雷阵雨",
      "Snow": "雪",
      "Light snow": "小雪",
      "Moderate snow": "中雪",
      "Heavy snow": "大雪",
      "Fog": "雾",
      "Mist": "薄雾",
      "Haze": "霾",
      "Windy": "有风"
    };

    return weatherMap[weather] || weather;
  }

  function cleanRecommendationText(text) {
    if (!text) return "";
    return text.replace(/^[·•\-\s]+/, "").trim();
  }

  try {
    const data = await fetchHomeWeatherRecommendation();

    const weatherText = translateWeatherToChinese(data.weather);
    const temperatureText = data.temperature ? `${data.temperature}℃` : "未知";

    weatherCard.innerHTML = `
      <h3>当前天气</h3>
      <p><strong>城市：</strong>${data.city || "武汉"}</p>
      <p><strong>天气：</strong>${weatherText}</p>
      <p><strong>温度：</strong>${temperatureText}</p>
    `;

    const recommendations = Array.isArray(data.recommendations)
      ? data.recommendations
      : [];

    const recommendationsHtml = recommendations.length > 0
      ? recommendations
          .map(item => `<li>${cleanRecommendationText(item)}</li>`)
          .join("")
      : `<li>暂无推荐内容</li>`;

    travelCard.innerHTML = `
      <h3>适宜出行推荐</h3>
      <p><strong>推荐摘要：</strong>${data.summary || "暂无摘要"}</p>
      <ul class="recommend-list">
        ${recommendationsHtml}
      </ul>
    `;
  } catch (error) {
    console.error("[Index] 加载首页天气推荐失败:", error);

    weatherCard.innerHTML = `
      <h3>当前天气</h3>
      <p>天气信息加载失败</p>
    `;

    travelCard.innerHTML = `
      <h3>适宜出行推荐</h3>
      <p>出行推荐加载失败</p>
    `;
  }
});
