import * as THREE from 'three'
import { GLOBAL_MATERIALS } from './AssetMaterials.js'

class AssetMaterialResolver {

  constructor() {
    this.AO_INTENSITY = 0.5
    this.ENV_INTENSITY = 1
  }

  getMaterial(materialKey) {
    return GLOBAL_MATERIALS[materialKey] || GLOBAL_MATERIALS.default
  }

  applyMaterialMapping(root, mapping) {
    if (!root || !mapping) return

    root.traverse(child => {
      if (!child.isMesh) return

      const geom = child.geometry

      // asegurar UV2
      if (geom?.attributes?.uv && !geom.attributes.uv2) {
        geom.setAttribute(
          'uv2',
          new THREE.BufferAttribute(geom.attributes.uv.array, 2)
        )
      }

      let materialKey = null
      const tag = child.userData?.tag

      if (tag && mapping[tag]) {
        materialKey = mapping[tag]
      }

      if (!materialKey) return

      const baseMat = this.getMaterial(materialKey)
      const dstMat = baseMat.clone()
      const srcMat = child.material

      // copiar mapas + AO fix
      this.copyMaps(dstMat, srcMat)

      dstMat.envMapIntensity = this.ENV_INTENSITY

      child.material = dstMat
      child.material.needsUpdate = true
    })
  }

  copyMaps(dst, src) {
    if (!src || !dst) return

    const hasORMinMap =
      src.map &&
      !src.aoMap &&
      !src.roughnessMap &&
      !src.metalnessMap

    // ORM packed
    if (hasORMinMap) {
      dst.map = src.map
      dst.aoMap = src.map
      dst.roughnessMap = src.map
      dst.metalnessMap = src.map

      dst.aoMapIntensity = this.AO_INTENSITY
      dst.roughness = src.roughness ?? 1.0
      dst.metalness = src.metalness ?? 1.0

      return
    }

    // mapas separados
    if (src.map) dst.map = src.map
    if (src.normalMap) dst.normalMap = src.normalMap
    if (src.roughnessMap) dst.roughnessMap = src.roughnessMap
    if (src.metalnessMap) dst.metalnessMap = src.metalnessMap

    if (src.aoMap) {
      dst.aoMap = src.aoMap
      dst.aoMapIntensity = this.AO_INTENSITY
    }
  }
}

export default new AssetMaterialResolver()