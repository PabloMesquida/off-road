function geometryToConvex(geometry) {
  geometry = geometry.index ? geometry.toNonIndexed() : geometry

  return new Float32Array(geometry.attributes.position.array)
}

export default geometryToConvex