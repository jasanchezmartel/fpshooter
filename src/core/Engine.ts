import { AmbientLight, DirectionalLight, DoubleSide, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Scene, WebGLRenderer, Clock } from 'three';

export class Engine {
    private readonly container: HTMLElement
    private scene!: Scene
    private camera!: PerspectiveCamera
    private renderer!: WebGLRenderer
    private timer!: Clock
    private isInitialized: boolean = false
    private animationLoopCallback: ((delta: number) => void) | null = null

    public setAnimationLoopCallback(callback: (delta: number) => void): void {
        this.animationLoopCallback = callback;
    }

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public init(): void {
        if (this.isInitialized) return
        this.scene = new Scene()
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new WebGLRenderer({ antialias: true })
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.container.appendChild(this.renderer.domElement)
        this.isInitialized = true
        this.timer = new Clock()
        this.initLights()
        this.createFloor()
        this.initResizeListener()

        this.renderer.setAnimationLoop(() => {
            const delta = Math.min(this.timer.getDelta(), 0.1);
            if (this.animationLoopCallback) {
                this.animationLoopCallback(delta);
            }
            this.renderer.render(this.scene, this.camera);
        })
        this.isInitialized = true;
    }

    private initLights(): void {
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        this.scene.add(this.camera);
    }

    private initResizeListener(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private createFloor(): void {
        const geometry = new PlaneGeometry(100, 100);
        const material = new MeshStandardMaterial({ color: 0x808080, side: DoubleSide });
        const floor = new Mesh(geometry, material);
        floor.rotation.x = Math.PI / 2;
        this.scene.add(floor);
    }

    public getScene(): Scene {
        return this.scene;
    }

    public getCamera(): PerspectiveCamera {
        return this.camera;
    }

    public getRenderer(): WebGLRenderer {
        return this.renderer;
    }
}