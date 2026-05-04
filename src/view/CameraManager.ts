import {
  PerspectiveCamera,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Vector3,
  Object3D,
} from 'three'

export class CameraManager {
  private readonly camera: PerspectiveCamera
  private readonly domElement: HTMLElement

  // Jerarquía estable: yawObject (giro H) -> pitchObject (giro V) -> camera
  private readonly yawObject: Object3D = new Object3D()
  private readonly pitchObject: Object3D = new Object3D()

  private locked: boolean = false
  private readonly sensitivity: number = 0.002

  private pitch: number = 0
  private yaw: number = 0

  // Acumuladores para sincronización perfecta con el render loop
  private mouseDeltaX: number = 0
  private mouseDeltaY: number = 0

  private readonly weaponMesh: Mesh

  constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.domElement = domElement

    // Construir jerarquía
    this.yawObject.add(this.pitchObject)
    this.pitchObject.add(this.camera)

    // Arma (Placeholder)
    this.weaponMesh = new Mesh(
      new BoxGeometry(0.1, 0.1, 0.5),
      new MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 })
    )
    this.weaponMesh.position.set(0.3, -0.25, -0.4)
    this.camera.add(this.weaponMesh)
  }

  public init(): void {
    // Un solo punto de entrada para el bloqueo
    this.domElement.addEventListener('click', () => this.lock())

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.domElement
    })

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return

      // Filtro de seguridad para evitar saltos bruscos al entrar/salir de la ventana
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

    // Aplicar rotación
    this.yaw -= this.mouseDeltaX * this.sensitivity
    this.pitch -= this.mouseDeltaY * this.sensitivity

    // Limitar rotación vertical (aprox 87 grados para evitar "flipping")
    const limit = Math.PI / 2 - 0.05
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch))

    // Resetear acumuladores DESPUÉS de aplicar para el siguiente frame
    this.mouseDeltaX = 0
    this.mouseDeltaY = 0

    // Aplicar a los objetos de la jerarquía
    this.yawObject.rotation.y = this.yaw
    this.pitchObject.rotation.x = this.pitch
  }

  public updatePosition(position: Vector3): void {
    this.yawObject.position.copy(position)
  }

  public lock(): void {
    if (this.locked) return

    // Intentar bloqueo con "unadjustedMovement" para desactivar la aceleración del SO
    const options = { unadjustedMovement: true }
    const promise = (this.domElement as any).requestPointerLock(options)

    // Fallback para navegadores que no soportan opciones o devuelven promesas
    if (promise && (promise as any).catch) {
      ;(promise as any).catch(() => this.domElement.requestPointerLock())
    }

    // Opcional: Reanudar AudioContext si es necesario
    const audioContext = (window as any).THREE_AUDIO_CONTEXT || (window as any).AudioContext
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume()
    }
  }

  public unlock(): void {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock()
    }
  }

  // Getters simplificados
  public getYaw = () => this.yaw
  public getCamera = () => this.camera
  public getHierarchyRoot = () => this.yawObject
  public getWeaponMesh = () => this.weaponMesh
  public isLocked = () => this.locked

  public getForwardVector(): Vector3 {
    return this.camera.getWorldDirection(new Vector3())
  }
}
