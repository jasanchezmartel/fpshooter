export class InputManager {
    private readonly keys: Record<string, boolean> = {};
    private readonly mouseButtons: Record<number, boolean> = {};

    public init(): void {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
    }

    public isKeyPressed(code: string): boolean {
        return !!this.keys[code];
    }

    public isMousePressed(button: number): boolean {
        return !!this.mouseButtons[button];
    }
}