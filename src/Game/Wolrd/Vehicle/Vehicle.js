import * as THREE from 'three/webgpu'

class Vehicle{
  constructor(scene, physics){
    this.scene = scene
    this.physics = physics
    this.sizes = { width: 2, height: 1, depth: 4}

    this.setModel()
    this.setPhysics()
    this.setVehicle()
  }

  setModel(){
    const geometry = new THREE.BoxGeometry(this.sizes.width, this.sizes.height, this.sizes.depth)
    const material = new THREE.MeshBasicMaterial({color: 'white', wireframe: true})
    this.chassis = new THREE.Mesh(geometry, material)
    this.scene.add(this.chassis)
  }

  setPhysics() {
   this.chassisBody = this.physics.addEntity({
      type: 'dynamic',
      position: { x:0, y:1, z:0},
      colliders: [ { shape: 'cuboid', parameters: [this.sizes.width * .5, this.sizes.height * .5, this.sizes.depth * .5] }]
    }, this.chassis)   
  }

  setVehicle() {
    //console.log(this.physics.world)
  }
}

export default Vehicle