import * as THREE from "three";
import Game from "../../Game";
import { GLOBAL_MATERIALS, ASSET_CONFIGS } from "./AssetConfigs.js";

class AssetManager {
  constructor(scene, options = {}) {
    this.game = new Game();
    this.scene = scene;
    this.physics = this.game.physics;
    this.resources = this.game.resources;

    this.resourceName = options.resourcePathName || "coneModel";
    this.assetType = options.assetType || "cone";

    // Cargar modelo original
    this.original = this.resources.items?.[this.resourceName]?.scene;
    if (!this.original) {
      console.warn(`[AssetManager] Recurso no encontrado: ${this.resourceName}`);
      return;
    }

    // Mapa de meshes originales para compartir geometrías
    this.origMeshes = {};
    this.original.traverse((c) => {
      if (c.isMesh) this.origMeshes[c.name] = c;
    });

    // Calcular tamaño del modelo
    const box = new THREE.Box3().setFromObject(this.original);
    this.size = new THREE.Vector3();
    box.getSize(this.size);

    // Configuración según tipo
    const configs = ASSET_CONFIGS(this.size);
    this.config = configs[this.assetType] || configs.cone;

    this.sharedMaterials = GLOBAL_MATERIALS;
    this.instances = [];
    this.preview = null;
  }

  /* ─────────────────────────────────────────────
   * Materiales compartidos
   * ───────────────────────────────────────────── */
  assignMaterialByAssetType(child) {
    const materialName = this.getMaterialNameForMesh(child.name);
    return this.sharedMaterials[materialName] || this.sharedMaterials.default;
  }

  getMaterialNameForMesh(meshName) {
    const mapping = this.config.materialMapping || {};

    if (mapping[meshName]) return mapping[meshName];
    const lowerName = meshName.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (lowerName.includes(key.toLowerCase())) return value;
    }

    switch (this.assetType) {
      case "cone": return "naranja";
      case "barrel": return "azul";
      case "ramp": return "yellow";
      case "bump": return "yellow";
      default: return "default";
    }
  }

  /* ─────────────────────────────────────────────
   * Clonado eficiente
   * ───────────────────────────────────────────── */
  cloneModelShared() {
    const clone = this.original.clone(true);

    clone.traverse((child) => {
      if (!child.isMesh) return;
      const orig = this.origMeshes[child.name];
      if (orig) child.geometry = orig.geometry;
      child.material = this.assignMaterialByAssetType(child);
      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }

  /* ─────────────────────────────────────────────
   * Spawn (modelo + física + grupo raíz)
   * ───────────────────────────────────────────── */
  spawn(position = { x: 0, y: 0, z: 0 }) {
    if (!this.physics || !this.physics.world) {
      console.warn("[AssetManager] Física no inicializada todavía.");
    }

    // Si el asset usa trimesh
    if (this.config.physics.usesTrimesh) {

      // 🔥 toma el mesh principal (o el que quieras)
      const mesh = this.original.children.find(c => c.isMesh);

      const { vertices, indices } = this.extractTrimeshData(mesh);

      this.config.physics.colliders = [
        {
          shape: "trimesh",
          parameters: { vertices, indices },
          friction: 1.0
        }
      ];
    }

  if (this.config.physics.usesConvex) {

      const mesh = this.original.children.find(c => c.isMesh);
      const geo  = mesh.geometry;

      const vertices = new Float32Array(geo.attributes.position.array);

      // reemplazamos SOLO los parámetros del collider convex
      this.config.physics.colliders = [
          {
              shape: "convex",
              parameters: { vertices },
              friction: this.config.physics.colliders[0]?.friction ?? 1.0,
              density: this.config.physics.colliders[0]?.density ?? 1.0
          }
      ];
  }


    //  Grupo raíz consistente
    const group = new THREE.Group();
    group.name = `${this.assetType}_group`;

    // Modelo visual
    const model = this.cloneModelShared();
    model.position.y += this.config.verticalOffset;
    group.add(model);

    // Posición inicial
    group.position.set(position.x, position.y, position.z);

    // Agregar grupo a escena
    this.scene.add(group);

    // Crear cuerpo físico
    let entity = null;
    if (this.physics?.world) {
      const physDesc = { ...this.config.physics, position };
      entity = this.physics.addEntity(physDesc, group);
    }

    // Guardar referencias cruzadas
    const instance = {
      group,
      model,
      body: entity?.physical?.body || null,
      colliders: entity?.physical?.colliders || null,
      physicsEntity: entity,
      assetType: this.assetType
    };

    group.userData.assetInstance = instance;
    group.userData.assetType = this.assetType;

    this.instances.push(instance);
    return instance;
  }

  createConvexColliderFromMesh(mesh) {
      const geo = mesh.geometry;

      // Asegurar que la geometría está actualizada
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      // Obtenemos los vértices de la geometría
      const vertices = new Float32Array(geo.attributes.position.array);

      return {
          shape: "convex",
          parameters: {
              vertices
          },
          friction: 1.0
      };
  }

  extractTrimeshData(mesh) {
    const g = mesh.geometry;

    const vertices = new Float32Array(g.attributes.position.array);
    let indices;

    if (g.index)
      indices = new Uint32Array(g.index.array);
    else {
      // si la geometría no tiene índices, se generan
      indices = new Uint32Array(vertices.length / 3);
      for (let i = 0; i < indices.length; i++) indices[i] = i;
    }

    return { vertices, indices };
  }

  /* ─────────────────────────────────────────────
   * Preview (modo edición)
   * ───────────────────────────────────────────── */
  createPreview() {
    if (this.preview && this.preview.group) return this.preview;

    const group = new THREE.Group();
    const model = this.cloneModelShared();

    model.traverse((c) => {
      if (!c.isMesh) return;
      const mat = c.material.clone ? c.material.clone() : new THREE.MeshStandardMaterial();
      mat.transparent = true;
      mat.opacity = 0.55;
      mat.depthWrite = false;
      c.material = mat;
      c.castShadow = c.receiveShadow = false;
      c.userData.isPreview = true;
    });

    group.add(model);
    group.userData.isPreview = true;
    group.userData.assetType = this.assetType;

    this.scene.add(group);
    this.preview = { group, model };
    return this.preview;
  }

  updatePreviewPosition(worldPos) {
    if (!this.preview) return;
    const { group } = this.preview;
    if (!worldPos) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.position.set(worldPos.x, worldPos.y, worldPos.z);
  }

  disposePreview() {
    if (!this.preview) return;
    const { group } = this.preview;
    if (this.scene.children.includes(group)) this.scene.remove(group);
    group.traverse((c) => {
      if (c.isMesh && c.material?.dispose) c.material.dispose();
    });
    this.preview = null;
  }

  /* ─────────────────────────────────────────────
   * Limpieza
   * ───────────────────────────────────────────── */
  disposeAll() {
    this.disposePreview();
    for (const inst of this.instances) {
      this.scene.remove(inst.group);
      inst.group.traverse((c) => {
        if (c.isMesh && c.material?.dispose) c.material.dispose();
      });
      if (inst.physicsEntity && this.physics.removeEntity) {
        this.physics.removeEntity(inst.physicsEntity);
      }
    }
    this.instances = [];
  }

  resetPreview() {
    this.disposePreview();
    this.preview = null;
  }

  static getGlobalMaterials() {
    return GLOBAL_MATERIALS;
  }
}

export default AssetManager;
