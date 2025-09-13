function geometryToTrimesh(geometry) {
  geometry = geometry.index ? geometry : geometry.toNonIndexed()

  const vertices = new Float32Array(geometry.attributes.position.array)
  const indices = new Uint32Array(geometry.index.array)

  return { vertices, indices }
}

export default geometryToTrimesh