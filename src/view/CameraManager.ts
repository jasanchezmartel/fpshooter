import { Vec3, Mat4 } from '../core/Math'

export class CameraManager {
  private readonly domElement: HTMLElement
  private position: Vec3 = new Vec3(0, 1.6, 0)
  private locked: boolean = false
  private readonly sensitivity: number = 0.002

  private pitch: number = 0
  private yaw: number = 0

  private mouseDeltaX: number = 0
  private mouseDeltaY: number = 0

  constructor(domElement: HTMLElement) {
    this.domElement = domElement
  }

  public init(): void {
    this.domElement.addEventListener('click', () => this.lock())

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.domElement
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return
      if (Math.abs(e.movementX) > 500 || Math.abs(e.movementY) > 500) return

      this.mouseDeltaX += e.movementX
      this.mouseDeltaY += e.movementY
    })
  }

  public update(_delta: number): void {
    if (!this.locked) {
      this.mouseDeltaX = 0
      this.mouseDeltaY = 0
      return
    }

    // Rotación natural corregida
    this.yaw += this.mouseDeltaX * this.sensitivity
    this.pitch -= this.mouseDeltaY * this.sensitivity

    const limit = Math.PI / 2 - 0.05
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch))

    this.mouseDeltaX = 0
    this.mouseDeltaY = 0
  }

  public updatePosition(newPos: Vec3): void {
    this.position.copy(newPos)
  }

  public lock(): void {
    if (this.locked) return
    const options = { unadjustedMovement: true }
    ;(this.domElement as any).requestPointerLock(options).catch(() => {
        this.domElement.requestPointerLock()
    })
  }

  public unlock(): void {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock()
    }
  }

  public getYaw = () => this.yaw
  public getPitch = () => this.pitch
  public getPosition = () => this.position
  public isLocked = () => this.locked
  
  public getForwardVector(): Vec3 {
    const x = Math.sin(this.yaw) * Math.cos(this.pitch)
    const y = Math.sin(this.pitch)
    const z = Math.cos(this.yaw) * Math.cos(this.pitch)
    return new Vec3(x, y, -z).normalize()
  }

  public getViewMatrix(): Mat4 {
    const forward = this.getForwardVector()
    const target = new Vec3().copy(this.position).add(forward)
    return Mat4.lookAt(this.position, target, new Vec3(0, 1, 0))
  }
}
