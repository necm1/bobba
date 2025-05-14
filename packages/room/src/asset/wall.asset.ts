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
    const roomMaterials = await this._bobba.assetManager.get('room/assets');
    const asset = roomMaterials.wallData.walls.find(
      (asset: any) => asset.id === this._id.toString()
    );

    if (!asset) {
      throw new Error(`Asset with id ${this._id} not found`);
    }

    const { color, materialId } = asset.visualizations[0].layers[0];

    const assetTexture: { id: string; bitmaps: [] } =
      roomMaterials.wallData.textures.find((texture: any) => {
        return texture.id === materialId.toString();
      });

    if (!assetTexture || !assetTexture.bitmaps.length) {
      throw new Error(`Texture with id ${materialId} not found`);
    }

    const name: string = (assetTexture?.bitmaps as any)[0].assetName;
    const texture: Texture = (await this._bobba.assetManager.get('room/room'))
      .textures[`room_${name}.png`];
    const sprite: Sprite = new Sprite(texture);
    this.color = color;

    this.texture = new Texture(
      this._bobba.app.renderer.generateTexture(sprite).source
    );
  }
}
