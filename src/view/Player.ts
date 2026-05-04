import { Vector3 } from 'three'
import { InputManager } from '../controller/InputManager'

export class Player {
  private readonly position: Vector3
  private readonly input: InputManager
  private readonly moveSpeed: number = 5.0
  private readonly height: number = 1.6
  private canShoot: boolean = true
  private canShootSecondary: boolean = true
  private readonly shootCooldown: number = 0.2
  private readonly secondaryShootCooldown: number = 0.05
  private readonly radius: number = 0.5

  // Cache de vectores para evitar el recolector de basura (GC)
  private readonly moveDirection: Vector3 = new Vector3()
  private readonly UP_AXIS: Vector3 = new Vector3(0, 1, 0)

  constructor(input: InputManager) {
    this.input = input
    this.position = new Vector3(0, this.height, 0)
  }

  public update(delta: number, currentYaw: number): void {
    this.moveDirection.set(0, 0, 0)

    if (this.input.isKeyPressed('KeyW')) this.moveDirection.z -= 1
    if (this.input.isKeyPressed('KeyS')) this.moveDirection.z += 1
    if (this.input.isKeyPressed('KeyA')) this.moveDirection.x -= 1
    if (this.input.isKeyPressed('KeyD')) this.moveDirection.x += 1

    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize()

      // Rotar la dirección del movimiento según el giro de la cámara (Yaw)
      this.moveDirection.applyAxisAngle(this.UP_AXIS, currentYaw)

      // Lógica de Sprint
      const isSprinting =
        this.input.isKeyPressed('ShiftLeft') || this.input.isKeyPressed('ShiftRight')
      const currentSpeed = isSprinting ? this.moveSpeed * 1.8 : this.moveSpeed

      this.position.addScaledVector(this.moveDirection, currentSpeed * delta)
    }

    this.position.y = this.height
  }

  public tryShoot(): boolean {
    if (this.input.isMousePressed(0) && this.canShoot) {
      this.canShoot = false
      setTimeout(() => {
        this.canShoot = true
      }, this.shootCooldown * 1000)
      return true
    }
    return false
  }

  public tryShootSecondary(): boolean {
    if (this.input.isMousePressed(2) && this.canShootSecondary) {
      this.canShootSecondary = false
      setTimeout(() => {
        this.canShootSecondary = true
      }, this.secondaryShootCooldown * 1000)
      return true
    }
    return false
  }

  public getPosition(): Vector3 {
    return this.position
  }

  public setPosition(newPos: Vector3): void {
    this.position.copy(newPos)
  }

  public getRadius(): number {
    return this.radius
  }
}
