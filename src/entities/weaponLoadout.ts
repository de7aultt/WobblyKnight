import type * as THREE from 'three';
import type { WeaponId } from '../core/armoryItems';
import type { PlayerStats } from '../core/playerStats';
import type { FlailChain } from '../physics/flailChain';
import { FlailUnit } from './flailUnit';
import type { KnightRig } from './knightMesh';

export class WeaponLoadout {
  readonly chains: FlailChain[] = [];
  private readonly units: FlailUnit[] = [];
  private weapon: WeaponId = 'iron_morningstar';

  constructor(
    private readonly scene: THREE.Scene,
    private readonly rig: KnightRig,
    private readonly stats: PlayerStats
  ) {}

  setWeapon(weapon: WeaponId): void {
    this.weapon = weapon;
    this.rebuild();
  }

  rebuild(): void {
    this.units.forEach((unit) => unit.dispose());
    this.units.length = 0;
    this.chains.length = 0;
    this.equip(this.rig.handSocket);
    if (this.hasSecondFlail()) this.equip(this.rig.leftHandSocket);
  }

  applyStats(): void {
    if (this.hasSecondFlail() && this.units.length < 2) this.equip(this.rig.leftHandSocket);
    this.units.forEach((unit) => unit.setReach(this.stats.chainReach));
  }

  update(deltaSeconds: number): void {
    this.units.forEach((unit) => unit.update(deltaSeconds));
  }

  private hasSecondFlail(): boolean {
    return this.stats.hasDoubleFlail || this.stats.weaponDual;
  }

  private equip(socket: THREE.Object3D): void {
    const unit = new FlailUnit(this.scene, socket, this.weapon);
    unit.setReach(this.stats.chainReach);
    this.units.push(unit);
    this.chains.push(unit.chain);
  }
}
