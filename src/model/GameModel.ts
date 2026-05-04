import { Vec3 } from '../core/Math'
import { eventBus } from '../core/EventBus'

export const GameStatus = {
  PLAYING: 0,
  PAUSED: 1,
  GAME_OVER: 2,
} as const

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus]

export interface GameState {
  shotsFired: number
  enemiesKilled: number
  status: GameStatus
  playerPosition: Vec3
  isTabMenuOpen: boolean
  isMuted: boolean
}

export class GameModel {
  private state: GameState = {
    shotsFired: 0,
    enemiesKilled: 0,
    status: GameStatus.PLAYING,
    playerPosition: new Vec3(0, 0, 0),
    isTabMenuOpen: false,
    isMuted: false,
  }

  constructor() {
    eventBus.on('PLAYER_SHOOT', () => this.incrementShots())
    eventBus.on('ENEMY_KILLED', () => this.incrementKills())
    eventBus.on('TOGGLE_MUTE', () => this.toggleMute())
    eventBus.on('TOGGLE_PAUSE', () => {
      this.state.status =
        this.state.status === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING
      this.notify()
    })
    eventBus.on('SET_TAB_MENU', (payload) => this.setTabMenuOpen(payload.open))
    eventBus.on('UPDATE_PLAYER_POS', (pos) => this.setPlayerPosition(pos))

    setTimeout(() => this.notify(), 0)
  }

  private incrementShots(): void {
    this.state.shotsFired++
    this.notify()
  }

  private incrementKills(): void {
    this.state.enemiesKilled++
    this.notify()
  }

  private setPlayerPosition(pos: Vec3): void {
    this.state.playerPosition.copy(pos)
  }

  private setTabMenuOpen(open: boolean): void {
    if (this.state.isTabMenuOpen !== open) {
      this.state.isTabMenuOpen = open
      this.notify()
    }
  }

  private toggleMute(): void {
    this.state.isMuted = !this.state.isMuted
    this.notify()
  }

  public getState(): Readonly<GameState> {
    return this.state
  }

  private notify(): void {
    eventBus.emit('GAME_STATE_CHANGED', this.state)
  }
}
