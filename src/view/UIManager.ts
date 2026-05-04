import { GameStatus } from '../model/GameModel'
import { eventBus } from '../core/EventBus'
import '../styles/ui-styles.css'

export class UIManager {
  private readonly container: HTMLElement
  private uiElement: HTMLElement
  private scoreboardElement!: HTMLElement
  private pauseElement!: HTMLElement
  private muteButton!: HTMLButtonElement

  constructor(container: HTMLElement) {
    this.container = container
    this.uiElement = document.createElement('div')
  }

  public init(): void {
    this.createUI()

    this.muteButton.onclick = () => eventBus.emit('TOGGLE_MUTE')

    eventBus.on('GAME_STATE_CHANGED', (state) => {
      this.updateText(state.shotsFired, state.enemiesKilled)
      this.updateOverlays(state.status, state.isTabMenuOpen, state.shotsFired, state.enemiesKilled)

      this.muteButton.innerHTML = state.isMuted ? '🔇' : '🔊'
      this.muteButton.classList.toggle('is-muted', state.isMuted)
    })
  }

  private createUI(): void {
    // HUD Principal
    this.uiElement.id = 'game-ui'
    this.uiElement.className = 'hud-container'
    this.container.appendChild(this.uiElement)

    // Punto de mira (Crosshair)
    const crosshair = document.createElement('div')
    crosshair.className = 'crosshair'
    this.container.appendChild(crosshair)

    // Menú de Tabulador (Scoreboard)
    this.scoreboardElement = document.createElement('div')
    this.scoreboardElement.className = 'overlay scoreboard'
    this.container.appendChild(this.scoreboardElement)

    // Overlay de Pausa
    this.pauseElement = document.createElement('div')
    this.pauseElement.className = 'overlay pause-overlay'
    this.container.appendChild(this.pauseElement)

    // Botón de Silencio
    this.muteButton = document.createElement('button')
    this.muteButton.className = 'btn-mute'
    this.muteButton.innerHTML = '🔊'
    this.container.appendChild(this.muteButton)
  }

  private updateText(shots: number, kills: number): void {
    this.uiElement.innerHTML = `
            <div>Disparos: <span>${shots}</span></div>
            <div>Bajas: <span>${kills}</span></div>
        `
    this.triggerShootFeedback()
  }

  private updateOverlays(
    status: GameStatus,
    isTabOpen: boolean,
    shots: number,
    kills: number
  ): void {
    if (status === GameStatus.PAUSED) {
      this.pauseElement.style.display = 'block'
      this.pauseElement.innerHTML = `
                <h1>PAUSA</h1>
                <p>Pulsa 'P' para reanudar</p>
            `
    } else {
      this.pauseElement.style.display = 'none'
    }

    if (isTabOpen) {
      this.uiElement.classList.add('hidden')
      this.scoreboardElement.style.display = 'block'
      this.scoreboardElement.innerHTML = `
                <h2>RESUMEN DE LA PARTIDA</h2>
                <div class="scoreboard-stats">
                    <div>Disparos: <span class="stat-value-shots">${shots}</span></div>
                    <div>Bajas: <span class="stat-value-kills">${kills}</span></div>
                </div>
                <div class="controls-hint">
                    <h3>CONTROLES</h3>
                    <ul class="controls-list">
                        <li><span class="key-hint">WASD</span> Moverse</li>
                        <li><span class="key-hint">SHIFT</span> Correr</li>
                        <li><span class="key-hint">CLICK L</span> Disparar</li>
                        <li><span class="key-hint">CLICK R</span> Ráfaga</li>
                        <li><span class="key-hint">TAB</span> Resumen</li>
                        <li><span class="key-hint">P</span> Pausar</li>
                    </ul>
                </div>
            `
    } else {
      this.uiElement.classList.remove('hidden')
      this.scoreboardElement.style.display = 'none'
    }
  }

  private triggerShootFeedback(): void {
    this.uiElement.classList.add('shoot-feedback')
    setTimeout(() => {
      this.uiElement.classList.remove('shoot-feedback')
    }, 100)
  }
}
