import { describe, it, expect, vi } from 'vitest';
import { Player } from '../view/Player';
import { InputManager } from '../controller/InputManager';

describe('Player (Player Unit)', () => {
    const mockInput = {
        isKeyPressed: vi.fn(),
        isMousePressed: vi.fn()
    } as unknown as InputManager;

    it('starts at standard eye-level height of 1.6 units', () => {
        const player = new Player(mockInput);
        expect(player.getPosition().y).toBe(1.6);
    });

    it('calculates forward position correctly when W key is pressed', () => {
        const player = new Player(mockInput);
        const initialPos = player.getPosition().clone();
        
        vi.mocked(mockInput.isKeyPressed).mockImplementation((code) => code === 'KeyW');
        
        player.update(1, 0); // delta 1, yaw 0
        
        expect(player.getPosition().z).toBeLessThan(initialPos.z);
    });

    it('applies speed multiplier when Shift key is detected for sprinting', () => {
        const player = new Player(mockInput);
        
        // Walk simulation (W)
        vi.mocked(mockInput.isKeyPressed).mockImplementation((code) => code === 'KeyW');
        player.update(1, 0);
        const walkDist = Math.abs(player.getPosition().z);
        
        // Reset position
        player.getPosition().set(0, 1.6, 0);
        
        // Sprint simulation (W + Shift)
        vi.mocked(mockInput.isKeyPressed).mockImplementation((code) => code === 'KeyW' || code === 'ShiftLeft');
        player.update(1, 0);
        const sprintDist = Math.abs(player.getPosition().z);
        
        expect(sprintDist).toBeGreaterThan(walkDist);
    });

    it('prevents continuous shooting before the cooldown period has elapsed', () => {
        const player = new Player(mockInput);
        vi.mocked(mockInput.isMousePressed).mockReturnValue(true);
        
        const firstShot = player.tryShoot();
        const secondShot = player.tryShoot();
        
        expect(firstShot).toBe(true);
        expect(secondShot).toBe(false);
    });
});
