export class SpacePhysics {
  velocity = { x: 0, y: 0, z: 0 };
  acceleration = { x: 0, y: 0, z: 0 };
  maxSpeed = 2.5;
  drag = 0.98;
  thrustPower = 0.05;
  gravityStrength = 0.01;

  applyThrust(direction: { x: number; y: number; z: number }) {
    this.acceleration.x += direction.x * this.thrustPower;
    this.acceleration.y += direction.y * this.thrustPower;
    this.acceleration.z += direction.z * this.thrustPower;
  }

  applyGravity(
    position: { x: number; y: number; z: number },
    planetPosition: { x: number; y: number; z: number },
  ) {
    const dx = planetPosition.x - position.x;
    const dy = planetPosition.y - position.y;
    const dz = planetPosition.z - position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.0001;
    this.acceleration.x += (dx / dist) * this.gravityStrength;
    this.acceleration.y += (dy / dist) * this.gravityStrength;
    this.acceleration.z += (dz / dist) * this.gravityStrength;
  }

  update(position: { x: number; y: number; z: number }) {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.velocity.z += this.acceleration.z;
    this.velocity.x *= this.drag;
    this.velocity.y *= this.drag;
    this.velocity.z *= this.drag;
    const speed = Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2,
    );
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
      this.velocity.z *= scale;
    }
    position.x += this.velocity.x;
    position.y += this.velocity.y;
    position.z += this.velocity.z;
    this.acceleration = { x: 0, y: 0, z: 0 };
  }

  getSpeed(): number {
    return Math.sqrt(
      this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2,
    );
  }
}
