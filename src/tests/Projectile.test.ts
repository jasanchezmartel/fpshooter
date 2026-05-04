import { describe, it, expect } from 'vitest'
import { Vector3, Scene, SphereGeometry, MeshStandardMaterial } from 'three'
import { Projectile } from '../view/Projectile'

describe('Projectile (Projectile Unit)', () => {
  const geo = new SphereGeometry(0.1)
  const mat = new MeshStandardMaterial()

  it('positions the visual mesh exactly at the origin point upon creation', () => {
    const scene = new Scene()
    const startPos = new Vector3(5, 5, 5)
    const direction = new Vector3(0, 0, -1)
    const projectile = new Projectile(scene, geo, mat)
    projectile.spawn(startPos, direction, false)

    const pos = projectile.getPosition()
    expect(pos.x).toBe(5)
    expect(pos.y).toBe(5)
    expect(pos.z).toBe(5)
  })

  it('moves through 3D space following the provided direction vector', () => {
    const scene = new Scene()
    const startPos = new Vector3(0, 0, 0)
    const direction = new Vector3(0, 0, -1)
    const projectile = new Projectile(scene, geo, mat)
    projectile.spawn(startPos, direction, false)

    projectile.update(1.0) // Move for 1 second

    const currentPos = projectile.getPosition()
    // Velocity is 45m/s in Projectile.ts
    expect(currentPos.z).toBeCloseTo(-45)
    expect(currentPos.x).toBe(0)
    expect(currentPos.y).toBe(0)
  })

  it('applies gravitational force to vertical trajectory when useGravity is enabled', () => {
    const scene = new Scene()
    const startPos = new Vector3(0, 10, 0)
    const direction = new Vector3(0, 0, -1)
    const projectile = new Projectile(scene, geo, mat)
    projectile.spawn(startPos, direction, true)

    projectile.update(1.0)

    // Gravity reduces Y position
    expect(projectile.getPosition().y).toBeLessThan(10)
  })
})
