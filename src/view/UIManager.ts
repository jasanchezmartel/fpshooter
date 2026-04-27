import { GameModel, GameStatus } from '../model/GameModel';

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

    public init(model: GameModel): void {
        this.createUI()
        
        this.muteButton.onclick = () => model.toggleMute();

        model.subscribe((state) => {
            this.updateText(state.shotsFired, state.enemiesKilled);
            this.updateOverlays(state.status, state.isTabMenuOpen, state.shotsFired, state.enemiesKilled);
            
            // Actualizar icono y estado visual
            this.muteButton.innerHTML = state.isMuted ? '🔇' : '🔊';
            this.muteButton.style.borderColor = state.isMuted ? '#ff5252' : 'rgba(255, 255, 255, 0.2)';
        });
    }

    private createUI(): void {
        // HUD Principal (Vuelto al estilo original)
        this.uiElement.id = 'game-ui'
        this.uiElement.style.position = 'absolute'
        this.uiElement.style.top = '10px'
        this.uiElement.style.left = '10px'
        this.uiElement.style.color = '#ffffff'
        this.uiElement.style.fontFamily = 'monospace'
        this.uiElement.style.fontSize = '1.2rem'
        this.uiElement.style.userSelect = 'none'
        this.uiElement.style.pointerEvents = 'none'
        this.uiElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)'
        this.container.appendChild(this.uiElement)

        // Punto de mira (Crosshair)
        const crosshair = document.createElement('div')
        crosshair.id = 'crosshair'
        crosshair.style.position = 'absolute'
        crosshair.style.top = '50%'
        crosshair.style.left = '50%'
        crosshair.style.width = '10px'
        crosshair.style.height = '10px'
        crosshair.style.border = '2px solid white'
        crosshair.style.transform = 'translate(-50%, -50%)'
        crosshair.style.borderRadius = '50%'
        crosshair.style.pointerEvents = 'none'
        this.container.appendChild(crosshair)

        // Menú de Tabulador (Scoreboard)
        this.scoreboardElement = document.createElement('div')
        this.scoreboardElement.id = 'scoreboard'
        this.applyOverlayStyles(this.scoreboardElement)
        this.scoreboardElement.style.display = 'none'
        this.container.appendChild(this.scoreboardElement)

        // Overlay de Pausa
        this.pauseElement = document.createElement('div')
        this.pauseElement.id = 'pause-overlay'
        this.applyOverlayStyles(this.pauseElement)
        this.pauseElement.style.display = 'none'
        this.pauseElement.innerHTML = `
            <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: #ffeb3b;">PAUSED</h1>
            <p style="font-size: 1.2rem;">Press 'P' to resume</p>
        `
        this.container.appendChild(this.pauseElement)

        // Botón de Silencio
        this.muteButton = document.createElement('button')
        this.muteButton.id = 'mute-button'
        this.muteButton.style.position = 'absolute'
        this.muteButton.style.bottom = '20px'
        this.muteButton.style.right = '20px'
        this.muteButton.style.width = '50px'
        this.muteButton.style.height = '50px'
        this.muteButton.style.borderRadius = '50%'
        this.muteButton.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        this.muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        this.muteButton.style.backdropFilter = 'blur(5px)'
        this.muteButton.style.color = 'white'
        this.muteButton.style.fontSize = '1.5rem'
        this.muteButton.style.cursor = 'pointer'
        this.muteButton.style.pointerEvents = 'auto'
        this.muteButton.style.transition = 'all 0.2s ease'
        this.muteButton.style.display = 'flex'
        this.muteButton.style.alignItems = 'center'
        this.muteButton.style.justifyContent = 'center'
        this.muteButton.innerHTML = '🔊'
        
        this.muteButton.onmouseover = () => this.muteButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        this.muteButton.onmouseout = () => this.muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        
        this.container.appendChild(this.muteButton)
    }

    private applyOverlayStyles(el: HTMLElement): void {
        el.style.position = 'absolute'
        el.style.top = '50%'
        el.style.left = '50%'
        el.style.transform = 'translate(-50%, -50%)'
        el.style.padding = '2rem'
        el.style.backgroundColor = 'rgba(0, 0, 0, 0.75)'
        el.style.backdropFilter = 'blur(10px)'
        el.style.borderRadius = '15px'
        el.style.color = 'white'
        el.style.textAlign = 'center'
        el.style.fontFamily = 'monospace'
        el.style.border = '1px solid rgba(255, 255, 255, 0.1)'
        el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)'
        el.style.minWidth = '300px'
        el.style.pointerEvents = 'none'
    }

    private updateText(shots: number, kills: number): void {
        this.uiElement.innerHTML = `
            <div>Disparos: ${shots}</div>
            <div>Bajas: ${kills}</div>
        `;
        this.triggerShootFeedback()
    }

    private updateOverlays(status: GameStatus, isTabOpen: boolean, shots: number, kills: number): void {
        // Mostrar/Ocultar Pausa
        if (status === GameStatus.PAUSED) {
            this.pauseElement.style.display = 'block';
            this.pauseElement.innerHTML = `
                <h1 style="font-size: 3rem; margin-bottom: 0.5rem; color: #ffeb3b;">PAUSA</h1>
                <p style="font-size: 1.2rem;">Pulsa 'P' para reanudar</p>
            `;
        } else {
            this.pauseElement.style.display = 'none';
        }

        // Mostrar/Ocultar Scoreboard y HUD redundante
        if (isTabOpen) {
            this.uiElement.style.display = 'none'; // Ocultar HUD pequeño
            this.scoreboardElement.style.display = 'block';
            this.scoreboardElement.innerHTML = `
                <h2 style="margin-top: 0; color: #4fc3f7; border-bottom: 1px solid #444; padding-bottom: 10px;">RESUMEN DE LA PARTIDA</h2>
                <div style="display: flex; justify-content: space-around; margin: 20px 0; font-size: 1.2rem;">
                    <div>Disparos: <span style="color: #4fc3f7;">${shots}</span></div>
                    <div>Bajas: <span style="color: #ff5252;">${kills}</span></div>
                </div>
                <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px;">
                    <h3 style="font-size: 1rem; margin-top: 0; color: #888;">CONTROLES</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9rem; line-height: 1.6;">
                        <li><span style="color: #ffeb3b;">WASD</span> - Moverse</li>
                        <li><span style="color: #ffeb3b;">SHIFT</span> - Correr</li>
                        <li><span style="color: #ffeb3b;">CLICK L</span> - Disparar</li>
                        <li><span style="color: #ffeb3b;">CLICK R</span> - Ráfaga</li>
                        <li><span style="color: #ffeb3b;">TAB</span> - Resumen</li>
                        <li><span style="color: #ffeb3b;">P</span> - Pausar / Reanudar</li>
                    </ul>
                </div>
            `;
        } else {
            this.uiElement.style.display = 'block'; // Mostrar HUD pequeño
            this.scoreboardElement.style.display = 'none';
        }
    }

    public onEnemySpawn(): void {
        // Efecto eliminado por petición del usuario
    }

    private triggerShootFeedback(): void {
        this.uiElement.style.color = '#ffff00'
        setTimeout(() => {
            this.uiElement.style.color = '#ffffff'
        }, 100)
    }
}
