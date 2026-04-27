import { describe, it, expect, vi } from 'vitest';
import { Vector3, Scene, AudioListener } from 'three';
import { Enemy } from '../view/Enemy';

// Mock AudioLoader to avoid file loading errors in test environment
vi.mock('three', async () => {
    const actual = await vi.importActual('three') as any;
    return {
        ...actual,
        AudioLoader: vi.fn().mockImplementation(() => ({
            load: vi.fn((url, cb) => cb({}))
        }))
    };
});

describe('Enemy (Enemy Unit)', () => {
    const scene = new Scene();
    const listener = new AudioListener();
    const pos = new Vector3(0, 1, 0);

    it('registers a collision when a projectile enters its impact zone', () => {
        const enemy = new Enemy(scene, pos, listener);
        // Enemy is at (0, 1, 0) with geometry (1, 2, 1)
        const hit = enemy.checkCollision(new Vector3(0, 1, 0));
        expect(hit).toBe(true);
    });

    it('ignores collisions if the enemy is dead or in a blinking state', () => {
        const enemy = new Enemy(scene, pos, listener);
        enemy.hit(); // Activates blink
        const hit = enemy.checkCollision(new Vector3(0, 1, 0));
        expect(hit).toBe(false);
    });

    it('starts the blink timer immediately upon receiving a hit', () => {
        const enemy = new Enemy(scene, pos, listener);
        enemy.hit();
        // Indirectly check state through collision behavior
        expect(enemy.checkCollision(pos)).toBe(false);
    });
});
