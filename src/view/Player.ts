import { Vec3 } from '../core/Math'
import { InputManager } from '../controller/InputManager'

export class Player {
  private readonly position: Vec3
  private readonly input: InputManager
  private readonly moveSpeed: number = 5.0
  private readonly height: number = 1.7
  private canShoot: boolean = true
  private canShootSecondary: boolean = true
  private readonly shootCooldown: number = 0.2
  private readonly secondaryShootCooldown: number = 0.05
  private readonly radius: number = 0.5

  private readonly moveDirection: Vec3 = new Vec3()

  constructor(input: InputManager) {
    this.input = input
    this.position = new Vec3(0, this.height, 0)
  }

  public update(delta: number, currentYaw: number): void {
    this.moveDirection.set(0, 0, 0)

    if (this.input.isKeyPressed('KeyW')) this.moveDirection.z -= 1
    if (this.input.isKeyPressed('KeyS')) this.moveDirection.z += 1
    if (this.input.isKeyPressed('KeyA')) this.moveDirection.x -= 1
    if (this.input.isKeyPressed('KeyD')) this.moveDirection.x += 1

    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize()

      // En nuestro sistema, el Yaw es positivo a la derecha. 
      // Para rotar el vector de movimiento correctamente:
      const angle = currentYaw 
      const nx = this.moveDirection.x * Math.cos(angle) - this.moveDirection.z * Math.sin(angle)
      const nz = this.moveDirection.x * Math.sin(angle) + this.moveDirection.z * Math.cos(angle)
      
      this.moveDirection.x = nx
      this.moveDirection.z = nz

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

  public getPosition(): Vec3 {
    return this.position
  }

  public setPosition(newPos: Vec3): void {
    this.position.copy(newPos)
  }

  public getRadius(): number {
    return this.radius
  }
}
