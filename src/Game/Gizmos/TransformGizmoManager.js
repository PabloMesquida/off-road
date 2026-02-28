import Game from '../Game.js'
import SimpleGizmo from './SimpleGizmo.js'


export default class TransformGizmoManager {

  constructor({ scene, cameraGetter, domElement, inputsEvents, onChangeKinematic, onDeleteAsset }) {

    this.game = new Game()
    this.scene = scene
    this.cameraGetter = cameraGetter
    this.domElement = domElement
    this.inputsEvents = inputsEvents
    this.onChangeKinematic = onChangeKinematic
    this.onDeleteAsset = onDeleteAsset

    this.gizmo = null
    this.selectedAsset = null
    this.isDragging = false

    this.inputsEvents?.on('delete', (isDown)=>{
      if (!isDown) return
      if (!this.selectedAsset) return
      this.onDeleteAsset?.(this.selectedAsset)
    })
  }

  create() {
    if (this.gizmo) return

    this.gizmo = new SimpleGizmo({
      scene:this.scene,
      cameraGetter:this.cameraGetter,
      domElement:this.domElement,
      onDragStart:()=>{
        this.isDragging = true
        this.onChangeKinematic?.(true,this.selectedAsset)
      },
      onDragEnd:()=>{
        this.isDragging = false
        this.onChangeKinematic?.(false,this.selectedAsset)
      }
    })
  }

  attach(object) {
    this.selectedAsset = object
    if (!this.gizmo) this.create()
    this.gizmo.attach(object)
  }

  detach() {
    this.selectedAsset = null
    this.gizmo?.detach()
  }

  dispose() {
    this.gizmo?.dispose()
    this.gizmo = null
    this.selectedAsset = null
    this.isDragging = false
  }

  get dragging(){
    return this.isDragging
  }
}