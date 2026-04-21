const STATION_TYPES = {
  BUS: "bus",
  METRO: "metro"
};

/**
 * API 地址配置
 *
 * 本地开发:
 *   http://127.0.0.1:8000
 *
 * 线上部署:
 *   https://你的-vercel-后端地址.vercel.app
 */
const API_CONFIG = {
  PROD_BASE_URL: "https://mobility-backend-two.vercel.app"
};

function getApiBaseUrl() {
  return API_CONFIG.PROD_BASE_URL;
}

const API_BASE_URL = getApiBaseUrl();

console.log("[API] 当前 API 地址:", API_BASE_URL);

/**
 * 图片地理参考参数
 */
const GEO_REFERENCE = {
  bus: {
    pixel_width: 0.000236914764047,
    rotation_x: 0.0,
    rotation_y: 0.0,
    pixel_height: -0.000236922361802,
    top_left_lng: 113.593629786185218,
    top_left_lat: 31.007584650442929
  },
  metro: {
    pixel_width: 0.000236914764047,
    rotation_x: 0.0,
    rotation_y: 0.0,
    pixel_height: -0.000236922361802,
    top_left_lng: 113.593629786185218,
    top_left_lat: 31.007584650442929
  }
};

function goHome() {
  window.location.href = "../index.html";
}

function goPage(path) {
  window.location.href = path;
}
