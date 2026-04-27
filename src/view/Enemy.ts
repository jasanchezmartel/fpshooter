import { Mesh, BoxGeometry, MeshStandardMaterial, Scene, Vector3, PositionalAudio, AudioListener, AudioLoader, Box3 } from 'three';
import hitSoundUrl from '../assets/CD_01104.wav';

export class Enemy {
    private mesh: Mesh;
    private scene: Scene;
    private isDead: boolean = false;
    private respawnTimer: number = 0;
    private blinkTimer: number = 0;
    private originalPosition: Vector3;
    private sound: PositionalAudio;
    private spawnSound: PositionalAudio;
    private boundingBox: Box3 = new Box3();
    private onSpawnCallback?: () => void;

    constructor(scene: Scene, position: Vector3, listener: AudioListener, onSpawn?: () => void) {
        this.scene = scene;
        this.onSpawnCallback = onSpawn;
        this.originalPosition = position.clone();

        const geometry = new BoxGeometry(1, 2, 1);
        const material = new MeshStandardMaterial({ color: 0xff0000 });
        material.color.setHSL(Math.random(), 0.8, 0.5);
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        // Setup sound
        this.sound = new PositionalAudio(listener);
        this.spawnSound = new PositionalAudio(listener);
        const audioLoader = new AudioLoader();
        
        // Hit sound using local asset
        audioLoader.load(hitSoundUrl, (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setRefDistance(5); // Empieza a atenuarse a los 5m
            this.sound.setRolloffFactor(2.5); // Caída rápida y realista
            this.sound.setDistanceModel('inverse');
            this.sound.setVolume(0.15);
        }, undefined, (err) => {
            console.error("Error loading local hit sound:", err);
        });

        // Spawn sound
        audioLoader.load('https://threejs.org/examples/sounds/ping_pong.mp3', (buffer) => {
            this.spawnSound.setBuffer(buffer);
            this.spawnSound.setRefDistance(10); // Más alcance que el golpe pero con caída
            this.spawnSound.setRolloffFactor(2.0);
            this.spawnSound.setDistanceModel('inverse');
            this.spawnSound.setVolume(0.4);
            console.log("Enemy spawn sound loaded successfully");
        }, undefined, (err) => {
            console.error("Error loading enemy spawn sound:", err);
        });

        this.mesh.add(this.sound);
        this.mesh.add(this.spawnSound);
    }

    public update(delta: number): void {
        if (this.isDead) {
            this.respawnTimer -= delta;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        if (this.blinkTimer > 0) {
            this.blinkTimer -= delta;
            // Blink effect: toggle visibility
            this.mesh.visible = Math.floor(this.blinkTimer * 15) % 2 === 0;
            
            if (this.blinkTimer <= 0) {
                this.mesh.visible = false;
                this.isDead = true;
                this.respawnTimer = 3; // Respawn after 3 seconds
            }
        }
        
        // Update bounding box for collision detection
        if (this.mesh.visible) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    public checkCollision(projectilePosition: Vector3): boolean {
        if (this.isDead || this.blinkTimer > 0) return false;
        return this.boundingBox.containsPoint(projectilePosition);
    }

    public hit(): void {
        if (this.isDead || this.blinkTimer > 0) return;
        
        if (this.sound.buffer) {
            if (this.sound.isPlaying) this.sound.stop();
            this.sound.play();
        }
        
        this.blinkTimer = 0.6; // Blink for 0.6 seconds before disappearing
    }

    private respawn(): void {
        this.isDead = false;
        this.mesh.visible = true;
        
        // Random position within map bounds (assuming 100x100 floor)
        const range = 40; // Keep away from the very edges
        this.mesh.position.set(
            (Math.random() - 0.5) * range * 2,
            1, // Height above ground
            (Math.random() - 0.5) * range * 2
        );
        
        // Change to random rainbow color
        const hue = Math.random(); // 0 to 1
        const material = this.mesh.material as MeshStandardMaterial;
        material.color.setHSL(hue, 0.8, 0.5);
        
        this.respawnTimer = 0;
        this.blinkTimer = 0;

        // Play spawn sound
        if (this.spawnSound.buffer) {
            console.log("Playing respawn sound at", this.mesh.position);
            if (this.spawnSound.isPlaying) this.spawnSound.stop();
            this.spawnSound.play();
        } else {
            console.warn("Spawn sound buffer not ready yet");
        }

        if (this.onSpawnCallback) {
            this.onSpawnCallback();
        }
    }

    public getPosition(): Vector3 {
        return this.mesh.position;
    }
}
