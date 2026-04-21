const STATION_TYPES = {
  BUS: "bus",
  METRO: "metro"
};

const API_CONFIG = {
  PROD_BASE_URL: "https://mobility-backend-two.vercel.app"
};

const API_BASE_URL = API_CONFIG.PROD_BASE_URL;

const GEO_REFERENCE = {
  bus: {
    topLeft: { longitude: 113.95, latitude: 30.70 },
    bottomRight: { longitude: 114.65, latitude: 30.35 }
  },
  metro: {
    topLeft: { longitude: 113.95, latitude: 30.70 },
    bottomRight: { longitude: 114.65, latitude: 30.35 }
  }
};

function goHome() {
  window.location.href = "../index.html";
}

function goPage(path) {
  window.location.href = path;
}

