import { Mesh, Scene } from 'three'
import { Vec3 } from '../core/Math'

export class Projectile {
  private readonly scene: Scene
  public readonly mesh: Mesh
  private readonly velocity: Vec3 = new Vec3()
  private readonly gravity: number = 9.8
  private readonly initialSpeed: number = 45.0
  private lifeTime: number = 0
  private useGravity: boolean = true
  private _isActive: boolean = false
  public color: [number, number, number, number] = [1, 0.7, 0, 1] // Naranja bala
  public scale: Vec3 = new Vec3(0.2, 0.2, 0.2)
  public isVisible: boolean = true
  public geometryType: 'cube' | 'sphere' = 'sphere'

  constructor(_unusedScene: any, geometry: any, material: any) {
    this.mesh = new Mesh(geometry, material)
    this.mesh.visible = false
  }

  public spawn(position: Vec3, direction: Vec3, useGravity: boolean): void {
    this.mesh.position.copy(position as any)
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

    const pos = this.getPosition()
    pos.addScaledVector(this.velocity, delta)
    this.mesh.position.copy(pos as any)

    if (this.lifeTime > 2 || pos.lengthSq() > 1000000) {
      this.deactivate()
      return true
    }

    return false
  }

  public getPosition(): Vec3 {
    return this.mesh.position as any
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
