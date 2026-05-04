import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameModel, GameStatus } from '../model/GameModel'
import { eventBus } from '../core/EventBus'
import { Vector3 } from 'three'

describe('GameModel (State Unit)', () => {
  let model: GameModel

  beforeEach(() => {
    // We create a new model for each test.
    // Note: eventBus is a singleton, so we should be careful with listeners.
    // However, for these tests, we'll just subscribe and check.
    model = new GameModel()
  })

  it('initializes starting values to zero and status to PLAYING', () => {
    const state = model.getState()
    expect(state.shotsFired).toBe(0)
    expect(state.enemiesKilled).toBe(0)
    expect(state.status).toBe(GameStatus.PLAYING)
    expect(state.isMuted).toBe(false)
  })

  it('increments shots fired counter and notifies subscribers of the change', async () => {
    const listener = vi.fn()
    eventBus.on('GAME_STATE_CHANGED', listener)

    eventBus.emit('PLAYER_SHOOT')

    expect(model.getState().shotsFired).toBe(1)
    // We expect at least one call from the emit.
    // The constructor also does a notify() in a setTimeout, but we don't necessarily need to wait for it if we just want to see the change.
    expect(listener).toHaveBeenCalled()

    eventBus.off('GAME_STATE_CHANGED', listener)
  })

  it('toggles mute state correctly when TOGGLE_MUTE event is received', () => {
    expect(model.getState().isMuted).toBe(false)
    eventBus.emit('TOGGLE_MUTE')
    expect(model.getState().isMuted).toBe(true)
    eventBus.emit('TOGGLE_MUTE')
    expect(model.getState().isMuted).toBe(false)
  })

  it('updates player position in state when UPDATE_PLAYER_POS event is received', () => {
    const newPos = new Vector3(10, 5, -10)
    eventBus.emit('UPDATE_PLAYER_POS', newPos)

    expect(model.getState().playerPosition.x).toBe(10)
    expect(model.getState().playerPosition.y).toBe(5)
    expect(model.getState().playerPosition.z).toBe(-10)
  })

  it('changes game status when TOGGLE_PAUSE event is received', () => {
    expect(model.getState().status).toBe(GameStatus.PLAYING)
    eventBus.emit('TOGGLE_PAUSE')
    expect(model.getState().status).toBe(GameStatus.PAUSED)
    eventBus.emit('TOGGLE_PAUSE')
    expect(model.getState().status).toBe(GameStatus.PLAYING)
  })
})
