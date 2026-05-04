import { PositionalAudio, AudioListener, AudioLoader } from 'three'
import { Player } from '../view/Player'
import { Enemy } from '../view/Enemy'
import { Projectile } from '../view/Projectile'
import { eventBus } from '../core/EventBus'
import { Vec3, Box3, Sphere } from '../core/Math'

export class CollisionManager {
  private detectionBox: Box3 = new Box3()
  private detectionSound!: PositionalAudio
  private playerInZone: boolean = false
  private readonly audioListener: AudioListener

  constructor(_unusedScene: any, audioListener: AudioListener) {
    this.audioListener = audioListener
    this.setupDetectionZone()
  }

  private setupDetectionZone(): void {
    // Definir la zona de detección puramente lógica con Box3
    this.detectionBox.min.set(7.5, 0, -12.5)
    this.detectionBox.max.set(12.5, 5, -7.5)

    this.detectionSound = new PositionalAudio(this.audioListener)
    const audioLoader = new AudioLoader()

    audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
      this.detectionSound.setBuffer(buffer)
      this.detectionSound.setRefDistance(20)
      this.detectionSound.setVolume(0.3)
    })
  }

  public handlePlayerCollisions(player: Player, enemies: Enemy[], oldPosition: Vec3): void {
    const playerPos = player.getPosition()
    const playerRadius = player.getRadius()
    const playerSphere = new Sphere(playerPos, playerRadius)

    for (const enemy of enemies) {
      if (!enemy.isCollidable()) continue
      
      const enemyBox = enemy.getBoundingBox()
      
      if (enemyBox.intersectsSphere(playerSphere)) {
        const closestPoint = new Vec3()
        enemyBox.clampPoint(playerPos, closestPoint)
        
        const direction = playerPos.sub(closestPoint)
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

  public updateDetectionZone(playerPos: Vec3, projectiles: Projectile[]): void {
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
