export class UIManager {
    private readonly container: HTMLElement
    private shotsFired: number = 0
    private uiElement: HTMLElement

    constructor(container: HTMLElement) {
        this.container = container
        this.uiElement = document.createElement('div')
    }

    public init(): void {
        this.createUI()
    }

    private createUI(): void {
        this.uiElement.style.position = 'absolute'
        this.uiElement.style.top = '10px'
        this.uiElement.style.left = '10px'
        this.uiElement.style.color = '#ffffff'
        this.uiElement.style.fontFamily = 'monospace'
        this.uiElement.style.fontSize = '1.2rem'
        this.uiElement.style.userSelect = 'none'
        this.uiElement.style.pointerEvents = 'none'

        this.updateText()
        this.container.appendChild(this.uiElement)

        const crosshair = document.createElement('div')
        crosshair.style.position = 'absolute'
        crosshair.style.top = '50%'
        crosshair.style.left = '50%'
        crosshair.style.width = '10px'
        crosshair.style.height = '10px'
        crosshair.style.backgroundColor = 'white'
        crosshair.style.transform = 'translate(-50%, -50%)'
        crosshair.style.borderRadius = '50%'
        crosshair.style.pointerEvents = 'none'

        this.container.appendChild(crosshair)
    }

    private updateText(): void {
        this.uiElement.textContent = `Shots Fired: ${this.shotsFired}`
    }

    public onPlayerShoot(): void {
        this.shotsFired++
        this.updateText()
        this.triggerShootFeedback()
    }

    private triggerShootFeedback(): void {
        this.uiElement.style.color = '#ffff00'
        setTimeout(() => {
            this.uiElement.style.color = '#ffffff'
        }, 100)
    }
}
