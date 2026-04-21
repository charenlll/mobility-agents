function renderSuggestionSection(agentData) {
  const summary = agentData?.summary || "智能建议生成中...";
  const suggestions = Array.isArray(agentData?.suggestions)
    ? agentData.suggestions
    : ["系统正在分析当前站点，请稍候。"];

  const suggestionItems = suggestions
    .map(item => `<li>${item}</li>`)
    .join("");

  return `
    <div id="station-suggestion-section" class="station-suggestion-block">
      <h3>智能建议</h3>
      <p>${summary}</p>
      <ul>
        ${suggestionItems}
      </ul>
    </div>
  `;
}

