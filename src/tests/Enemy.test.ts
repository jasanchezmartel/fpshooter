import { describe, it, expect } from 'vitest'
import { Vector3, Scene, AudioListener, BoxGeometry } from 'three'
import { Enemy } from '../view/Enemy'

describe('Enemy (Enemy Unit)', () => {
  const scene = new Scene()
  const listener = new AudioListener()
  const geo = new BoxGeometry(1, 2, 1)
  const pos = new Vector3(0, 1, 0)

  it('registers a collision when a projectile enters its impact zone', () => {
    const enemy = new Enemy(scene, geo, pos, listener)
    enemy.update(0) // Forzar actualización de boundingBox
    // Enemy is at (0, 1, 0) with geometry (1, 2, 1)
    const hit = enemy.checkCollision(new Vector3(0, 1, 0))
    expect(hit).toBe(true)
  })

  it('ignores collisions if the enemy is dead or in a blinking state', () => {
    const enemy = new Enemy(scene, geo, pos, listener)
    enemy.hit() // Activates blink
    const hit = enemy.checkCollision(new Vector3(0, 1, 0))
    expect(hit).toBe(false)
  })

  it('starts the blink timer immediately upon receiving a hit', () => {
    const enemy = new Enemy(scene, geo, pos, listener)
    enemy.hit()
    // Indirectly check state through collision behavior
    expect(enemy.checkCollision(pos)).toBe(false)
  })

  it('respawns automatically after the 3-second delay plus blinking period', () => {
    const enemy = new Enemy(scene, geo, pos, listener)
    enemy.hit() // 0.6s of blinking + 3s of respawn timer = 3.6s total

    // After 1 second (still blinking/dead)
    enemy.update(1.0)
    expect(enemy.checkCollision(pos)).toBe(false)

    // After 3 more seconds (total 4s, should have respawned)
    enemy.update(3.0)

    // After respawn it moves to a random position, but it should be "alive"
    // We can check if isDead is false indirectly if we had a getter,
    // or check if it can now collide with its NEW position.
    const newPos = enemy.getPosition()
    enemy.update(0) // Update bounding box at new position
    expect(enemy.checkCollision(newPos)).toBe(true)
  })
})
