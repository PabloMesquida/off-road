import * as TSL from 'three/tsl'
import * as THREE from 'three/webgpu'
import { simplexNoise, rust } from 'tsl-textures'

class PolishedConcreteMaterial extends THREE.MeshStandardNodeMaterial {
  constructor({
    color1 = new THREE.Color(0x30363B),
    color2 = new THREE.Color(0x313438),
    color3 = new THREE.Color(0x16181B),
  } = {}) {
    super()

    const simpleNoiseBase = simplexNoise({
      scale: -3.5,
      balance: 0.25,
      contrast: 0,
      color:  color1,     
      background: color3, 
      seed: 0,
    })

    const rusty = rust({
      scale: 0,
      iterations: 2,
      amount: -0.05,
      opacity: 1,
      noise: 0.1,
      noiseScale: 0.1,
      color: color2,
      background:color3,
      seed: 0,
    })

    const main = TSL.Fn(() => {
      const mixedColor =TSL.vec3(simpleNoiseBase)
      const rustyColor = TSL.vec3(rusty)
      mixedColor.assign(TSL.mix( mixedColor, rustyColor, TSL.float(0.1)))
   
      return TSL.vec4(mixedColor, TSL.float(1.0))
    });

    this.proceduralColorNode = main()
    this.colorNode = this.proceduralColorNode
    this.roughnessNode = TSL.float(1.0)
  }

  // El patrón es estático: en vez de evaluar los ruidos en cada píxel de cada frame,
  // se renderiza una sola vez a una textura y el material pasa a muestrearla.
  // width/depth: tamaño del suelo en XZ; topY: altura de la cara superior en coordenadas de la geometría.
  bake(renderer, { width, depth, topY, resolution = 2048 }) {
    const { positionGeometry, vec2, vec4, texture } = TSL

    const target = new THREE.RenderTarget(resolution, resolution, {
      depthBuffer: false,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter
    })
    // 8 bits con codificación sRGB (rgba8unorm-srgb): sin banding en estos tonos tan oscuros
    target.texture.colorSpace = THREE.SRGBColorSpace
    target.texture.anisotropy = renderer.getMaxAnisotropy()

    // Plano auxiliar cuyo atributo position contiene coordenadas del suelo (lo que leen los nodos
    // de tsl-textures vía positionGeometry). El vertexNode lo estira a todo el render target:
    // x -> clip.x, z -> -clip.y, que en three corresponde a uv = (x / width + 0.5, z / depth + 0.5).
    const geometry = new THREE.PlaneGeometry(width, depth)
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, topY, 0)

    const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide })
    material.colorNode = this.proceduralColorNode
    material.vertexNode = vec4(positionGeometry.x.div(width / 2), positionGeometry.z.div(-depth / 2), 0, 1)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false

    const scene = new THREE.Scene()
    scene.add(mesh)

    // La cámara no influye: el vertexNode escribe directamente la posición en clip space
    const camera = new THREE.OrthographicCamera()

    const previousTarget = renderer.getRenderTarget()
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    renderer.setRenderTarget(previousTarget)

    geometry.dispose()
    material.dispose()

    this.bakedTarget = target
    this.colorNode = texture(target.texture, vec2(
      positionGeometry.x.div(width).add(0.5),
      positionGeometry.z.div(depth).add(0.5)
    ))
    // Cambia el grafo de nodos: una única recompilación
    this.needsUpdate = true
  }

  dispose() {
    this.bakedTarget?.dispose()
    super.dispose()
  }
}

export default PolishedConcreteMaterial;
