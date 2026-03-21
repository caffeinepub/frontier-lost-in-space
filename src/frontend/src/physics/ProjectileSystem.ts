export interface Projectile {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  life: number;
}

export class ProjectileSystem {
  projectiles: Projectile[] = [];
  private idCounter = 0;

  fire(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
  ) {
    this.projectiles.push({
      id: `proj_${this.idCounter++}`,
      position: { ...origin },
      velocity: {
        x: direction.x * 5,
        y: direction.y * 5,
        z: direction.z * 5,
      },
      life: 120,
    });
  }

  update() {
    for (const p of this.projectiles) {
      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;
      p.position.z += p.velocity.z;
      p.life--;
    }
    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }

  getCount(): number {
    return this.projectiles.length;
  }
}
