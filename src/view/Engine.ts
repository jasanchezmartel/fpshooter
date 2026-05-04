import { Vec3, Mat4 } from '../core/Math'

export interface Renderable {
  getPosition(): Vec3
  color?: [number, number, number, number]
  scale?: Vec3
  isActive?: boolean
  isVisible?: boolean
  geometryType?: 'cube' | 'sphere'
}

export class Engine {
  private canvas: HTMLCanvasElement
  private gl!: WebGL2RenderingContext
  private program!: WebGLProgram
  private container: HTMLElement
  private animationLoopCallback: ((delta: number) => void) | null = null
  private lastTime: number = 0

  private objects: Set<Renderable> = new Set()
  private cubeVao!: WebGLVertexArrayObject
  private sphereVao!: WebGLVertexArrayObject
  private sphereIndexCount: number = 0
  
  private viewMatrix: Mat4 = new Mat4()
  
  private uProjLoc!: WebGLUniformLocation
  private uViewLoc!: WebGLUniformLocation
  private uModelLoc!: WebGLUniformLocation
  private uColorLoc!: WebGLUniformLocation

  private readonly vertexShaderSource = `#version 300 es
    in vec3 a_position;
    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_model;
    void main() {
      gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
    }
  `

  private readonly fragmentShaderSource = `#version 300 es
    precision highp float;
    uniform vec4 u_color;
    out vec4 outColor;
    void main() {
      outColor = u_color;
    }
  `

  constructor(container: HTMLElement) {
    this.container = container
    this.canvas = document.createElement('canvas')
    this.canvas.style.display = 'block'
    this.container.appendChild(this.canvas)
  }

  public init(): void {
    const gl = this.canvas.getContext('webgl2', { antialias: true })
    if (!gl) throw new Error('WebGL2 no soportado')
    this.gl = gl

    this.program = this.createProgram(this.vertexShaderSource, this.fragmentShaderSource)
    this.gl.useProgram(this.program)

    this.uProjLoc = gl.getUniformLocation(this.program, 'u_projection')!
    this.uViewLoc = gl.getUniformLocation(this.program, 'u_view')!
    this.uModelLoc = gl.getUniformLocation(this.program, 'u_model')!
    this.uColorLoc = gl.getUniformLocation(this.program, 'u_color')!

    this.setupCube()
    this.setupSphere(16, 16)
    this.resize()
    window.addEventListener('resize', () => this.resize())

    requestAnimationFrame(this.loop.bind(this))
  }

  private setupCube(): void {
    const gl = this.gl
    const vertices = new Float32Array([
      -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
      -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,  0.5,-0.5,-0.5,
      -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
      -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
       0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
      -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5,
    ])
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,    4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ])
    this.cubeVao = gl.createVertexArray()!
    gl.bindVertexArray(this.cubeVao)
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    const ebo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
  }

  private setupSphere(lat: number, lon: number): void {
    const gl = this.gl
    const vertices: number[] = []
    const indices: number[] = []

    for (let j = 0; j <= lat; j++) {
      const theta = j * Math.PI / lat
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      for (let i = 0; i <= lon; i++) {
        const phi = i * 2 * Math.PI / lon
        const sinPhi = Math.sin(phi)
        const cosPhi = Math.cos(phi)

        vertices.push(cosPhi * sinTheta, cosTheta, sinPhi * sinTheta)
      }
    }

    for (let j = 0; j < lat; j++) {
      for (let i = 0; i < lon; i++) {
        const first = j * (lon + 1) + i
        const second = first + lon + 1
        indices.push(first, second, first + 1)
        indices.push(second, second + 1, first + 1)
      }
    }

    this.sphereIndexCount = indices.length
    this.sphereVao = gl.createVertexArray()!
    gl.bindVertexArray(this.sphereVao)
    const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    const ebo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)
  }

  public register(obj: Renderable): void {
    this.objects.add(obj)
  }

  public setViewMatrix(matrix: Mat4): void {
    this.viewMatrix = matrix
  }

  private loop(now: number): void {
    const delta = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now
    if (this.animationLoopCallback) this.animationLoopCallback(delta)
    this.render()
    requestAnimationFrame(this.loop.bind(this))
  }

  private render(): void {
    const gl = this.gl
    gl.clearColor(0.01, 0.01, 0.03, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)

    const aspect = this.canvas.width / this.canvas.height
    const projection = Mat4.perspective(Math.PI / 4, aspect, 0.1, 1000)
    
    gl.uniformMatrix4fv(this.uProjLoc, false, projection.data)
    gl.uniformMatrix4fv(this.uViewLoc, false, this.viewMatrix.data)

    // 1. Suelo
    gl.bindVertexArray(this.cubeVao)
    const floorModel = new Mat4()
    floorModel.data[0] = 200; floorModel.data[5] = 0.1; floorModel.data[10] = 200
    floorModel.data[13] = -0.05
    gl.uniformMatrix4fv(this.uModelLoc, false, floorModel.data)
    gl.uniform4fv(this.uColorLoc, [0.1, 0.1, 0.15, 1.0])
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

    // 2. Objetos dinámicos
    for (const obj of this.objects) {
      if (obj.isActive === false || obj.isVisible === false) continue

      if (obj.geometryType === 'sphere') {
        gl.bindVertexArray(this.sphereVao)
      } else {
        gl.bindVertexArray(this.cubeVao)
      }

      const pos = obj.getPosition()
      const scale = obj.scale || new Vec3(1, 1, 1)
      const model = new Mat4()
      model.data[0] = scale.x; model.data[5] = scale.y; model.data[10] = scale.z
      model.data[12] = pos.x; model.data[13] = pos.y; model.data[14] = pos.z
      gl.uniformMatrix4fv(this.uModelLoc, false, model.data)
      gl.uniform4fv(this.uColorLoc, obj.color || [1, 0.2, 0.2, 1])
      
      if (obj.geometryType === 'sphere') {
        gl.drawElements(gl.TRIANGLES, this.sphereIndexCount, gl.UNSIGNED_SHORT, 0)
      } else {
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)
      }
    }

    // 3. Arma (HUD)
    gl.bindVertexArray(this.cubeVao)
    const weaponProj = Mat4.perspective(Math.PI / 4, aspect, 0.01, 100)
    const weaponView = new Mat4()
    gl.uniformMatrix4fv(this.uProjLoc, false, weaponProj.data)
    gl.uniformMatrix4fv(this.uViewLoc, false, weaponView.data)
    const weaponModel = new Mat4()
    // Arma más fina (0.05) y más corta (0.2)
    weaponModel.data[0] = 0.05; weaponModel.data[5] = 0.05; weaponModel.data[10] = 0.2
    // Posición más cercana a la cámara (Z = -0.2) y un poco más centrada (X = 0.15)
    weaponModel.data[12] = 0.15; weaponModel.data[13] = -0.15; weaponModel.data[14] = -0.2
    gl.uniformMatrix4fv(this.uModelLoc, false, weaponModel.data)
    gl.uniform4fv(this.uColorLoc, [0.25, 0.25, 0.3, 1.0])
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0)

    gl.bindVertexArray(null)
  }

  public setAnimationLoopCallback(callback: (delta: number) => void): void {
    this.animationLoopCallback = callback
  }

  private resize(): void {
    this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
  }

  private createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source); gl.compileShader(shader)
    return shader
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram {
    const gl = this.gl
    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()!
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program)
    return program
  }
}
