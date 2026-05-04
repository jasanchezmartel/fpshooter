import { Scene, SphereGeometry, MeshStandardMaterial, Vector3 } from 'three'
import { Projectile } from '../view/Projectile'

export class ProjectileManager {
  private readonly projectilePool: Projectile[] = []
  private readonly MAX_PROJECTILES = 50
  private readonly scene: Scene

  constructor(scene: Scene) {
    this.scene = scene
    this.initPool()
  }

  private initPool(): void {
    const geometry = new SphereGeometry(0.1, 8, 8)
    const material = new MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    })

    for (let i = 0; i < this.MAX_PROJECTILES; i++) {
      const p = new Projectile(this.scene, geometry, material)
      this.projectilePool.push(p)
    }
  }

  public spawn(position: Vector3, direction: Vector3, useGravity: boolean): void {
    const projectile = this.projectilePool.find((p) => !p.isActive)
    if (projectile) {
      projectile.spawn(position, direction, useGravity)
    }
  }

  public update(delta: number): void {
    for (const p of this.projectilePool) {
      if (p.isActive) {
        p.update(delta)
      }
    }
  }

  public getActiveProjectiles(): Projectile[] {
    return this.projectilePool.filter((p) => p.isActive)
  }
}
