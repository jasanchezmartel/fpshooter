import { Vector3 } from 'three';

export enum GameStatus {
    PLAYING,
    PAUSED,
    GAME_OVER
}

export type GameStateListener = (state: GameState) => void;

interface GameState {
    shotsFired: number;
    enemiesKilled: number;
    status: GameStatus;
    playerPosition: Vector3;
    isTabMenuOpen: boolean;
    isMuted: boolean;
}

export class GameModel {
    private state: GameState = {
        shotsFired: 0,
        enemiesKilled: 0,
        status: GameStatus.PLAYING,
        playerPosition: new Vector3(0, 0, 0),
        isTabMenuOpen: false,
        isMuted: false
    };

    private listeners: GameStateListener[] = [];

    public subscribe(listener: GameStateListener): void {
        this.listeners.push(listener);
        // Llamada inmediata para sincronizar estado inicial
        listener(this.state);
    }

    public incrementShots(): void {
        this.state.shotsFired++;
        this.notify();
    }

    public incrementKills(): void {
        this.state.enemiesKilled++;
        this.notify();
    }

    public setPlayerPosition(pos: Vector3): void {
        this.state.playerPosition.copy(pos);
        // Normalmente no notificamos a la UI cada frame por posición 
        // a menos que sea necesario (ej: un minimapa)
    }

    public setTabMenuOpen(open: boolean): void {
        if (this.state.isTabMenuOpen !== open) {
            this.state.isTabMenuOpen = open;
            this.notify();
        }
    }

    public toggleMute(): void {
        this.state.isMuted = !this.state.isMuted;
        this.notify();
    }

    public setStatus(status: GameStatus): void {
        this.state.status = status;
        this.notify();
    }

    public getState(): Readonly<GameState> {
        return this.state;
    }

    private notify(): void {
        this.listeners.forEach(l => l(this.state));
    }
}
