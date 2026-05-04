# Diagrama UML — FPShooterNuevo

```mermaid
classDiagram
    direction TB

    %% ─── CONTROLADOR ───────────────────────────────────────────
    class GameManager {
        <<Controller>>
        -engine: Engine
        -model: GameModel
        -uiManager: UIManager
        -cameraManager: CameraManager
        -inputManager: InputManager
        -player: Player
        -enemies: Enemy[]
        -projectiles: Projectile[]
        -scene: Scene
        -audioListener: AudioListener
        -detectionZone: Mesh
        -shootSound: Audio
        +init() void
        -update(delta) void
        -shoot(useGravity) void
        -spawnEnemies() void
        -setupDetectionZone() void
        -checkDetectionZone() void
    }

    class InputManager {
        <<Controller>>
        -keys: Record~string, boolean~
        -mouseButtons: Record~number, boolean~
        +init() void
        +isKeyPressed(code) boolean
        +isMousePressed(button) boolean
    }

    %% ─── MODELO ─────────────────────────────────────────────────
    class GameModel {
        <<Model>>
        -state: GameState
        -listeners: GameStateListener[]
        +subscribe(listener) void
        +incrementShots() void
        +incrementKills() void
        +setStatus(status) void
        +setTabMenuOpen(open) void
        +toggleMute() void
        +getState() GameState
        -notify() void
    }

    class GameState {
        <<interface>>
        +shotsFired: number
        +enemiesKilled: number
        +status: GameStatus
        +playerPosition: Vector3
        +isTabMenuOpen: boolean
        +isMuted: boolean
    }

    class GameStatus {
        <<enumeration>>
        PLAYING
        PAUSED
        GAME_OVER
    }

    %% ─── VISTA ───────────────────────────────────────────────────
    class UIManager {
        <<View>>
        -container: HTMLElement
        -uiElement: HTMLElement
        -scoreboardElement: HTMLElement
        -pauseElement: HTMLElement
        -muteButton: HTMLButtonElement
        +init(model) void
        +onEnemySpawn() void
        -createUI() void
        -updateText(shots, kills) void
        -updateOverlays(status, isTabOpen, ...) void
        -triggerShootFeedback() void
    }

    class Engine {
        <<View / Three.js Wrapper>>
        -container: HTMLElement
        -scene: Scene
        -camera: PerspectiveCamera
        -renderer: WebGLRenderer
        -timer: Clock
        +init() void
        +setAnimationLoopCallback(cb) void
        +getScene() Scene
        +getCamera() PerspectiveCamera
        +getRenderer() WebGLRenderer
        -initLights() void
        -createFloor() void
    }

    class CameraManager {
        <<View>>
        -camera: PerspectiveCamera
        -yawObject: Object3D
        -pitchObject: Object3D
        -weaponMesh: Mesh
        -locked: boolean
        -yaw: number
        -pitch: number
        +init() void
        +update(delta) void
        +updatePosition(pos) void
        +lock() void
        +unlock() void
        +isLocked() boolean
        +getYaw() number
        +getForwardVector() Vector3
        +getWeaponMesh() Mesh
        +getHierarchyRoot() Object3D
    }

    class Player {
        <<View / Entity>>
        -position: Vector3
        -input: InputManager
        -moveSpeed: number
        -canShoot: boolean
        -canShootSecondary: boolean
        +update(delta, yaw) void
        +tryShoot() boolean
        +tryShootSecondary() boolean
        +getPosition() Vector3
    }

    class Enemy {
        <<View / Entity>>
        -mesh: Mesh
        -scene: Scene
        -isDead: boolean
        -blinkTimer: number
        -respawnTimer: number
        -sound: PositionalAudio
        -spawnSound: PositionalAudio
        -boundingBox: Box3
        +update(delta) void
        +hit() void
        +checkCollision(pos) boolean
        +getPosition() Vector3
        -respawn() void
    }

    class Projectile {
        <<View / Entity>>
        -scene: Scene
        -mesh: Mesh
        -velocity: Vector3
        -useGravity: boolean
        -lifeTime: number
        +update(delta) boolean
        +getPosition() Vector3
        +destroy() void
    }

    %% ─── RELACIONES ──────────────────────────────────────────────

    %% Composición (GameManager posee estas instancias)
    GameManager *-- Engine          : posee
    GameManager *-- GameModel       : posee
    GameManager *-- UIManager       : posee
    GameManager *-- CameraManager   : posee
    GameManager *-- InputManager    : posee
    GameManager *-- Player          : posee

    %% Agregación (gestiona colecciones con ciclo de vida propio)
    GameManager o-- Enemy           : gestiona lista
    GameManager o-- Projectile      : gestiona lista

    %% Dependencia (usa / se suscribe a)
    UIManager ..> GameModel         : subscribe / observa
    GameManager ..> GameModel       : subscribe (audio / pausa)

    %% Asociación directa
    Player --> InputManager         : lee entradas

    %% Contención de datos
    GameModel *-- GameState         : contiene
    GameState ..> GameStatus        : usa enum
```

---

## Leyenda de relaciones

| Símbolo | Tipo            | Significado                                                                 |
| ------- | --------------- | --------------------------------------------------------------------------- |
| `*--`   | **Composición** | La clase padre crea y destruye la instancia hija                            |
| `o--`   | **Agregación**  | La clase padre gestiona la colección, pero las entidades tienen vida propia |
| `-->`   | **Asociación**  | Referencia directa entre clases                                             |
| `..>`   | **Dependencia** | Uso puntual (callback / suscripción)                                        |

## Capas MVC

```
┌─ Controller ──────────────────────────────────┐
│  GameManager   InputManager                   │
└───────────────────────────────────────────────┘
          │ observa          │ controla
┌─ Model ─┘        ┌─ View ──┴─────────────────┐
│  GameModel        │  Engine    CameraManager  │
│  GameState        │  UIManager Player         │
│  GameStatus       │  Enemy     Projectile     │
└───────────────    └───────────────────────────┘
```
