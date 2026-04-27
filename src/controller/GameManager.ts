import { Engine } from '../view/Engine';
import { CameraManager } from '../view/CameraManager';
import { InputManager } from './InputManager';
import { Player } from '../view/Player';
import { Projectile } from '../view/Projectile';
import { Enemy } from '../view/Enemy';
import { UIManager } from '../view/UIManager';
import { GameModel, GameStatus } from '../model/GameModel';
import { Scene, Mesh, BoxGeometry, MeshStandardMaterial, PositionalAudio, AudioListener, AudioLoader, Vector3, Audio, Box3 } from 'three';
import shootSoundUrl from '../assets/CD_01277.wav';

export class GameManager {
    private engine: Engine;
    private cameraManager!: CameraManager;
    private inputManager: InputManager;
    private player: Player;
    private uiManager: UIManager;
    private model: GameModel;
    
    private projectiles: Projectile[] = [];
    private enemies: Enemy[] = [];
    private scene!: Scene;
    private audioListener!: AudioListener;
    private container: HTMLElement;

    // Detection zone logic
    private detectionZone!: Mesh;
    private detectionBox: Box3 = new Box3();
    private sound!: PositionalAudio;
    private playerInZone: boolean = false;
    private shootSound!: Audio;

    constructor(container: HTMLElement, uiManager: UIManager) {
        this.model = new GameModel();
        this.uiManager = uiManager;
        this.container = container;
        
        this.engine = new Engine(container);
        this.inputManager = new InputManager();
        this.player = new Player(this.inputManager);
    }

    public init(): void {
        this.engine.init();
        this.inputManager.init();
        this.uiManager.init(this.model);
        
        this.scene = this.engine.getScene();
        this.cameraManager = new CameraManager(this.engine.getCamera(), this.container);
        this.cameraManager.init();
        
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());

        this.scene.remove(this.engine.getCamera());
        this.scene.add(this.cameraManager.getHierarchyRoot());
        
        this.audioListener = new AudioListener();
        this.engine.getCamera().add(this.audioListener);

        // Reaccionar al estado de silencio
        this.model.subscribe((state) => {
            if (this.audioListener) {
                this.audioListener.setMasterVolume(state.isMuted ? 0 : 1);
            }
        });

        this.shootSound = new Audio(this.audioListener);
        const audioLoader = new AudioLoader();
        audioLoader.load(shootSoundUrl, (buffer) => {
            this.shootSound.setBuffer(buffer);
            this.shootSound.setVolume(0.2);
        });

        this.engine.setAnimationLoopCallback((delta: number) => this.update(delta));
        
        this.setupDetectionZone();
        this.spawnEnemies();
    }

    private spawnEnemies(): void {
        const numEnemies = 7;
        const range = 40;

        for (let i = 0; i < numEnemies; i++) {
            const randomPos = new Vector3(
                (Math.random() - 0.5) * range * 2,
                1,
                (Math.random() - 0.5) * range * 2
            );
            const enemy = new Enemy(
                this.scene, 
                randomPos, 
                this.audioListener, 
                () => this.uiManager.onEnemySpawn()
            );
            this.enemies.push(enemy);
        }
    }

    private setupDetectionZone(): void {
        const geometry = new BoxGeometry(5, 5, 5);
        const material = new MeshStandardMaterial({ color: 0x00ff00, wireframe: true });
        this.detectionZone = new Mesh(geometry, material);
        this.detectionZone.position.set(10, 2.5, -10);
        this.scene.add(this.detectionZone);

        this.detectionBox.setFromObject(this.detectionZone);

        this.sound = new PositionalAudio(this.audioListener);
        const audioLoader = new AudioLoader();
        
        audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(20);
            this.sound.setVolume(0.3);
        });
        this.detectionZone.add(this.sound);
    }

    private lastPauseKeyTime: number = 0;

    private update(delta: number): void {
        // Manejar Menú Tab (se muestra mientras se pulsa)
        this.model.setTabMenuOpen(this.inputManager.isKeyPressed('Tab'));

        // Manejar Pausa (alternar con P)
        const now = Date.now();
        if (this.inputManager.isKeyPressed('KeyP') && now - this.lastPauseKeyTime > 300) {
            const currentStatus = this.model.getState().status;
            const newStatus = currentStatus === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING;
            this.model.setStatus(newStatus);
            this.lastPauseKeyTime = now;

            if (newStatus === GameStatus.PAUSED) {
                this.cameraManager.unlock();
            } else {
                this.cameraManager.lock();
            }
        }

        // Si está pausado, no actualizamos la lógica del juego
        if (this.model.getState().status === GameStatus.PAUSED) {
            return;
        }

        this.cameraManager.update(delta);

        const yaw = this.cameraManager.getYaw();
        this.player.update(delta, yaw);
        
        this.model.setPlayerPosition(this.player.getPosition());
        this.cameraManager.updatePosition(this.player.getPosition());

        if (this.cameraManager.isLocked()) {
            if (this.player.tryShoot()) {
                this.shoot(true);
            }
            if (this.player.tryShootSecondary()) {
                this.shoot(false);
            }
        }

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => {
            const isDestroyed = p.update(delta);
            if (isDestroyed) return false;

            for (const enemy of this.enemies) {
                if (enemy.checkCollision(p.getPosition())) {
                    enemy.hit();
                    this.model.incrementKills();
                    p.destroy();
                    return false;
                }
            }
            return true;
        });

        this.enemies.forEach(e => e.update(delta));
        this.checkDetectionZone();
    }

    private shoot(useGravity: boolean): void {
        const position = new Vector3();
        this.cameraManager.getWeaponMesh().getWorldPosition(position);
        
        const direction = this.cameraManager.getForwardVector();
        
        const projectile = new Projectile(this.scene, position, direction, useGravity);
        this.projectiles.push(projectile);
        
        if (this.shootSound.buffer) {
            if (this.shootSound.isPlaying) this.shootSound.stop();
            this.shootSound.play();
        }

        // Notificar al modelo del disparo
        this.model.incrementShots();
    }

    private checkDetectionZone(): void {
        if (!this.detectionZone || !this.sound) return;

        let triggered = false;
        if (this.detectionBox.containsPoint(this.player.getPosition())) {
            triggered = true;
        }

        if (!triggered) {
            for (const p of this.projectiles) {
                if (this.detectionBox.containsPoint(p.getPosition())) {
                    triggered = true;
                    break;
                }
            }
        }

        if (triggered) {
            if (!this.playerInZone) {
                this.playerInZone = true;
                if (this.sound.isPlaying) this.sound.stop();
                if (this.sound.buffer) this.sound.play();
            }
        } else {
            this.playerInZone = false;
        }
    }
}
