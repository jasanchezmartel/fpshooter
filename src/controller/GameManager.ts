import { Engine } from '../view/Engine'
import { CameraManager } from '../view/CameraManager'
import { InputManager } from './InputManager'
import { Player } from '../view/Player'
import { UIManager } from '../view/UIManager'
import { GameModel, GameStatus } from '../model/GameModel'
import { eventBus } from '../core/EventBus'
import { ProjectileManager } from './ProjectileManager'
import { EnemyManager } from './EnemyManager'
import { CollisionManager } from './CollisionManager'
import { Vec3 } from '../core/Math'
import { AudioLoader, Audio, AudioListener } from 'three' // Mantener audio por ahora
import shootSoundUrl from '../assets/shoot.wav'

export class GameManager {
  private engine: Engine
  private cameraManager!: CameraManager
  private inputManager: InputManager
  private player: Player
  private uiManager: UIManager
  private model: GameModel

  private projectileManager!: ProjectileManager
  private enemyManager!: EnemyManager
  private collisionManager!: CollisionManager

  private audioListener!: AudioListener
  private container: HTMLElement
  private lastTabState: boolean = false
  private shootSound!: Audio
  private lastPauseKeyTime: number = 0

  constructor(container: HTMLElement, uiManager: UIManager) {
    this.model = new GameModel()
    this.uiManager = uiManager
    this.container = container

    this.engine = new Engine(container)
    this.inputManager = new InputManager()
    this.player = new Player(this.inputManager)
  }

  public init(): void {
    this.engine.init()
    this.inputManager.init()
    this.uiManager.init()

    this.cameraManager = new CameraManager(this.container)
    this.cameraManager.init()

    this.container.addEventListener('contextmenu', (e) => e.preventDefault())

    // Audio (Sigue siendo Three.js temporalmente para no perder sonido)
    this.audioListener = new AudioListener()
    
    // Inicializar nuevos managers
    this.projectileManager = new ProjectileManager(null as any)
    this.enemyManager = new EnemyManager(null as any, this.audioListener)
    this.collisionManager = new CollisionManager(null as any, this.audioListener)

    this.enemyManager.spawnInitialEnemies()
    
    // Registrar enemigos existentes en el motor nativo
    this.enemyManager.getEnemies().forEach(enemy => {
        this.engine.register(enemy as any)
    })

    // Reaccionar al estado de silencio
    eventBus.on('GAME_STATE_CHANGED', (state) => {
      if (this.audioListener) {
        this.audioListener.setMasterVolume(state.isMuted ? 0 : 1)
      }
    })

    this.shootSound = new Audio(this.audioListener)
    const audioLoader = new AudioLoader()
    audioLoader.load(shootSoundUrl, (buffer) => {
      this.shootSound.setBuffer(buffer)
      this.shootSound.setVolume(0.2)
    })

    this.engine.setAnimationLoopCallback((delta: number) => this.update(delta))
  }

  private update(delta: number): void {
    this.handleGlobalInputs()

    if (this.model.getState().status === GameStatus.PAUSED) {
      return
    }

    // Actualizar entidades
    this.cameraManager.update(delta)
    
    // Sincronizar matriz de vista con el motor
    this.engine.setViewMatrix(this.cameraManager.getViewMatrix())

    const yaw = this.cameraManager.getYaw()
    
    const oldPosition = this.player.getPosition().clone()
    this.player.update(delta, yaw)
    
    this.projectileManager.update(delta)
    this.enemyManager.update(delta)

    // Resolver colisiones
    const enemies = this.enemyManager.getEnemies()
    const projectiles = this.projectileManager.getActiveProjectiles()

    this.collisionManager.handlePlayerCollisions(this.player, enemies, oldPosition)
    this.collisionManager.handleProjectileCollisions(projectiles as any, enemies)
    this.collisionManager.updateDetectionZone(this.player.getPosition(), projectiles as any)

    // Sincronizar cámara y notificar posición
    eventBus.emit('UPDATE_PLAYER_POS', this.player.getPosition())
    this.cameraManager.updatePosition(this.player.getPosition())

    // Manejar disparo
    if (this.cameraManager.isLocked()) {
      if (this.player.tryShoot()) {
        this.handleShoot(true)
      }
      if (this.player.tryShootSecondary()) {
        this.handleShoot(false)
      }
    }
  }

  private handleGlobalInputs(): void {
    const currentTabState = this.inputManager.isKeyPressed('Tab')
    if (currentTabState !== this.lastTabState) {
      eventBus.emit('SET_TAB_MENU', { open: currentTabState })
      this.lastTabState = currentTabState
    }

    const now = Date.now()
    if (this.inputManager.isKeyPressed('KeyP') && now - this.lastPauseKeyTime > 300) {
      eventBus.emit('TOGGLE_PAUSE')
      this.lastPauseKeyTime = now

      if (this.model.getState().status === GameStatus.PAUSED) {
        this.cameraManager.unlock()
      } else {
        this.cameraManager.lock()
      }
    }
  }

  private handleShoot(useGravity: boolean): void {
    const position = new Vec3().copy(this.player.getPosition())
    const forward = this.cameraManager.getForwardVector()
    
    // 1. Calcular vector Derecha (Perpendicular al Forward y al Mundo Up)
    const right = new Vec3(-forward.z, 0, forward.x).normalize()
    
    // 2. Calcular vector Arriba local (Perpendicular a Derecha y Forward)
    const up = new Vec3(
      -forward.x * forward.y,
      forward.x * forward.x + forward.z * forward.z,
      -forward.z * forward.y
    ).normalize()

    // Ajuste milimétrico para la nueva arma compacta
    // 0.15 Derecha, -0.15 Arriba (abajo), 0.3 Adelante (punta del cañón corto)
    position.addScaledVector(right, 0.15)
    position.addScaledVector(up, -0.15)
    position.addScaledVector(forward, 0.3)

    // Al disparar, registramos el proyectil en el motor si no lo estaba
    this.projectileManager.spawn(position, forward, useGravity)
    const activeProjectiles = this.projectileManager.getActiveProjectiles()
    activeProjectiles.forEach(p => this.engine.register(p as any))

    if (this.shootSound.buffer) {
      if (this.shootSound.isPlaying) this.shootSound.stop()
      this.shootSound.play()
    }

    eventBus.emit('PLAYER_SHOOT')
  }
}