import mitt from 'mitt'
import { Vector3 } from 'three'
import type { GameState } from '../model/GameModel'

export type Events = {
  PLAYER_SHOOT: void
  ENEMY_KILLED: void
  ENEMY_SPAWNED: void
  TOGGLE_MUTE: void
  TOGGLE_PAUSE: void
  SET_TAB_MENU: { open: boolean }
  UPDATE_PLAYER_POS: Vector3
  GAME_STATE_CHANGED: GameState
}

export const eventBus = mitt<Events>()

// Registrar cada acción que se realice en el juego en la consola de forma legible
eventBus.on('*', (type, e) => {
  // Evitar spam de eventos de alta frecuencia o redundantes en el log
  if (type === 'UPDATE_PLAYER_POS' || type === 'GAME_STATE_CHANGED') return

  switch (type) {
    case 'PLAYER_SHOOT':
      console.log('🔫 [Acción] El jugador ha disparado. (Efecto de sonido ejecutado)')
      break
    case 'ENEMY_KILLED':
      console.log('💀 [Evento] ¡Impacto crítico! Un enemigo ha sido eliminado.')
      break
    case 'ENEMY_SPAWNED':
      console.log('👾 [Sistema] Un nuevo enemigo ha aparecido en el campo de batalla.')
      break
    case 'TOGGLE_PAUSE':
      console.log('⏸️ [Estado] Se ha alternado el estado de pausa.')
      break
    case 'SET_TAB_MENU':
      if (e && typeof e === 'object' && 'open' in e) {
        console.log(
          e.open
            ? '📋 [UI] Abriendo resumen de partida (Tab).'
            : '🎮 [UI] Cerrando resumen y volviendo a la acción.'
        )
      }
      break
    case 'TOGGLE_MUTE':
      console.log('🔊 [Ajustes] Se ha alternado el estado del sonido.')
      break
    default:
      console.log(`[Evento] ${String(type)}`, e ?? '')
  }
})