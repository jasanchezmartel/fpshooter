import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameManager } from '../controller/GameManager'
import { UIManager } from '../view/UIManager'
import { Vector3 } from 'three'

// Mock de Engine y otros componentes pesados
vi.mock('../view/Engine', () => {
  return {
    Engine: class {
      init = vi.fn()
      getScene = vi.fn().mockReturnValue({
        add: vi.fn(),
        remove: vi.fn(),
      })
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
        getWorldPosition: vi.fn(),
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

vi.mock('../view/UIManager', () => {
  return {
    UIManager: class {
      init = vi.fn()
    }
  }
})

describe('Player-Enemy Collision Detection', () => {
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

  it('should prevent player from entering an enemy bounding box', () => {
    // Acceder a las instancias internas para el test (usando as any para simplificar el test)
    const gm = gameManager as any
    const player = gm.player
    const enemy = gm.enemyManager.getEnemies()[0]
    
    // Posicionar al enemigo en (5, 1, 5)
    // El tamaño del enemigo es (1, 2, 1) según initSharedResources
    enemy.mesh.position.set(5, 1, 5)
    enemy.update(0) // Actualizar bounding box
    
    // Intentar mover al jugador justo al centro del enemigo
    player.setPosition(new Vector3(5, 1.6, 5))
    
    // Ejecutar resolución de colisiones (usando una posición anterior segura)
    const safeOldPos = new Vector3(0, 1.6, 0)
    gm.collisionManager.handlePlayerCollisions(player, gm.enemyManager.getEnemies(), safeOldPos)
    
    // El jugador debería haber sido expulsado de la caja
    const finalPos = player.getPosition()
    
    expect(enemy.getBoundingBox().containsPoint(finalPos)).toBe(false)
  })

  it('should ignore collision if enemy is blinking', () => {
    const gm = gameManager as any
    const player = gm.player
    const enemy = gm.enemyManager.getEnemies()[0]
    
    enemy.mesh.position.set(5, 1, 5)
    enemy.hit() // Esto activa el blinkTimer
    enemy.update(0)
    
    expect(enemy.isCollidable()).toBe(false)
    
    // Posicionar al jugador en el centro
    const centerPos = new Vector3(5, 1.6, 5)
    player.setPosition(centerPos.clone())
    
    // Ejecutar resolución
    gm.collisionManager.handlePlayerCollisions(player, gm.enemyManager.getEnemies(), new Vector3(0, 1.6, 0))
    
    // El jugador NO debería haber sido movido porque el enemigo no es colisionable
    expect(player.getPosition().x).toBe(5)
    expect(player.getPosition().z).toBe(5)
  })
})
