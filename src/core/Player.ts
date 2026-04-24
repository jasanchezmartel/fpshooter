import { Euler, Vector3 } from "three";
import { InputManager } from "./InputManager";

export class Player {
    private readonly position: Vector3;
    private readonly input: InputManager;
    private readonly moveSpeed: number = 5.0;
    private readonly height: number = 1.6;
    private canShoot: boolean = true;
    private shootCooldown: number = 0.2;

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
            
            this.position.addScaledVector(moveVector, this.moveSpeed * delta);
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

    public getPosition(): Vector3 {
        return this.position;
    }
}