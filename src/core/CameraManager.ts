import { PerspectiveCamera, Euler, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from 'three';

export class CameraManager {
    private readonly camera: PerspectiveCamera
    private readonly domElement: HTMLElement
    private readonly euler: Euler
    private pitch: number = 0
    private yaw: number = 0
    private locked: boolean = false
    private readonly sensitivity: number = 0.002
    private readonly weaponMesh: Mesh
    
    constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera
        this.domElement = domElement
        this.euler = new Euler(0, 0, 0, 'YXZ')

        const weaponGeom = new BoxGeometry(0.1, 0.1, 0.5)
        const weaponMat = new MeshStandardMaterial({ color: 0x444444 })
        this.weaponMesh = new Mesh(weaponGeom, weaponMat)
        this.weaponMesh.position.set(0.25, -0.2, -0.4)
        this.camera.add(this.weaponMesh)
    }

    public init(): void {
        this.domElement.addEventListener('click', () => {
            if (!this.locked) {
                this.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.domElement;
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            this.onMouseMove(event);
        });
    }

    private onMouseMove(event: MouseEvent): void {
        if (!this.locked) return

        this.yaw -= event.movementX * this.sensitivity
        this.pitch -= event.movementY * this.sensitivity

        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))

        this.euler.set(this.pitch, this.yaw, 0, 'YXZ')
        this.camera.quaternion.setFromEuler(this.euler)
    }

    public updatePosition(position: Vector3): void {
        this.camera.position.copy(position);
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public getYaw(): number {
        return this.yaw;
    }

    public getCamera(): PerspectiveCamera {
        return this.camera;
    }

    public getForwardVector(): Vector3 {
        const forward = new Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        return forward;
    }

    public getWeaponMesh(): Mesh {
        return this.weaponMesh;
    }
}