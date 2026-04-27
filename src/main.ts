import './style.css'
import { UIManager } from './view/UIManager';
import { GameManager } from './controller/GameManager';

function main(): void {
    const container = document.querySelector<HTMLDivElement>('#app');
    if (!container) {
        throw new Error('Container #app not found');
    }
    const uiManager = new UIManager(container);
    
    const gameManager = new GameManager(container, uiManager);
    gameManager.init();
}

main();