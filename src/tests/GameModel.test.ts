import { describe, it, expect, vi } from 'vitest';
import { GameModel, GameStatus } from '../model/GameModel';
import { Vector3 } from 'three';

describe('GameModel (State Unit)', () => {
    it('initializes starting values to zero and status to PLAYING', () => {
        const model = new GameModel();
        const state = model.getState();
        expect(state.shotsFired).toBe(0);
        expect(state.enemiesKilled).toBe(0);
        expect(state.status).toBe(GameStatus.PLAYING);
        expect(state.isMuted).toBe(false);
    });

    it('increments shots fired counter and notifies subscribers of the change', () => {
        const model = new GameModel();
        const listener = vi.fn();
        model.subscribe(listener);
        
        model.incrementShots();
        
        expect(model.getState().shotsFired).toBe(1);
        expect(listener).toHaveBeenCalledTimes(2); // Initial + Change
    });

    it('toggles mute state correctly when toggleMute is called', () => {
        const model = new GameModel();
        model.toggleMute();
        expect(model.getState().isMuted).toBe(true);
        model.toggleMute();
        expect(model.getState().isMuted).toBe(false);
    });

    it('updates player position in state without triggering redundant UI notifications', () => {
        const model = new GameModel();
        const listener = vi.fn();
        model.subscribe(listener);
        
        const newPos = new Vector3(10, 5, -10);
        model.setPlayerPosition(newPos);
        
        expect(model.getState().playerPosition.x).toBe(10);
        expect(listener).toHaveBeenCalledTimes(1); // Only initial call from subscribe
    });

    it('changes game status and notifies the view of the transition', () => {
        const model = new GameModel();
        const listener = vi.fn();
        model.subscribe(listener);
        
        model.setStatus(GameStatus.PAUSED);
        
        expect(model.getState().status).toBe(GameStatus.PAUSED);
        expect(listener).toHaveBeenCalledTimes(2);
    });
});
