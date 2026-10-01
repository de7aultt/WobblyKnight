import * as THREE from 'three';
import type { Input } from '../core/input';
import { clampToArena } from '../physics/arenaBounds';
import { FlailChain } from '../physics/flailChain';
import { WobblySpring } from '../physics/wobblySpring';
import { createFlailMesh, type FlailVisual } from './flailMesh';
import { animateKnight, type KnightPose } from './knightAnimator';
import { createKnightMesh, type KnightRig } from './knightMesh';

const MAX_SPEED = 7;
const ACCELERATION_RATE = 10;
const DECELERATION_RATE = 7;
const TURN_SPEED = 12;
const KNIGHT_RADIUS = 0.7;
const WALK_CYCLE_RATE = 2.2;
const MIN_FACING_SPEED = 0.5;
const MIN_AIM_DISTANCE = 0.3;

function shortestAngle(from: number, to: number): number {
  const difference = to - from;
  return Math.atan2(Math.sin(difference), Math.cos(difference));
}

export class Player {
  readonly rig: KnightRig;
  readonly chain: FlailChain;
  private readonly flail: FlailVisual;
  private readonly wobble = new WobblySpring();
  private readonly velocity = new THREE.Vector3();
  private readonly previousVelocity = new THREE.Vector3();
  private readonly acceleration = new THREE.Vector3();
  private readonly moveDirection = new THREE.Vector3();
  private readonly aimTarget = new THREE.Vector3();
  private readonly anchorPosition = new THREE.Vector3();
  private readonly pose: KnightPose = { walkPhase: 0, speedRatio: 0, tilt: { pitch: 0, roll: 0 } };
  private yaw = 0;

  constructor(scene: THREE.Scene, private readonly input: Input) {
    this.rig = createKnightMesh();
    this.chain = new FlailChain(new THREE.Vector3());
    this.flail = createFlailMesh(this.chain.nodes.length - 1);
    this.rig.handSocket.add(this.flail.handle);
    scene.add(this.rig.root, this.flail.chainRoot);

    this.rig.root.updateMatrixWorld(true);
    this.chain.reset(this.flail.handleTip.getWorldPosition(this.anchorPosition));
    this.flail.sync(this.chain, 0);
  }

  get position(): THREE.Vector3 {
    return this.rig.root.position;
  }

  update(deltaSeconds: number): void {
    if (deltaSeconds <= 0) return;
    this.updateMovement(deltaSeconds);
    const yawRate = this.updateFacing(deltaSeconds);
    this.updatePose(deltaSeconds, yawRate);

    this.rig.root.updateMatrixWorld(true);
    this.chain.step(deltaSeconds, this.flail.handleTip.getWorldPosition(this.anchorPosition));
    this.flail.sync(this.chain, deltaSeconds);
  }

  private updateMovement(deltaSeconds: number): void {
    this.input.getMoveDirection(this.moveDirection);
    const hasInput = this.moveDirection.lengthSq() > 0;
    const rate = hasInput ? ACCELERATION_RATE : DECELERATION_RATE;
    const blend = 1 - Math.exp(-rate * deltaSeconds);

    this.previousVelocity.copy(this.velocity);
    this.velocity.lerp(this.moveDirection.multiplyScalar(MAX_SPEED), blend);
    this.acceleration.subVectors(this.velocity, this.previousVelocity).divideScalar(deltaSeconds);

    const position = this.rig.root.position;
    position.addScaledVector(this.velocity, deltaSeconds);
    const contact = clampToArena(position, KNIGHT_RADIUS);
    if (contact.hitX) this.velocity.x = 0;
    if (contact.hitZ) this.velocity.z = 0;
  }

  private updateFacing(deltaSeconds: number): number {
    const targetYaw = this.resolveTargetYaw();
    if (targetYaw === null) return 0;
    const difference = shortestAngle(this.yaw, targetYaw);
    const maxTurn = TURN_SPEED * deltaSeconds;
    const turn = Math.min(Math.max(difference, -maxTurn), maxTurn);
    this.yaw += turn;
    this.rig.root.rotation.y = this.yaw;
    return turn / deltaSeconds;
  }

  private resolveTargetYaw(): number | null {
    const position = this.rig.root.position;
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const prefersMovement = this.input.isAimIdle() && speed > MIN_FACING_SPEED;

    if (!prefersMovement) {
      const aim = this.input.getAimTarget(this.aimTarget);
      if (aim) {
        const deltaX = aim.x - position.x;
        const deltaZ = aim.z - position.z;
        if (Math.hypot(deltaX, deltaZ) > MIN_AIM_DISTANCE) return Math.atan2(deltaX, deltaZ);
      }
    }
    if (speed > MIN_FACING_SPEED) return Math.atan2(this.velocity.x, this.velocity.z);
    return null;
  }

  private updatePose(deltaSeconds: number, yawRate: number): void {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.pose.speedRatio = Math.min(speed / MAX_SPEED, 1);
    this.pose.walkPhase += speed * WALK_CYCLE_RATE * deltaSeconds;
    this.pose.tilt = this.wobble.update(deltaSeconds, this.acceleration, this.yaw, yawRate);
    animateKnight(this.rig, this.pose);
  }
}
