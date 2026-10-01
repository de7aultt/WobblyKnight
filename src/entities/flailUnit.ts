import * as THREE from 'three';
import { FlailChain } from '../physics/flailChain';
import { createFlailMesh, type FlailVisual } from './flailMesh';

export class FlailUnit {
  readonly chain: FlailChain;
  private readonly visual: FlailVisual;
  private readonly anchorPosition = new THREE.Vector3();

  constructor(scene: THREE.Scene, socket: THREE.Object3D) {
    this.chain = new FlailChain(new THREE.Vector3());
    this.visual = createFlailMesh(this.chain.nodes.length - 1);
    socket.add(this.visual.handle);
    scene.add(this.visual.chainRoot);

    this.visual.handleTip.updateWorldMatrix(true, false);
    this.chain.reset(this.visual.handleTip.getWorldPosition(this.anchorPosition));
    this.visual.sync(this.chain, 0);
  }

  setReach(multiplier: number): void {
    this.chain.setReachMultiplier(multiplier);
  }

  update(deltaSeconds: number): void {
    this.chain.step(deltaSeconds, this.visual.handleTip.getWorldPosition(this.anchorPosition));
    this.visual.sync(this.chain, deltaSeconds);
  }
}
