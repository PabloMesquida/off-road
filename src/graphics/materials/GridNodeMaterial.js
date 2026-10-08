import * as THREE from 'three/webgpu';
import * as TSL from 'three/tsl';
import { computeWorldBorder } from '../tsl/functions/border.js'

// -------------------------
// Funciones TSL 
// -------------------------

const computeMask = TSL.Fn(({ uv, lineWidth, cellSize, uvDeriv }) => {
    const uvDerivGrid = uvDeriv.div( TSL.vec2(cellSize) );
    const lwCells = TSL.vec2(lineWidth).div( TSL.vec2(cellSize) );
    const invertLine = lwCells.greaterThan(TSL.float(0.5));
    const targetWidth = TSL.select(invertLine, TSL.vec2(1.0).sub(lwCells), lwCells);
    const drawWidth = TSL.clamp(targetWidth, uvDerivGrid, TSL.vec2(TSL.float(0.5)));
    const lineAA = uvDerivGrid.mul(TSL.float(1.5));
    let gridUV = TSL.fract( uv.div( TSL.vec2(cellSize) ) ).mul(TSL.float(2.0)).sub(TSL.float(1.0)).abs();
    gridUV = TSL.select(invertLine, gridUV, TSL.vec2(1.0).sub(gridUV));
    let grid2 = TSL.smoothstep( drawWidth.add(lineAA), drawWidth.sub(lineAA), gridUV );
    grid2 = TSL.vec2(grid2);
    grid2 = grid2.mul( TSL.saturate( targetWidth.div(drawWidth) ) );
    const t = TSL.saturate( uvDerivGrid.mul(TSL.float(2.0)).sub(TSL.float(1.0)) );
    grid2 = TSL.mix(grid2, targetWidth, t);
    grid2 = TSL.select(invertLine, TSL.vec2(1.0).sub(grid2), grid2);
    const mask = TSL.mix( grid2.x, TSL.float(1.0), grid2.y );

    return mask;
});

const computePlusMask = TSL.Fn(({ uv, lineWidth, cellSize, segmentLen, uvDeriv }) => {
  const uvDerivGrid = uvDeriv.div( TSL.vec2(cellSize) );
  const lwVec = TSL.vec2(lineWidth).div( TSL.vec2(cellSize) );
  const drawWidth = TSL.clamp(lwVec, uvDerivGrid, TSL.vec2(TSL.float(0.5)));
  const lineAA = uvDerivGrid.mul(TSL.float(1.5));
  const cell = TSL.fract( uv.div( TSL.vec2(cellSize) ) );
  const tri = TSL.vec2(1.0).sub( cell.mul(TSL.float(2.0)).sub(TSL.float(1.0)).abs() );
  const gridUV = cell.mul(TSL.float(2.0)).sub(TSL.float(1.0)).abs();
  const smoothEdges = TSL.smoothstep( drawWidth.sub(lineAA), drawWidth.add(lineAA), gridUV );
  const lineMaskVec = TSL.vec2(1.0).sub( smoothEdges );
  // const seg = TSL.float(segmentLen);
  const seg = segmentLen.div( TSL.float(1.0).mul(cellSize) )
  const segAA = uvDerivGrid.mul(TSL.float(0.5)).x.add( uvDerivGrid.mul(TSL.float(0.5)).y ).mul(TSL.float(0.5));
  const segEdge0 = seg.sub(segAA);
  const segEdge1 = seg.add(segAA);
  const selectorY = TSL.smoothstep(segEdge0, segEdge1, tri.y);
  const selectorX = TSL.smoothstep(segEdge0, segEdge1, tri.x);
  const verticalArm   = lineMaskVec.x.mul( selectorY );
  const horizontalArm = lineMaskVec.y.mul( selectorX );
  const plusMask = TSL.saturate( verticalArm.add(horizontalArm) );

  return plusMask;
});


const computeStartBorder = TSL.Fn(({ position, planeSize, borderWidth, borderOffset }) => {
  const pos = position.xz;
  const half = planeSize.mul(0.5);

  const one = TSL.float(1.0);
  const zero = TSL.float(0.0);

  // --- Calcular la relación de aspecto (para compensar grosor) ---
  const aspect = planeSize.x.div(planeSize.y.mul(0.75)); // si x > y, aspect > 1
  const borderWidthZ = borderWidth.mul(aspect); // duplicar borde en Z cuando el plano es más angosto

  // --- Distancias internas ---
  const distX = half.x.sub(pos.x.abs());
  const distZ = half.y.sub(pos.y.abs().mul(1.5));

  // --- Umbrales del borde ---
  const start = borderOffset;
  
  //  aplicar compensación en el eje Z
  const endX = borderOffset.add(borderWidth);
  const endZ = borderOffset.add(borderWidthZ);

  // --- Calcular máscara por eje ---
  const edgeSmooth = TSL.float(0.025);

  const maskStartX = TSL.smoothstep(start.sub(edgeSmooth), start.add(edgeSmooth), distX);
  const maskEndX   = TSL.smoothstep(endX.sub(edgeSmooth), endX.add(edgeSmooth), distX);
  
  const maskStartZ = TSL.smoothstep(start.sub(edgeSmooth), start.add(edgeSmooth), distZ);
  const maskEndZ   = TSL.smoothstep(endZ.sub(edgeSmooth), endZ.add(edgeSmooth), distZ);

  // --- Combinar ejes para borde uniforme ---
  const maskStart = TSL.min(maskStartX, maskStartZ);
  const maskEnd   = TSL.min(maskEndX, maskEndZ);

  const insideMask = TSL.min(distX, distZ).step(zero);

  const borderMask = maskStart.sub(maskEnd).mul(insideMask);
  const emptyMask = maskEnd.mul(insideMask);
  const outsideMask = one.sub(insideMask);

  return TSL.vec3(emptyMask, borderMask, outsideMask);
});




// -------------------------
// Presets
// -------------------------

export const GridPresets = {
  default: {
    cellSizeA: 10.0, lineWidthA: 0.05, colorA: '#ae7100', 
    cellSizeB: 2.0,  lineWidthB: 0.002, colorB: '#0046d2', 
    cellSizeC: 1.0,  lineWidthC: 0.0275, colorC: '#700000', segmentLen: 0.9, 
    bgColor: '#0b0b0b'
  },

  // 1. Blanco y Negro 
  contrast: {
    cellSizeA: 10.0, lineWidthA: 0.06, colorA: '#ffffff', 
    cellSizeB: 1.0,  lineWidthB: 0.004, colorB: '#ffffff', 
    cellSizeC: 0,  lineWidthC: 0.02, colorC: '#808080', segmentLen: 0.9, 
    bgColor: '#000000'
  },

  // 2. Modo oscuro 
  dark: {
    cellSizeA: 10.0, lineWidthA: 0.04, colorA: '#2ecc71', 
    cellSizeB: 1.0,  lineWidthB: 0.003, colorB: '#3498db', 
    cellSizeC: 2.0,  lineWidthC: 0.03, colorC: '#3498db', segmentLen: 1.9, 
    bgColor: '#0b1220'
  },

  // 3. Modo claro 
  light: {
    cellSizeA: 10.0, lineWidthA: 0.04, colorA: '#6777ac', 
    cellSizeB: 1.0,  lineWidthB: 0.005, colorB: '#6777ac', 
    cellSizeC: 2.0,  lineWidthC: 0.03, colorC: '#6777ac', segmentLen: 1.9, 
    bgColor: '#c0c8cf'
  },

  // 4. Blueprint 
  blueprint: {
    cellSizeA: 8.0, lineWidthA: 0.03, colorA: '#008897', 
    cellSizeB: 1.0, lineWidthB: 0.002, colorB: '#0077cc', 
    cellSizeC: 1.0, lineWidthC: 0.01, colorC: '#00477a', segmentLen: 0.9, 
    bgColor: '#001026'
  },

  // 5. Retro 
  retro: {
    cellSizeA: 10.0, lineWidthA: 0.06, colorA: '#ffb86b',
    cellSizeB: 1.0,  lineWidthB: 0.005, colorB: '#7a3f12', 
    cellSizeC: 0,  lineWidthC: 0.03, colorC: '#d35400', segmentLen: 0.85,
    bgColor: '#2b1b10'
  },

  // 6. Neon 
  neon: {
    cellSizeA: 10.0,  lineWidthA: 0.045, colorA: '#39ff14', 
    cellSizeB: 2.0,  lineWidthB: 0.0035, colorB: '#ff00cc', 
    cellSizeC: 1.0,  lineWidthC: 0.03, colorC: '#00ffff', segmentLen: 0.9, 
    bgColor: '#04040a'
  },

  // 7. Funky 
  funky: {
    cellSizeA: 8.0,  lineWidthA: 0.06, colorA: '#ffff00',
    cellSizeB: 1.0,  lineWidthB: 0.02, colorB: '#ff00ff',
    cellSizeC: 1.0,  lineWidthC: 0.03, colorC: '#00ffff', segmentLen: 0.9,
    bgColor: '#2a002a'
  }
}; 

export const GridStyles = Object.keys(GridPresets);

// Claves de preset: todas están respaldadas por uniforms
const PRESET_KEYS = [
  'cellSizeA', 'lineWidthA', 'colorA',
  'cellSizeB', 'lineWidthB', 'colorB',
  'cellSizeC', 'lineWidthC', 'colorC', 'segmentLen',
  'bgColor'
];

// -------------------------
// Clase principal
// -------------------------

export class GridNodeMaterial extends THREE.NodeMaterial {

  static get type() { return 'GridNodeMaterial'; }
  
  constructor(params = {}) {
    super();
    this.isGridNodeMaterial = true;

    // Merge con preset default
    const finalParams = { ...GridPresets.default, ...params };

    const defaultSize = new THREE.Vector2(100, 100);
    if (params.planeSize instanceof THREE.Vector2) {
      this._planeSize = TSL.uniform(params.planeSize.clone());
    } else if (Array.isArray(params.planeSize)) {
      this._planeSize = TSL.uniform(new THREE.Vector2(params.planeSize[0], params.planeSize[1]));
    } else if (typeof params.planeSizeX === 'number' && typeof params.planeSizeZ === 'number') {
      this._planeSize = TSL.uniform(new THREE.Vector2(params.planeSizeX, params.planeSizeZ));
    } else {
      this._planeSize = TSL.uniform(defaultSize);
    }
    this._borderWidth = TSL.uniform(typeof finalParams.borderWidth === 'number' ? finalParams.borderWidth : 0.2);
    this._borderOffset = TSL.uniform(typeof finalParams.borderOffset === 'number' ? finalParams.borderOffset : 0.2);
    this._borderColor = TSL.uniform(new THREE.Color(finalParams.borderColor || '#ffffff'));
    this._stripeSize = TSL.uniform(typeof finalParams.stripeSize === 'number' ? finalParams.stripeSize : 0.2);

    // Definimos uniforms internos (privados) para las grillas
    this._cellSizeA = TSL.uniform(finalParams.cellSizeA);
    this._lineWidthA = TSL.uniform(finalParams.lineWidthA);
    this._colorA = TSL.uniform(new THREE.Color(finalParams.colorA));

    this._cellSizeB = TSL.uniform(finalParams.cellSizeB);
    this._lineWidthB = TSL.uniform(finalParams.lineWidthB);
    this._colorB = TSL.uniform(new THREE.Color(finalParams.colorB));

    this._cellSizeC = TSL.uniform(finalParams.cellSizeC);
    this._lineWidthC = TSL.uniform(finalParams.lineWidthC);
    this._colorC = TSL.uniform(new THREE.Color(finalParams.colorC));
    this._segmentLen = TSL.uniform(finalParams.segmentLen);

    this._bgColor = TSL.uniform(new THREE.Color(finalParams.bgColor));
    this._opacity = TSL.uniform(1.0);

    // --- Fragment node: calcular UVs/world derivs para AA de grilla ---
    const uv = TSL.positionWorld.xz;
    const ddxUV = TSL.dFdx(uv);
    const ddyUV = TSL.dFdy(uv);
    const uvDeriv = TSL.vec2(
      TSL.length(TSL.vec2(ddxUV.x, ddyUV.x)),
      TSL.length(TSL.vec2(ddxUV.y, ddyUV.y))
    );

    // máscaras de grilla (usar tus funciones existentes)
    const maskA = computeMask({ uv, lineWidth: this._lineWidthA, cellSize: this._cellSizeA, uvDeriv });
    const maskB = computeMask({ uv, lineWidth: this._lineWidthB, cellSize: this._cellSizeB, uvDeriv });
    const maskC = computePlusMask({ uv, lineWidth: this._lineWidthC, cellSize: this._cellSizeC, segmentLen: this._segmentLen, uvDeriv });

    const one = TSL.float(1.0);

    // aseguramos rangos [0,1]
    const mA = TSL.saturate(maskA);
    const mB = TSL.saturate(maskB);
    const mC = TSL.saturate(maskC);

    // reglas de prioridad entre capas
    const mB_eff = TSL.saturate( mB.mul( one.sub(mA) ) );
    const mC_eff = TSL.saturate( mC.mul( one.sub(mA) ).mul( one.sub(mB_eff) ) );

    // fondo solo donde ninguna máscara cubre
    const total = mA.add(mB_eff).add(mC_eff);
    const bgWeight = TSL.saturate( one.sub(total) );

    // --- Borde fijo en unidades del mundo (usa computeWorldBorder definido arriba) ---
    const borderMask = computeWorldBorder({
      position: TSL.positionWorld,
      planeSize: this._planeSize,
      borderWidth:this._borderWidth,
      borderOffset: this._borderOffset,
      stripeSize: this._stripeSize
    });

    const startBorderMask = computeStartBorder({   
      position: TSL.positionWorld,
      planeSize: this._planeSize,
      borderWidth: TSL.float(0.25),
      borderOffset: TSL.float(76)
    })

    // convertimos máscara a vec3
    const maskVec = TSL.vec3(borderMask)
    const maskVecStart = TSL.vec3(startBorderMask)

    // composición base de las capas
    const out = TSL.clamp(
      this._bgColor.mul(bgWeight)
        .add( this._colorA.mul(mA) )
        .add( this._colorB.mul(mB_eff) )
        .add( this._colorC.mul(mC_eff) )
        .add( this._borderColor.mul(maskVec.y) )
        .add( this._borderColor.mul(maskVecStart.y)),
      TSL.vec3(0.0),
      TSL.vec3(1.0)
    );

    // color del borde (multiplicado por la máscara) y mezcla nítida:
    // const borderColMasked = this._borderColor.mul(maskVec);
    // final: donde mask=1 -> borderCol, donde mask=0 -> out
    // const finalColor = out.mul(invMaskVec).add(borderColMasked);

    this.colorNode = out;
    this.alphaNode = this._opacity;
    this.transparent = true;
  }

  // ------------------------
  // Getters / Setters
  // ------------------------
  get cellSizeA() { return this._cellSizeA.value; }
  set cellSizeA(v) { this._cellSizeA.value = v; }

  get lineWidthA() { return this._lineWidthA.value; }
  set lineWidthA(v) { this._lineWidthA.value = v; }

  get colorA() { return this._colorA.value; }
  set colorA(v) {
    if (typeof v === 'string' || typeof v === 'number') this._colorA.value.set(v);
    else this._colorA.value.copy(v);
  }

  get cellSizeB() { return this._cellSizeB.value; }
  set cellSizeB(v) { this._cellSizeB.value = v; }

  get lineWidthB() { return this._lineWidthB.value; }
  set lineWidthB(v) { this._lineWidthB.value = v; }

  get colorB() { return this._colorB.value; }
  set colorB(v) {
    if (typeof v === 'string' || typeof v === 'number') this._colorB.value.set(v);
    else this._colorB.value.copy(v);
  }

  get cellSizeC() { return this._cellSizeC.value; }
  set cellSizeC(v) { this._cellSizeC.value = v; }

  get lineWidthC() { return this._lineWidthC.value; }
  set lineWidthC(v) { this._lineWidthC.value = v; }

  get colorC() { return this._colorC.value; }
  set colorC(v) {
    if (typeof v === 'string' || typeof v === 'number') this._colorC.value.set(v);
    else this._colorC.value.copy(v);
  }

  get segmentLen() { return this._segmentLen.value; }
  set segmentLen(v) { this._segmentLen.value = v; }

  get bgColor() { return this._bgColor.value; }
  set bgColor(v) {
    if (typeof v === 'string' || typeof v === 'number') this._bgColor.value.set(v);
    else this._bgColor.value.copy(v);
  }

  // Reemplaza el getter/setter actuales de 'opacity' por esta versión defensiva
  get opacity() {
    if (!this._opacity) {
      // valor por defecto si aún no fue creado (evita el error cuando Material() asigna opacity)
      this._opacity = TSL.uniform(1.0);
    }
    return this._opacity.value;
  }
  set opacity(v) {
    if (!this._opacity) {
      this._opacity = TSL.uniform(1.0);
    }
    this._opacity.value = v;
  }


  get gridSize() {
    return this._planeSize?.value ?? new THREE.Vector2(100, 100);
  }

set gridSize(v) {
  if (!this._planeSize) this._planeSize = TSL.uniform(new THREE.Vector2(100, 100));

  if (v instanceof THREE.Vector2) {
    this._planeSize.value.copy(v);
  } else if (Array.isArray(v)) {
    this._planeSize.value.set(v[0], v[1]);
  } else if (typeof v === 'object') {
    this._planeSize.value.set(v.x ?? v[0], v.y ?? v[1]);
  } else {
    throw new Error('gridSize: valor no válido');
  }
  // Es un uniform: no hace falta needsUpdate (eso fuerza a reconstruir el shader)
}

  get borderWidth() {
    if (!this._borderWidth) this._borderWidth = TSL.uniform(20.0);
    return this._borderWidth.value;
  }
  set borderWidth(v) {
    if (!this._borderWidth) this._borderWidth = TSL.uniform(20.0);
    this._borderWidth.value = v;
  }

  get borderOffset() {
    if (!this._borderOffset) this._borderOffset = TSL.uniform(10.0);
    return this._borderOffset.value;
  }
  set borderOffset(v) {
    if (!this._borderOffset) this._borderOffset = TSL.uniform(10.0);
    this._borderOffset.value = v;
  }

  get stripeSize() {
    if (!this._stripeSize) this._stripeSize = TSL.uniform(1.5);
    return this._stripeSize.value;
  }
  set stripeSize(v) {
    if (!this._stripeSize) this._stripeSize = TSL.uniform(1.5);
    this._stripeSize.value = v;
  }

  get borderColor() {
    if (!this._borderColor) this._borderColor = TSL.uniform(new THREE.Color('#ffffff'));
    return this._borderColor.value;
  }
  set borderColor(v) {
    if (!this._borderColor) this._borderColor = TSL.uniform(new THREE.Color('#ffffff'));
    if (typeof v === 'string' || typeof v === 'number') this._borderColor.value.set(v);
    else this._borderColor.value.copy(v);
  }

  // ------------------------
  // Helpers runtime
  // ------------------------
  setPlaneSize(x, z) {
    if (!this._planeSize) this._planeSize = TSL.uniform(new THREE.Vector2(x, z));
    else this._planeSize.value.set(x, z);
  }

  setMesh(mesh) {
    if (!mesh || !mesh.geometry) return;
    const geom = mesh.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();

    const size = new THREE.Vector3();
    geom.boundingBox.getSize(size); // size en espacio local

    const worldScale = new THREE.Vector3();
    mesh.getWorldScale(worldScale);

    size.multiply(worldScale); // tamaño en unidades del mundo

    // suponiendo plano en XZ
    if (!this._planeSize) this._planeSize = TSL.uniform(new THREE.Vector2(size.x, size.z));
    else this._planeSize.value.set(size.x, size.z);
  }

  // Cambiar de preset solo actualiza uniforms: mismo shader, sin recompilar
  applyPreset(style = 'default') {
    const preset = GridPresets[style] || GridPresets.default;
    for (const key of PRESET_KEYS) this[key] = preset[key];
  }

  // Factory estática estilo WoodNodeMaterial
  static fromPreset(style = 'default', overrides = {}) {
    const preset = GridPresets[style] || GridPresets.default;
    return new GridNodeMaterial({ ...preset, ...overrides });
  }
}
