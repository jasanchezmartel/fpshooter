import {
  Mesh,
  MeshStandardMaterial,
  Scene,
  Vector3,
  PositionalAudio,
  AudioListener,
  AudioLoader,
  Box3,
  BufferGeometry,
} from 'three'
import hitSoundUrl from '../assets/hit.wav'
import { eventBus } from '../core/EventBus'

export class Enemy {
  private mesh: Mesh
  private scene: Scene
  private isDead: boolean = false
  private respawnTimer: number = 0
  private blinkTimer: number = 0
  private sound: PositionalAudio
  private spawnSound: PositionalAudio
  private boundingBox: Box3 = new Box3()

  constructor(scene: Scene, geometry: BufferGeometry, position: Vector3, listener: AudioListener) {
    this.scene = scene

    const material = new MeshStandardMaterial({ color: 0xff0000 })
    material.color.setHSL(Math.random(), 0.8, 0.5)
    this.mesh = new Mesh(geometry, material)
    this.mesh.position.copy(position)
    this.scene.add(this.mesh)

    // Setup sound
    this.sound = new PositionalAudio(listener)
    this.spawnSound = new PositionalAudio(listener)
    const audioLoader = new AudioLoader()

    // Hit sound using local asset
    audioLoader.load(hitSoundUrl, (buffer) => {
      this.sound.setBuffer(buffer)
      this.sound.setRefDistance(5)
      this.sound.setRolloffFactor(1)
      this.sound.setDistanceModel('inverse')
      this.sound.setVolume(0.15)
    })

    // Spawn sound
    audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
      this.spawnSound.setBuffer(buffer)
      this.spawnSound.setRefDistance(10)
      this.spawnSound.setRolloffFactor(2.0)
      this.spawnSound.setDistanceModel('inverse')
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
      this.mesh.visible = Math.floor(this.blinkTimer * 25) % 2 === 0

      if (this.blinkTimer <= 0) {
        this.mesh.visible = false
        this.isDead = true
        this.respawnTimer = 3
      }
    }
    if (!this.isDead) {
      this.boundingBox.setFromObject(this.mesh)
    }
  }

  public isCollidable(): boolean {
    return !this.isDead && this.blinkTimer <= 0
  }

  public getBoundingBox(): Box3 {
    return this.boundingBox
  }

  public checkCollision(projectilePosition: Vector3): boolean {
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
    this.mesh.visible = true

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

  public getPosition(): Vector3 {
    return this.mesh.position
  }
}
