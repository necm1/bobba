import { Bobba } from '@bobba/core';
import { Sprite, Texture } from 'pixi.js';
import { RoomAsset } from '../interface/room-asset.interface';
import { Vector2D, Vector3D } from '@bobba/utils';

export type TileInfo = {
  coords: Vector3D;
  size: Vector2D;
  door: boolean;
};

export class RoomWallAsset extends RoomAsset {
  constructor(
    private readonly _bobba: Bobba,
    private readonly _id: number,
    color = 0xffffff,
    texture = Texture.WHITE
  ) {
    super(color, texture);
  }

  public override async load(): Promise<void> {
    const roomMaterials = await this._bobba.assetManager.get('room/materials');
    const asset = roomMaterials.data.materials.walls.find(
      (asset: any) => asset.id === this._id
    );

    if (!asset) {
      throw new Error(`Asset with id ${this._id} not found`);
    }

    const sprite = new Sprite(roomMaterials.textures[asset.texture]);
    this.color = asset.color;
    this.texture = new Texture(
      this._bobba.app.renderer.generateTexture(sprite)._source
    );
  }
}
