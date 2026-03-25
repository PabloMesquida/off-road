import * as TSL from 'three/tsl'

// --------------------------------------------------
// WORLD BORDER (rectángulo)
// --------------------------------------------------

export const computeWorldBorder = TSL.Fn(({
  position,
  planeSize,
  borderWidth,
  borderOffset,
  stripeSize
}) => {

  const pos = position.xz
  const half = planeSize.mul(0.5)

  const one = TSL.float(1.0)
  const zero = TSL.float(0.0)

  // distancia a borde interior
  const distX = half.x.sub(pos.x.abs())
  const distZ = half.y.sub(pos.y.abs())

  const distToEdge = TSL.min(distX, distZ)

  // dentro / fuera
  const insideMask = distToEdge.step(zero)

  // anillo
  const start = borderOffset
  const end = borderOffset.add(borderWidth)

  const edgeSmooth = TSL.float(0.025)

  const maskStart = TSL.smoothstep(
    start.sub(edgeSmooth),
    start.add(edgeSmooth),
    distToEdge
  )

  const maskEnd = TSL.smoothstep(
    end.sub(edgeSmooth),
    end.add(edgeSmooth),
    distToEdge
  )

  const borderMask = maskStart.sub(maskEnd).mul(insideMask)
  const emptyMask = maskEnd.mul(insideMask)
  const outsideMask = one.sub(insideMask)

  // stripes opcionales
  const sSize = stripeSize ?? TSL.float(0.5)

  const angle = TSL.float(45.0)
  const rad = angle.mul(Math.PI / 180.0)

  const rotX = pos.x.mul(TSL.cos(rad)).sub(pos.y.mul(TSL.sin(rad)))
  const stripeCoord = rotX.div(sSize)

  const stripePattern = TSL.mod(
    TSL.floor(stripeCoord),
    TSL.float(2.0)
  )

  const stripeSmooth = TSL.float(0.025)
  const periodic = TSL.fract(stripeCoord)

  const smoothTransition = TSL.smoothstep(
    zero,
    stripeSmooth,
    periodic
  ).sub(
    TSL.smoothstep(
      TSL.float(1.0).sub(stripeSmooth),
      TSL.float(1.0),
      periodic
    )
  )

  const stripes = stripePattern.mul(smoothTransition)

  const stripedBorder = borderMask.mul(stripes)

  return TSL.vec3(emptyMask, stripedBorder, outsideMask)
})



export const computePlaneBorder = TSL.Fn(({ uv, borderWidth }) => {

  const one = TSL.float(1.0)

  // distancia al borde en UV space
  const left = uv.x
  const right = one.sub(uv.x)
  const bottom = uv.y
  const top = one.sub(uv.y)

  const edgeDist = TSL.min(
    TSL.min(left, right),
    TSL.min(bottom, top)
  )

  const aa = TSL.fwidth(edgeDist)

  const border = one.sub(
    TSL.smoothstep(
      borderWidth.sub(aa),
      borderWidth.add(aa),
      edgeDist
    )
  )

  return TSL.saturate(border)
})