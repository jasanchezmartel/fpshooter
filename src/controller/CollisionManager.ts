import { Box3, Mesh, MeshStandardMaterial, PositionalAudio, Scene, Sphere, Vector3, AudioListener, AudioLoader, BoxGeometry } from 'three'
import { Player } from '../view/Player'
import { Enemy } from '../view/Enemy'
import { Projectile } from '../view/Projectile'
import { eventBus } from '../core/EventBus'

export class CollisionManager {
  private detectionZone!: Mesh
  private detectionBox: Box3 = new Box3()
  private detectionSound!: PositionalAudio
  private playerInZone: boolean = false
  private readonly scene: Scene
  private readonly audioListener: AudioListener

  constructor(scene: Scene, audioListener: AudioListener) {
    this.scene = scene
    this.audioListener = audioListener
    this.setupDetectionZone()
  }

  private setupDetectionZone(): void {
    const geometry = new BoxGeometry(5, 5, 5)
    const material = new MeshStandardMaterial({ color: 0x00ff00, wireframe: true })
    this.detectionZone = new Mesh(geometry, material)
    this.detectionZone.position.set(10, 2.5, -10)
    this.scene.add(this.detectionZone)

    this.detectionBox.setFromObject(this.detectionZone)

    this.detectionSound = new PositionalAudio(this.audioListener)
    const audioLoader = new AudioLoader()

    audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
      this.detectionSound.setBuffer(buffer)
      this.detectionSound.setRefDistance(20)
      this.detectionSound.setVolume(0.3)
    })
    this.detectionZone.add(this.detectionSound)
  }

  public handlePlayerCollisions(player: Player, enemies: Enemy[], oldPosition: Vector3): void {
    const playerPos = player.getPosition()
    const playerRadius = player.getRadius()
    const playerSphere = new Sphere(playerPos, playerRadius)

    for (const enemy of enemies) {
      if (!enemy.isCollidable()) continue
      
      const enemyBox = enemy.getBoundingBox()
      
      if (enemyBox.intersectsSphere(playerSphere)) {
        const closestPoint = new Vector3()
        enemyBox.clampPoint(playerPos, closestPoint)
        
        const direction = new Vector3().subVectors(playerPos, closestPoint)
        const distance = direction.length()
        
        if (distance < playerRadius) {
          if (distance === 0) {
            playerPos.copy(oldPosition)
          } else {
            const overlap = playerRadius - distance
            direction.normalize().multiplyScalar(overlap)
            playerPos.add(direction)
          }
        }
      }
    }
  }

  public handleProjectileCollisions(projectiles: Projectile[], enemies: Enemy[]): void {
    for (const p of projectiles) {
      for (const enemy of enemies) {
        if (enemy.checkCollision(p.getPosition())) {
          enemy.hit()
          eventBus.emit('ENEMY_KILLED')
          p.deactivate()
          break
        }
      }
    }
  }

  public updateDetectionZone(playerPos: Vector3, projectiles: Projectile[]): void {
    let triggered = false
    if (this.detectionBox.containsPoint(playerPos)) {
      triggered = true
    }

    if (!triggered) {
      for (const p of projectiles) {
        if (this.detectionBox.containsPoint(p.getPosition())) {
          triggered = true
          break
        }
      }
    }

    if (triggered) {
      if (!this.playerInZone) {
        this.playerInZone = true
        if (this.detectionSound.isPlaying) this.detectionSound.stop()
        if (this.detectionSound.buffer) this.detectionSound.play()
      }
    } else {
      this.playerInZone = false
    }
  }
}
