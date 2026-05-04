import { BufferGeometry, Material, Mesh, Scene, Vector3 } from 'three'

export class Projectile {
  private readonly scene: Scene
  private readonly mesh: Mesh
  private readonly velocity: Vector3 = new Vector3()
  private readonly gravity: number = 9.8
  private readonly initialSpeed: number = 45.0
  private readonly maxDistance: number = 500
  private lifeTime: number = 0
  private useGravity: boolean = true
  private _isActive: boolean = false

  constructor(scene: Scene, geometry: BufferGeometry, material: Material) {
    this.scene = scene
    this.mesh = new Mesh(geometry, material)
    this.mesh.visible = false
    this.scene.add(this.mesh)
  }

  public spawn(position: Vector3, direction: Vector3, useGravity: boolean): void {
    this.mesh.position.copy(position)
    this.velocity.copy(direction).normalize().multiplyScalar(this.initialSpeed)
    this.useGravity = useGravity
    this.lifeTime = 0
    this._isActive = true
    this.mesh.visible = true
  }

  public update(delta: number): boolean {
    if (!this._isActive) return false

    this.lifeTime += delta

    if (this.useGravity) {
      this.velocity.y -= this.gravity * delta
    }

    this.mesh.position.addScaledVector(this.velocity, delta)

    // Auto-desactivación por suelo o distancia/tiempo
    if (
      this.mesh.position.y <= 0 ||
      this.lifeTime > 3 ||
      this.mesh.position.length() > this.maxDistance
    ) {
      this.deactivate()
      return true
    }

    return false
  }

  public getPosition(): Vector3 {
    return this.mesh.position
  }

  public deactivate(): void {
    this._isActive = false
    this.mesh.visible = false
  }

  public get isActive(): boolean {
    return this._isActive
  }

  public destroy(): void {
    this.scene.remove(this.mesh)
  }
}
