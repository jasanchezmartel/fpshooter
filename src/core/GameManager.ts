import { Engine } from './Engine';
import { CameraManager } from './CameraManager';
import { InputManager } from './InputManager';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { UIManager } from '../ui/UIManager';
import { Scene, Mesh, BoxGeometry, MeshStandardMaterial, PositionalAudio, AudioListener, AudioLoader, Vector3 } from 'three';

export class GameManager {
    private engine: Engine;
    private cameraManager!: CameraManager;
    private inputManager: InputManager;
    private player: Player;
    private uiManager: UIManager;
    private projectiles: Projectile[] = [];
    private scene!: Scene;
    private container: HTMLElement;

    // Detection zone
    private detectionZone!: Mesh;
    private sound!: PositionalAudio;
    private playerInZone: boolean = false;

    constructor(container: HTMLElement, uiManager: UIManager) {
        this.engine = new Engine(container);
        this.uiManager = uiManager;
        
        this.inputManager = new InputManager();
        this.player = new Player(this.inputManager);
        this.container = container;
    }

    public init(): void {
        this.engine.init();
        this.inputManager.init();
        
        this.scene = this.engine.getScene();
        
        this.cameraManager = new CameraManager(this.engine.getCamera(), this.container);
        this.cameraManager.init();
        
        this.engine.setAnimationLoopCallback((delta: number) => this.update(delta));
        
        this.setupDetectionZone();
    }

    private setupDetectionZone(): void {
        const geometry = new BoxGeometry(5, 5, 5);
        const material = new MeshStandardMaterial({ color: 0x00ff00, wireframe: true });
        this.detectionZone = new Mesh(geometry, material);
        this.detectionZone.position.set(10, 2.5, -10);
        this.scene.add(this.detectionZone);

        // Setup audio
        const listener = new AudioListener();
        this.engine.getCamera().add(listener);

        this.sound = new PositionalAudio(listener);
        const audioLoader = new AudioLoader();
        
        audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(20);
        });
        this.detectionZone.add(this.sound);
    }

    private update(delta: number): void {
        // Update player position
        const yaw = this.cameraManager.getYaw();
        this.player.update(delta, yaw);
        
        this.cameraManager.updatePosition(this.player.getPosition());

        if (this.player.tryShoot() && this.cameraManager.isLocked()) {
            this.shoot();
        }

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => !p.update(delta));

        this.checkDetectionZone();
    }

    private shoot(): void {
        const position = new Vector3();
        this.cameraManager.getWeaponMesh().getWorldPosition(position);
        
        const direction = this.cameraManager.getForwardVector();
        
        const projectile = new Projectile(this.scene, position, direction);
        this.projectiles.push(projectile);
        
        this.uiManager.onPlayerShoot();
    }

    private checkDetectionZone(): void {
        if (!this.detectionZone || !this.sound) return;

        let triggered = false;

        // Check if player is in zone
        const playerDistance = this.player.getPosition().distanceTo(this.detectionZone.position);
        if (playerDistance < 3) {
            triggered = true;
        }

        // Check if any projectile is in zone
        if (!triggered) {
            for (const p of this.projectiles) {
                if (p.getPosition().distanceTo(this.detectionZone.position) < 3) {
                    triggered = true;
                    break;
                }
            }
        }

        if (triggered) {
            if (!this.playerInZone) {
                this.playerInZone = true;
                if (this.sound.isPlaying) {
                    this.sound.stop();
                }
                if (this.sound.buffer) {
                    this.sound.play();
                }
            }
        } else {
            this.playerInZone = false;
        }
    }
}
