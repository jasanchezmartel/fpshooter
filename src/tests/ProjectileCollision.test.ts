import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameManager } from '../controller/GameManager'
import { UIManager } from '../view/UIManager'
import { Vector3, Scene } from 'three'
import { eventBus } from '../core/EventBus'

// Mocks necesarios para instanciar GameManager sin cargar recursos pesados
vi.mock('../view/Engine', () => {
  return {
    Engine: class {
      init = vi.fn()
      getScene = vi.fn().mockReturnValue(new Scene())
      getCamera = vi.fn().mockReturnValue({
        add: vi.fn(),
        position: new Vector3(),
      })
      setAnimationLoopCallback = vi.fn()
    }
  }
})

vi.mock('../view/CameraManager', () => {
  return {
    CameraManager: class {
      init = vi.fn()
      getHierarchyRoot = vi.fn().mockReturnValue({})
      getYaw = vi.fn().mockReturnValue(0)
      update = vi.fn()
      updatePosition = vi.fn()
      isLocked = vi.fn().mockReturnValue(true)
      getWeaponMesh = vi.fn().mockReturnValue({
        getWorldPosition: vi.fn((v: Vector3) => v.set(0, 1.6, 0)),
      })
      getForwardVector = vi.fn().mockReturnValue(new Vector3(0, 0, -1))
    }
  }
})

vi.mock('../controller/InputManager', () => {
  return {
    InputManager: class {
      init = vi.fn()
      isKeyPressed = vi.fn().mockReturnValue(false)
      isMousePressed = vi.fn().mockReturnValue(false)
    }
  }
})

describe('Projectile-Enemy Collision Integration', () => {
  let gameManager: GameManager
  let uiManager: UIManager
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    uiManager = {
      init: vi.fn(),
    } as unknown as UIManager
    
    gameManager = new GameManager(container, uiManager)
    gameManager.init()
  })

  it('should deactivate projectile and hit enemy upon collision', () => {
    const gm = gameManager as any
    const enemy = gm.enemyManager.getEnemies()[0]
    const projectile = gm.projectileManager.projectilePool[0]

    // Posicionar enemigo
    enemy.mesh.position.set(0, 1, -10)
    enemy.update(0) // Actualizar bounding box

    // Activar un proyectil justo en la posición del enemigo
    projectile.spawn(new Vector3(0, 1, -10), new Vector3(0, 0, -1), false)
    expect(projectile.isActive).toBe(true)

    // Espiar el evento de muerte
    const killedSpy = vi.fn()
    eventBus.on('ENEMY_KILLED', killedSpy)

    // Ejecutar actualización del juego con un delta pequeño para no saltarse el enemigo
    gm.update(0.001)

    // Verificaciones
    expect(projectile.isActive).toBe(false)
    expect(killedSpy).toHaveBeenCalled()
  })

  it('should ignore collisions if the enemy is already blinking (invulnerability)', () => {
    const gm = gameManager as any
    const enemy = gm.enemyManager.getEnemies()[0]
    const projectile = gm.projectileManager.projectilePool[0]

    // Posicionar y golpear al enemigo para que parpadee
    enemy.mesh.position.set(0, 1, -10)
    enemy.hit()
    enemy.update(0)
    expect(enemy.isCollidable()).toBe(false)

    // Lanzar proyectil
    projectile.spawn(new Vector3(0, 1, -10), new Vector3(0, 0, -1), false)

    const killedSpy = vi.fn()
    eventBus.on('ENEMY_KILLED', killedSpy)

    // Actualizar
    gm.update(0.016)

    // El proyectil NO debería desactivarse porque el enemigo es invulnerable
    expect(projectile.isActive).toBe(true)
    expect(killedSpy).not.toHaveBeenCalled()
  })
})
