import { Scene, BoxGeometry, Vector3, AudioListener } from 'three'
import { Enemy } from '../view/Enemy'

export class EnemyManager {
  private readonly scene: Scene
  private readonly audioListener: AudioListener
  private enemies: Enemy[] = []
  private readonly enemyGeometry: BoxGeometry

  constructor(scene: Scene, audioListener: AudioListener) {
    this.scene = scene
    this.audioListener = audioListener
    this.enemyGeometry = new BoxGeometry(1, 2, 1)
  }

  public spawnInitialEnemies(count: number = 7, range: number = 40): void {
    for (let i = 0; i < count; i++) {
      const randomPos = new Vector3(
        (Math.random() - 0.5) * range * 2,
        1,
        (Math.random() - 0.5) * range * 2
      )
      const enemy = new Enemy(this.scene, this.enemyGeometry, randomPos, this.audioListener)
      this.enemies.push(enemy)
    }
  }

  public update(delta: number): void {
    this.enemies.forEach((e) => e.update(delta))
  }

  public getEnemies(): Enemy[] {
    return this.enemies
  }
}