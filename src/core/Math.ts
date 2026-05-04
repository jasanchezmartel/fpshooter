// Librería Matemática Nativa para Zero-Dependencies

export class Vec3 {
  public x: number
  public y: number
  public z: number

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x
    this.y = y
    this.z = z
  }

  set(x: number, y: number, z: number): this {
    this.x = x; this.y = y; this.z = z
    return this
  }

  copy(v: Vec3): this {
    this.x = v.x; this.y = v.y; this.z = v.z
    return this
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z)
  }

  add(v: Vec3): this {
    this.x += v.x; this.y += v.y; this.z += v.z
    return this
  }

  sub(v: Vec3, target = new Vec3()): Vec3 {
    target.x = this.x - v.x
    target.y = this.y - v.y
    target.z = this.z - v.z
    return target
  }

  multiplyScalar(s: number): this {
    this.x *= s; this.y *= s; this.z *= s
    return this
  }

  addScaledVector(v: Vec3, s: number): this {
    this.x += v.x * s
    this.y += v.y * s
    this.z += v.z * s
    return this
  }

  normalize(): this {
    const len = this.length()
    if (len > 0) this.multiplyScalar(1 / len)
    return this
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z
  }

  distanceTo(v: Vec3): number {
    const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  applyAxisAngle(axis: Vec3, angle: number): this {
    const halfAngle = angle / 2
    const s = Math.sin(halfAngle)
    const qx = axis.x * s, qy = axis.y * s, qz = axis.z * s, qw = Math.cos(halfAngle)
    const ix = qw * this.x + qy * this.z - qz * this.y
    const iy = qw * this.y + qz * this.x - qx * this.z
    const iz = qw * this.z + qx * this.y - qy * this.x
    const iw = -qx * this.x - qy * this.y - qz * this.z
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return this
  }
}

export class Box3 {
  public min: Vec3
  public max: Vec3
  constructor(min?: Vec3, max?: Vec3) {
    this.min = min || new Vec3(Infinity, Infinity, Infinity)
    this.max = max || new Vec3(-Infinity, -Infinity, -Infinity)
  }
  setFromObject(obj: any): this {
    if (obj.position) {
      const p = obj.position
      this.min.set(p.x - 0.5, p.y - 1, p.z - 0.5)
      this.max.set(p.x + 0.5, p.y + 1, p.z + 0.5)
    }
    return this
  }
  containsPoint(p: Vec3): boolean {
    return p.x >= this.min.x && p.x <= this.max.x && p.y >= this.min.y && p.y <= this.max.y && p.z >= this.min.z && p.z <= this.max.z
  }
  intersectsSphere(sphere: Sphere): boolean {
    let dmin = 0
    if (sphere.center.x < this.min.x) dmin += Math.pow(sphere.center.x - this.min.x, 2)
    else if (sphere.center.x > this.max.x) dmin += Math.pow(sphere.center.x - this.max.x, 2)
    if (sphere.center.y < this.min.y) dmin += Math.pow(sphere.center.y - this.min.y, 2)
    else if (sphere.center.y > this.max.y) dmin += Math.pow(sphere.center.y - this.max.y, 2)
    if (sphere.center.z < this.min.z) dmin += Math.pow(sphere.center.z - this.min.z, 2)
    else if (sphere.center.z > this.max.z) dmin += Math.pow(sphere.center.z - this.max.z, 2)
    return dmin <= Math.pow(sphere.radius, 2)
  }
  clampPoint(p: Vec3, target: Vec3): Vec3 {
    target.x = Math.max(this.min.x, Math.min(this.max.x, p.x))
    target.y = Math.max(this.min.y, Math.min(this.max.y, p.y))
    target.z = Math.max(this.min.z, Math.min(this.max.z, p.z))
    return target
  }
}

export class Sphere {
  public center: Vec3
  public radius: number
  constructor(center: Vec3 = new Vec3(), radius: number = 0) {
    this.center = center
    this.radius = radius
  }
}

export class Mat4 {
  public data: Float32Array
  constructor() { 
    this.data = new Float32Array(16)
    this.identity() 
  }
  identity(): this {
    this.data.fill(0); this.data[0] = this.data[5] = this.data[10] = this.data[15] = 1
    return this
  }

  static perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
    const m = new Mat4()
    const f = 1.0 / Math.tan(fov / 2)
    const nf = 1 / (near - far)
    m.data[0] = f / aspect
    m.data[5] = f
    m.data[10] = (far + near) * nf
    m.data[11] = -1
    m.data[14] = (2 * far * near) * nf
    m.data[15] = 0
    return m
  }

  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const m = new Mat4()
    const z = eye.sub(target).normalize()
    const x = new Vec3(up.y * z.z - up.z * z.y, up.z * z.x - up.x * z.z, up.x * z.y - up.y * z.x).normalize()
    const y = new Vec3(z.y * x.z - z.z * x.y, z.z * x.x - z.x * x.z, z.x * x.y - z.y * x.x).normalize()
    m.data[0] = x.x; m.data[1] = y.x; m.data[2] = z.x; m.data[3] = 0
    m.data[4] = x.y; m.data[5] = y.y; m.data[6] = z.y; m.data[7] = 0
    m.data[8] = x.z; m.data[9] = y.z; m.data[10] = z.z; m.data[11] = 0
    m.data[12] = -(x.x * eye.x + x.y * eye.y + x.z * eye.z)
    m.data[13] = -(y.x * eye.x + y.y * eye.y + y.z * eye.z)
    m.data[14] = -(z.x * eye.x + z.y * eye.y + z.z * eye.z)
    m.data[15] = 1
    return m
  }
}
