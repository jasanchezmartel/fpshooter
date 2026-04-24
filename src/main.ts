import './style.css'
import { UIManager } from './ui/UIManager';
import { GameManager } from './core/GameManager';

function main(): void {
    const container = document.querySelector<HTMLDivElement>('#app');
    if (!container) {
        throw new Error('Container #app not found');
    }
    const uiManager = new UIManager(container);
    uiManager.init();
    
    const gameManager = new GameManager(container, uiManager);
    gameManager.init();
}

main();