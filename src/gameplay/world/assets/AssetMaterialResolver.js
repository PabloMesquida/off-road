import { GLOBAL_MATERIALS } from './AssetMaterials.js'

class AssetMaterialResolver {

  getMaterial(materialKey) {
    return GLOBAL_MATERIALS[materialKey] || GLOBAL_MATERIALS.default
  }

  applyMaterialMapping(root, mapping) {
    if (!root || !mapping) return

    root.traverse(child => {
      if (!child.isMesh) return

      let materialKey = null

      const tag = child.userData?.tag
      if (tag && mapping[tag]) {
        materialKey = mapping[tag]
      }

      // if (!materialKey) {
      //   materialKey = mapping[child.name]
      // }

      // if (!materialKey) {
      //   const lower = child.name.toLowerCase()
      //   for (const key in mapping) {
      //     if (lower.includes(key.toLowerCase())) {
      //       materialKey = mapping[key]
      //       break
      //     }
      //   }
      // }

      if (!materialKey) return
      child.material = this.getMaterial(materialKey)
    })
  }

}

export default new AssetMaterialResolver()
