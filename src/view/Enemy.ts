import {
  Mesh,
  MeshStandardMaterial,
  PositionalAudio,
  AudioListener,
  AudioLoader,
  BufferGeometry,
} from 'three'
import hitSoundUrl from '../assets/hit.wav'
import { eventBus } from '../core/EventBus'
import { Vec3, Box3 } from '../core/Math'

export class Enemy {
  public mesh: Mesh
  private isDead: boolean = false
  private respawnTimer: number = 0
  private blinkTimer: number = 0
  private sound: PositionalAudio
  private spawnSound: PositionalAudio
  private boundingBox: Box3 = new Box3()
  public color: [number, number, number, number] = [1, 0, 0, 1]
  public scale: Vec3 = new Vec3(1, 2, 1)
  public isVisible: boolean = true
  public geometryType: 'cube' | 'sphere' = 'cube'

  constructor(_unusedScene: any, geometry: BufferGeometry, position: Vec3, listener: AudioListener) {
    const hue = Math.random()
    this.color = [hue, 0.5, 0.5, 1.0] 
    const material = new MeshStandardMaterial({ color: 0xff0000 })
    material.color.setHSL(Math.random(), 0.8, 0.5)
    this.mesh = new Mesh(geometry, material)
    this.mesh.position.copy(position as any)

    this.sound = new PositionalAudio(listener)
    this.spawnSound = new PositionalAudio(listener)
    const audioLoader = new AudioLoader()

    audioLoader.load(hitSoundUrl, (buffer) => {
      this.sound.setBuffer(buffer)
      this.sound.setRefDistance(5)
      this.sound.setVolume(0.15)
    })

    audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
      this.spawnSound.setBuffer(buffer)
      this.spawnSound.setRefDistance(10)
      this.spawnSound.setVolume(0.4)
    })

    this.mesh.add(this.sound)
    this.mesh.add(this.spawnSound)

    eventBus.emit('ENEMY_SPAWNED')
  }

  public update(delta: number): void {
    if (this.isDead) {
      this.respawnTimer -= delta
      if (this.respawnTimer <= 0) {
        this.respawn()
      }
      return
    }

    if (this.blinkTimer > 0) {
      this.blinkTimer -= delta
      this.isVisible = Math.floor(this.blinkTimer * 25) % 2 === 0

      if (this.blinkTimer <= 0) {
        this.isVisible = false
        this.isDead = true
        this.respawnTimer = 3
      }
    }
    if (!this.isDead) {
      const p = this.mesh.position
      this.boundingBox.min.set(p.x - 0.5, p.y - 1, p.z - 0.5)
      this.boundingBox.max.set(p.x + 0.5, p.y + 1, p.z + 0.5)
    }
  }

  public isCollidable(): boolean {
    return !this.isDead && this.blinkTimer <= 0
  }

  public getBoundingBox(): Box3 {
    return this.boundingBox
  }

  public checkCollision(projectilePosition: Vec3): boolean {
    if (!this.isCollidable()) return false
    return this.boundingBox.containsPoint(projectilePosition)
  }

  public hit(): void {
    if (this.isDead || this.blinkTimer > 0) return

    if (this.sound.buffer) {
      if (this.sound.isPlaying) this.sound.stop()
      this.sound.play()
    }

    this.blinkTimer = 0.6
  }

  private respawn(): void {
    this.isDead = false
    this.isVisible = true

    const range = 40
    this.mesh.position.set((Math.random() - 0.5) * range * 2, 1, (Math.random() - 0.5) * range * 2)

    const hue = Math.random()
    const material = this.mesh.material as MeshStandardMaterial
    material.color.setHSL(hue, 0.8, 0.5)

    this.respawnTimer = 0
    this.blinkTimer = 0

    if (this.spawnSound.buffer) {
      if (this.spawnSound.isPlaying) this.spawnSound.stop()
      this.spawnSound.play()
    }

    eventBus.emit('ENEMY_SPAWNED')
  }

  public getPosition(): Vec3 {
    return this.mesh.position as any
  }
}
