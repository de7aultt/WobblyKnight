import * as THREE from 'three';
import type { WeaponId } from '../core/armoryItems';
import { FlailChain } from '../physics/flailChain';
import { createFlailMesh, type FlailVisual } from './flailMesh';
import { chainSettingsFor } from './flailVariants';

export class FlailUnit {
  readonly chain: FlailChain;
  private readonly visual: FlailVisual;
  private readonly anchorPosition = new THREE.Vector3();

  constructor(scene: THREE.Scene, socket: THREE.Object3D, weapon: WeaponId) {
    this.chain = new FlailChain(new THREE.Vector3(), chainSettingsFor(weapon));
    this.visual = createFlailMesh(this.chain.nodes.length - 1, weapon);
    socket.add(this.visual.handle);
    scene.add(this.visual.chainRoot);

    this.visual.handleTip.updateWorldMatrix(true, false);
    this.chain.reset(this.visual.handleTip.getWorldPosition(this.anchorPosition));
    this.visual.sync(this.chain, 0);
  }

  reset(): void {
    this.visual.handleTip.updateWorldMatrix(true, false);
    this.chain.reset(this.visual.handleTip.getWorldPosition(this.anchorPosition));
    this.visual.sync(this.chain, 0);
  }

  dispose(): void {
    [this.visual.handle, this.visual.chainRoot].forEach((root) => {
      root.removeFromParent();
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
    });
  }

  setReach(multiplier: number): void {
    this.chain.setReachMultiplier(multiplier);
  }

  update(deltaSeconds: number): void {
    this.chain.step(deltaSeconds, this.visual.handleTip.getWorldPosition(this.anchorPosition));
    this.visual.sync(this.chain, deltaSeconds);
  }
}
