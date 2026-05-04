import './styles/global-styles.css'
import { UIManager } from './view/UIManager'
import { GameManager } from './controller/GameManager'

function main(): void {
  const container = document.querySelector<HTMLElement>('#app')
  if (!container) {
    throw new Error('Container #app not found')
  }
  const uiManager = new UIManager(container)

  const gameManager = new GameManager(container, uiManager)
  gameManager.init()
}

main()
