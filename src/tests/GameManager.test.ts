import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameManager } from '../controller/GameManager'
import { UIManager } from '../view/UIManager'
import { GameStatus } from '../model/GameModel'

describe('GameManager (Controller Integration)', () => {
  let container: HTMLElement
  let uiManager: UIManager
  let gameManager: GameManager

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    uiManager = new UIManager(container)
    gameManager = new GameManager(container, uiManager)
    gameManager.init()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pauses the game and unlocks camera when P key is pressed', () => {
    // Accessing private inputManager for testing purposes
    const inputManager = (gameManager as any).inputManager
    const cameraManager = (gameManager as any).cameraManager

    const unlockSpy = vi.spyOn(cameraManager, 'unlock')
    const isKeyPressedSpy = vi.spyOn(inputManager, 'isKeyPressed')

    // Mock pressing 'P'
    isKeyPressedSpy.mockImplementation((key) => key === 'KeyP')

    // Run update loop
    ;(gameManager as any).update(0.1)

    const state = (gameManager as any).model.getState()
    expect(state.status).toBe(GameStatus.PAUSED)
    expect(unlockSpy).toHaveBeenCalled()
  })

  it('resumes the game and locks camera when P key is pressed again', () => {
    const inputManager = (gameManager as any).inputManager
    const cameraManager = (gameManager as any).cameraManager

    const lockSpy = vi.spyOn(cameraManager, 'lock')
    const unlockSpy = vi.spyOn(cameraManager, 'unlock')
    const isKeyPressedSpy = vi.spyOn(inputManager, 'isKeyPressed')

    // First press to pause
    isKeyPressedSpy.mockImplementation((key) => key === 'KeyP')
    ;(gameManager as any).update(0.1)
    expect(unlockSpy).toHaveBeenCalled()

    // Advance time to bypass the 300ms throttle
    vi.advanceTimersByTime(400)

    // Second press to resume
    ;(gameManager as any).update(0.1)

    const state = (gameManager as any).model.getState()
    expect(state.status).toBe(GameStatus.PLAYING)
    expect(lockSpy).toHaveBeenCalled()
  })
})
