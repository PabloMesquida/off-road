# Rastrojero

Simulador off-road en el navegador con un Rastrojero 1971 modelado en Blender. Se maneja con físicas de vehículo reales (suspensión, tracción trasera, frenos) y tiene un modo edición para armar tu propio circuito de pruebas con conos, rampas, carteles, barreras y una zona de carga donde podés subir cajas a la camioneta.

## Tecnologías

- [Three.js](https://threejs.org/) r186 con `WebGPURenderer` (cae automáticamente a WebGL2 si el navegador no soporta WebGPU)
- TSL (Three.js Shading Language) para los materiales procedurales: grilla del suelo, bordes y zona de carga
- [tsl-textures](https://boytchev.github.io/tsl-textures/) para el patrón del concreto
- [Rapier](https://rapier.rs/) (`@dimforge/rapier3d-compat`) para las físicas y el controlador de vehículo
- [Tweakpane](https://tweakpane.github.io/docs/) para el panel de edición
- [Vite](https://vite.dev/) como servidor de desarrollo y bundler

## Requisitos

- Node.js 20.19 o superior (o 22.12+)
- Un navegador moderno: Chrome/Edge recomendados (WebGPU). En navegadores sin WebGPU se usa WebGL2.

## Instalación y uso

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173` (con `--host`, también accesible desde otros dispositivos de la red).

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción para probarlo |

Para ver el rendimiento (FPS y tiempo de CPU/GPU de cada pasada de render) agregá `?inspector` a la URL, por ejemplo `http://localhost:5173/?inspector`.

## Controles

### Manejo

| Tecla | Acción |
|---|---|
| `W` / `↑` | Acelerar |
| `S` / `↓` | Marcha atrás |
| `A` / `←` | Girar a la izquierda |
| `D` / `→` | Girar a la derecha |
| `Espacio` | Freno |
| `B` | Balizas |
| `L` | Luces |

Si la camioneta llega a la franja amarilla del borde del terreno, frena sola.

### Edición

| Tecla | Acción |
|---|---|
| `X` | Borrar el asset seleccionado |
| Rueda del mouse | Rotar el asset mientras lo estás colocando |

En local aparece además el botón **Grabar**, que graba el canvas a un video `.webm`.

## Modo edición

El modo edición se activa con el interruptor **EDIT MODE** del panel **Edit Panel** (arriba a la derecha).

**Al entrar:**
- La cámara pasa a una vista general del terreno y la camioneta vuelve a la posición de salida y se oculta.
- Se habilitan las carpetas **Floor**, **Camera** y **Assets** del panel.
- Se marca en rojo la zona de salida de la camioneta: ahí no se pueden colocar assets.

**Mover la cámara:** arrastrá con el botón izquierdo o el del medio sobre el terreno. En **Camera → Zoom Out Mode** podés alejarla para ver todo el mapa.

**Colocar assets:**
1. En **Assets** elegí qué colocar: Cone, Barrel, Ramp, Speed Bump, Concrete Barrier, Tire, los carteles de **Signs** (Ahead, Stop, Warning, Do Not Enter) o **Cargo Zone**.
2. Aparece una vista previa semitransparente que sigue al mouse sobre el terreno. Con la rueda del mouse la rotás en pasos de 22,5°.
3. Hacé clic para colocarlo. Podés seguir colocando más del mismo tipo; para terminar, volvé a hacer clic en el mismo botón o elegí otro.

No se pueden colocar assets dentro de la zona de salida (salvo la zona de carga) ni dentro de una zona de carga. Solo puede haber una **Cargo Zone**: mientras exista, su botón queda deshabilitado.

**Editar assets colocados:** al pasar el mouse por encima de un asset se resalta; con un clic se selecciona y aparece el gizmo:
- **Ejes X / Z**: mueven el asset sobre ese eje.
- **Cuadrado central**: lo mueve libremente sobre el suelo.
- **Anillo**: lo rota sobre su eje vertical.

Si soltás un asset dentro de la zona de carga, vuelve a su posición anterior. Con `X` se borra el asset seleccionado; si es la zona de carga, se borran también sus cajas.

**Suelo:** en **Floor → Grid** cambiás el estilo de la grilla (Dark, Contrast, Default, Blueprint, Retro, Neon, Funky) y su opacidad. En **Floor → Limits** ajustás el ancho y la separación del borde del área de manejo y el tamaño de las franjas.

**Guardar:**
- La configuración del suelo se guarda sola en el navegador cada vez que la cambiás.
- Los assets se guardan con el botón **Assets → Save Assets** y se vuelven a cargar al abrir la página. Se guardan en el `localStorage` del navegador, así que son locales de cada navegador.

**Al salir** del modo edición la camioneta vuelve a aparecer en la salida y la cámara la sigue de nuevo.

### Zona de carga

La zona de carga tiene una plataforma con 16 cajas. Entrá con la caja de la camioneta hacia la plataforma: cuando la caja de carga queda dentro de la zona, la luz pasa de roja a verde. Con la luz en verde podés arrastrar las cajas con el mouse y soltarlas en la caja de la camioneta.

## Estructura del proyecto

```
src/
├── core/        Game (singleton), Viewport, Resources (carga de modelos), Events
├── engine/      Render (WebGPURenderer, post-processing, resolución adaptativa),
│                cámara, físicas (Rapier) e inputs
├── gameplay/    Mundo: suelo, entorno/luces, vehículo, assets, zonas y sistemas
├── editor/      Panel de Tweakpane, colocación de assets, selección y gizmos
├── graphics/    Materiales (TSL y estándar) y funciones TSL
└── utils/       Grabación de video y utilidades de geometría
public/models/   Modelos .glb (camioneta, ruedas y assets)
```

## Log

- [Ahora la cargo zone se puede configurar con assets](https://lnkd.in/p/eUrPireM)
- [Agregué una zona de carga/descarga](https://lnkd.in/p/eYM3fzCD)
- [Actualicé el collider de la camioneta](https://lnkd.in/p/e7fjGYbR)
- [Estuve ajustando los colliders de varios assets](https://lnkd.in/p/eWsp5HWR)
- [Rehice varias partes del modo edición](https://lnkd.in/p/eQffnqnj)
- [Ahora se puede guardar la configuración de los assets](https://lnkd.in/p/e9QD4NtY)
- [Esta semana incorporé algunos assets nuevos](https://lnkd.in/p/eC4ShNFj)
- [Después de estar un buen rato con un bug en el spawn, por fin quedó resuelto](https://lnkd.in/p/eNRbxW8g)
- [El panel de edición ya está preparado para diferentes assets](https://lnkd.in/p/ev9hzkyS)
- [Agregué el panel de edición](https://www.linkedin.com/posts/pablomesquida_wip-threejs-activity-7391169492497813504-8gWH?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Le agregué los primeros objetos](https://www.linkedin.com/posts/pablomesquida_wip-threejs-activity-7389723248130936832-6F7I?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Al material del suelo le sumé la grilla](https://www.linkedin.com/posts/pablomesquida_wip-threejs-activity-7388552558438428672-jniF?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Después de ajustar el steering, ya está listo lo básico](https://www.linkedin.com/posts/pablomesquida_wip-threejs-activity-7387445684435611648-1iiv?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Exporté el Ambient Occlusion desde blender y me gusta mas](https://www.linkedin.com/posts/pablomesquida_wip-activity-7387163282178052096--p3i?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Frenos traseros, aplican fuerza diferente según la dirección](https://www.linkedin.com/posts/pablomesquida_wip-activity-7386715785370611713-OTaB?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [El sistema de luces OK: frontales, freno, balizas y reversa](https://www.linkedin.com/posts/pablomesquida_el-sistema-de-luces-ok-frontales-freno-activity-7386324000295235584-P8mp?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Los materiales del modelo se ven bien por ahora](https://www.linkedin.com/posts/pablomesquida_threejs-activity-7385956171595206656-WnrN?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Hice una retopología](https://www.linkedin.com/posts/pablomesquida_blender-activity-7383448908913590272-gpj7?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Three.js](https://www.linkedin.com/posts/pablomesquida_threejs-activity-7382323048814886912-Gkg8?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)
- [Rastrojero 1971](https://www.linkedin.com/posts/pablomesquida_blender-activity-7381596435009396736-HRWl?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAOrwu4B0RO09_Bykdb0H4iCUEZjPd9H-IE)

![Imagen](https://media.licdn.com/dms/image/v2/D4D22AQEbdUOJECXZBA/feedshare-shrink_800/B4DZrfZJdXKQAo-/0/1764684503062?e=1787788800&v=beta&t=qc7gtF3DGt0PBH3MXf--2KLJU9-D6RdnTFlESIzUMGM)
