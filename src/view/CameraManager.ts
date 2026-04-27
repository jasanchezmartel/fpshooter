import { PerspectiveCamera, Mesh, BoxGeometry, MeshStandardMaterial, Vector3, Object3D, Quaternion } from 'three';

export class CameraManager {
    private readonly camera: PerspectiveCamera;
    private readonly domElement: HTMLElement;
    
    // Hierarchy for stable rotation
    private readonly yawObject: Object3D;
    private readonly pitchObject: Object3D;
    
    private locked: boolean = false;
    private readonly sensitivity: number = 0.002;
    
    // State
    private pitch: number = 0;
    private yaw: number = 0;
    
    // Accumulators for perfect frame synchronization
    private mouseDeltaX: number = 0;
    private mouseDeltaY: number = 0;
    
    private readonly weaponMesh: Mesh;

    constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Create the hierarchy: yawObject -> pitchObject -> camera
        this.yawObject = new Object3D();
        this.pitchObject = new Object3D();
        
        this.yawObject.add(this.pitchObject);
        this.pitchObject.add(this.camera);

        // Weapon mesh initialization
        const weaponGeom = new BoxGeometry(0.1, 0.1, 0.5);
        const weaponMat = new MeshStandardMaterial({ 
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.8
        });
        this.weaponMesh = new Mesh(weaponGeom, weaponMat);
        this.weaponMesh.position.set(0.3, -0.25, -0.4);
        this.camera.add(this.weaponMesh);
    }

    public init(): void {
        this.domElement.addEventListener('click', () => {
            if (!this.locked) {
                // Request unadjustedMovement (raw input) - fixes Windows stuttering
                const promise = (this.domElement as any).requestPointerLock({
                    unadjustedMovement: true,
                });

                if (promise && (promise as any).catch) {
                    (promise as any).catch(() => {
                        this.domElement.requestPointerLock();
                    });
                }

                // Explicitly resume AudioContext to ensure sound works on all browsers
                const audioContext = (window as any).THREE_AUDIO_CONTEXT || (window as any).AudioContext || (window as any).webkitAudioContext;
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.domElement;
        });

        document.addEventListener('mousemove', (event: MouseEvent) => {
            if (!this.locked) return;

            const dx = event.movementX || 0;
            const dy = event.movementY || 0;

            if (Math.abs(dx) > 500 || Math.abs(dy) > 500) return;

            this.mouseDeltaX += dx;
            this.mouseDeltaY += dy;
        });
    }

    public update(_delta: number): void {
        if (!this.locked) {
            this.mouseDeltaX = 0;
            this.mouseDeltaY = 0;
            return;
        }

        this.yaw -= this.mouseDeltaX * this.sensitivity;
        this.pitch -= this.mouseDeltaY * this.sensitivity;

        const PI_2 = Math.PI / 2;
        this.pitch = Math.max(-PI_2 + 0.05, Math.min(PI_2 - 0.05, this.pitch));

        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

        this.yawObject.rotation.y = this.yaw;
        this.pitchObject.rotation.x = this.pitch;
    }

    public updatePosition(position: Vector3): void {
        this.yawObject.position.copy(position);
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public unlock(): void {
        if (document.pointerLockElement === this.domElement) {
            document.exitPointerLock();
        }
    }

    public lock(): void {
        if (!this.locked) {
            const promise = (this.domElement as any).requestPointerLock({
                unadjustedMovement: true,
            });

            if (promise && (promise as any).catch) {
                (promise as any).catch(() => {
                    this.domElement.requestPointerLock();
                });
            }
        }
    }

    public getYaw(): number {
        return this.yaw;
    }

    public getCamera(): PerspectiveCamera {
        return this.camera;
    }

    public getHierarchyRoot(): Object3D {
        return this.yawObject;
    }

    public getForwardVector(): Vector3 {
        const forward = new Vector3(0, 0, -1);
        const worldQuat = new Quaternion();
        this.camera.getWorldQuaternion(worldQuat);
        forward.applyQuaternion(worldQuat);
        return forward;
    }

    public getWeaponMesh(): Mesh {
        return this.weaponMesh;
    }
}