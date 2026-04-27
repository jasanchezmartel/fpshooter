import { Mesh, MeshStandardMaterial, Scene, SphereGeometry, Vector3 } from 'three';

export class Projectile {
    private readonly scene: Scene
    private readonly mesh: Mesh
    private readonly velocity: Vector3
    private readonly gravity: number = 9.8
    private readonly initialSpeed: number = 20.0
    private readonly maxDistance: number = 200
    private lifeTime: number = 0
    private readonly useGravity: boolean

    constructor(scene: Scene, position: Vector3, direction: Vector3, useGravity: boolean = true) {
        this.scene = scene
        this.useGravity = useGravity

        const geometry = new SphereGeometry(0.1, 8, 8)
        const material = new MeshStandardMaterial({ color: 0xffaa00 })
        this.mesh = new Mesh(geometry, material)
        this.mesh.position.copy(position)
        
        this.scene.add(this.mesh)

        this.velocity = direction.clone().normalize().multiplyScalar(this.initialSpeed)
    }

    public update(delta: number): boolean {
        this.lifeTime += delta

        if (this.useGravity) {
            this.velocity.y -= this.gravity * delta
        }

        this.mesh.position.addScaledVector(this.velocity, delta)

        if (this.mesh.position.y <= 0) {
            this.destroy()
            return true
        }

        if (this.lifeTime > 5 || this.mesh.position.length() > this.maxDistance) {
            this.destroy()
            return true
        }

        return false
    }

    public getPosition(): Vector3 {
        return this.mesh.position;
    }

    public destroy(): void {
        this.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach(m => m.dispose())
        } else {
            this.mesh.material.dispose()
        }
    }
}