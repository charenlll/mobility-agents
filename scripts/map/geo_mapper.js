function geoToPixel(longitude, latitude, geoReference) {
  const {
    pixel_width,
    pixel_height,
    top_left_lng,
    top_left_lat,
    rotation_x,
    rotation_y
  } = geoReference;

  // 当前 rotation_x 和 rotation_y 都为 0
  // 所以可直接简化成：
  const x = (longitude - top_left_lng) / pixel_width;
  const y = (latitude - top_left_lat) / pixel_height;

  return { x, y };
}
