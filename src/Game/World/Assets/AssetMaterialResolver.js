import { GLOBAL_MATERIALS } from './AssetMaterials.js'

class AssetMaterialResolver {

  getMaterial(materialKey) {
    return GLOBAL_MATERIALS[materialKey] || GLOBAL_MATERIALS.default
  }

  applyMaterialMapping(root, mapping) {
    if (!root || !mapping) return

    root.traverse(child => {
      if (!child.isMesh) return
      const materialName = mapping[child.name]
      if (!materialName) return

      child.material = this.getMaterial(materialName)
    })
  }
}

export default new AssetMaterialResolver()
