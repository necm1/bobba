import { Texture } from 'pixi.js';

export abstract class RoomAsset {
  constructor(public color: number, public texture: Texture) {}
  public async load(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
