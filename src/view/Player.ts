import { Euler, Vector3 } from "three";
import { InputManager } from "../controller/InputManager";

export class Player {
    private readonly position: Vector3;
    private readonly input: InputManager;
    private readonly moveSpeed: number = 5.0;
    private readonly height: number = 1.6;
    private canShoot: boolean = true;
    private canShootSecondary: boolean = true;
    private readonly shootCooldown: number = 0.2;
    private readonly secondaryShootCooldown: number = 0.05; // High frequency

    constructor(input: InputManager) {
        this.input = input;
        this.position = new Vector3(0, this.height, 0);
    }

    public update(delta: number, currentYaw: number): void {
        const direction = new Vector3();

        if (this.input.isKeyPressed('KeyW')) direction.z -= 1;
        if (this.input.isKeyPressed('KeyS')) direction.z += 1;
        if (this.input.isKeyPressed('KeyA')) direction.x -= 1;
        if (this.input.isKeyPressed('KeyD')) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
            
            const moveVector = direction.clone();
            const eulerYaw = new Euler(0, currentYaw, 0, 'YXZ');
            moveVector.applyEuler(eulerYaw);
            
            // Lógica de Sprint: multiplicamos la velocidad si se pulsa Shift
            const isSprinting = this.input.isKeyPressed('ShiftLeft') || this.input.isKeyPressed('ShiftRight');
            const currentSpeed = isSprinting ? this.moveSpeed * 1.8 : this.moveSpeed;

            this.position.addScaledVector(moveVector, currentSpeed * delta);
        }

        this.position.y = this.height;
    }

    public tryShoot(): boolean {
        if (this.input.isMousePressed(0) && this.canShoot) {
            this.canShoot = false;
            setTimeout(() => { this.canShoot = true; }, this.shootCooldown * 1000);
            return true;
        }
        return false;
    }

    public tryShootSecondary(): boolean {
        if (this.input.isMousePressed(2) && this.canShootSecondary) {
            this.canShootSecondary = false;
            setTimeout(() => { this.canShootSecondary = true; }, this.secondaryShootCooldown * 1000);
            return true;
        }
        return false;
    }

    public getPosition(): Vector3 {
        return this.position;
    }
}