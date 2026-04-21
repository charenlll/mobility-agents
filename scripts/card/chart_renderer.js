function safeNumber(value) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
}

function renderSimpleBar(label, value, maxValue) {
  const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>${label}</span>
        <span>${value}</span>
      </div>
      <div style="width: 100%; height: 12px; background: #ddd; border-radius: 6px; overflow: hidden;">
        <div style="width: ${widthPercent}%; height: 100%; background: #4a90e2;"></div>
      </div>
    </div>
  `;
}

function renderChartSection(stationData) {
  const totalFlow = safeNumber(stationData.total_flow);
  const cateringNum = safeNumber(stationData.catering_num);
  const shoppingMallNum = safeNumber(stationData.shopping_mall_num);
  const scenicSpotNum = safeNumber(stationData.scenic_spot_num);
  const companyNum = safeNumber(stationData.company_num);
  const educationNum = safeNumber(stationData.education_num);
  const livingServiceNum = safeNumber(stationData.living_service_num);
  const sportLeisureNum = safeNumber(stationData.sport_leisure_num);
  const medicalNum = safeNumber(stationData.medical_num);

  const maxValue = Math.max(cateringNum, scenicSpotNum, companyNum, shoppingMallNum, educationNum, livingServiceNum, sportLeisureNum, medicalNum, 1);

  return `
    <div>
      <h3>图表展示</h3>
      ${renderSimpleBar("餐饮设施数量", cateringNum, maxValue)}
      ${renderSimpleBar("风景名胜数量", scenicSpotNum, maxValue)}
      ${renderSimpleBar("公司企业数量", companyNum, maxValue)}
      ${renderSimpleBar("购物中心数量", shoppingMallNum, maxValue)}
      ${renderSimpleBar("教育设施数量", educationNum, maxValue)}
      ${renderSimpleBar("生活服务数量", livingServiceNum, maxValue)}
      ${renderSimpleBar("运动休闲数量", sportLeisureNum, maxValue)}
      ${renderSimpleBar("医疗设施数量", medicalNum, maxValue)}
    </div>
  `;
}
