// EventBus nativo - Reemplazo de Mitt para Zero-Dependencies
import { Vec3 } from './Math'
import type { GameState } from '../model/GameModel'

export type Events = {
  PLAYER_SHOOT: void
  ENEMY_KILLED: void
  ENEMY_SPAWNED: void
  TOGGLE_MUTE: void
  TOGGLE_PAUSE: void
  SET_TAB_MENU: { open: boolean }
  UPDATE_PLAYER_POS: Vec3
  GAME_STATE_CHANGED: GameState
}

type Handler<T = any> = (event: T) => void
type WildcardHandler = (type: keyof Events, event: any) => void

class EventEmitter {
  private handlers: Map<keyof Events | '*', (Handler | WildcardHandler)[]> = new Map()

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): void {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)
  }

  onWildcard(handler: WildcardHandler): void {
    if (!this.handlers.has('*')) this.handlers.set('*', [])
    this.handlers.get('*')!.push(handler)
  }

  // Firma flexible para permitir omitir el segundo argumento en eventos void
  emit<K extends keyof Events>(type: K, event?: Events[K]): void {
    const data = event as any
    ;(this.handlers.get(type) || []).forEach((handler) => (handler as Handler)(data))
    ;(this.handlers.get('*') || []).forEach((handler) => (handler as WildcardHandler)(type, data))
  }
}

export const eventBus = new EventEmitter()

// Logger global para depuración
eventBus.onWildcard((type, e) => {
  if (type === 'UPDATE_PLAYER_POS' || type === 'GAME_STATE_CHANGED') return
  console.log(`[EventBus] ${String(type)}`, e ?? '')
})