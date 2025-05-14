import { Bobba } from '@bobba/core';
import { Sprite, Texture } from 'pixi.js';
import { RoomAsset } from '../interface/room-asset.interface';
import { Vector2D, Vector3D } from '@bobba/utils';

export type TileInfo = {
  coords: Vector3D;
  size: Vector2D;
  door: boolean;
};

export class RoomTileAsset extends RoomAsset {
  constructor(
    private readonly _bobba: Bobba,
    private readonly _id: number,
    color = 0xffffff,
    texture = Texture.WHITE
  ) {
    super(color, texture);
  }

  public override async load(): Promise<void> {
    const assets: {
      floorData: {
        textures: any[];
        floors: Array<{
          id: string;
          visualizations: { size: number; layers: any }[];
        }>;
      };
    } = await this._bobba.assetManager.get('room/assets');

    const asset = assets.floorData.floors.find((asset) => {
      return asset.id === this._id.toString();
    });

    if (!asset) {
      throw new Error(`Asset with id ${this._id} not found`);
    }

    const { color, materialId } = asset.visualizations[0].layers[0];

    const assetTexture: { id: string; bitmaps: unknown[] } =
      assets.floorData.textures.find((texture) => {
        return texture.id === materialId.toString();
      });

    if (!assetTexture || !assetTexture.bitmaps[0]) {
      throw new Error(`Asset texture with id ${materialId} not found`);
    }

    const name: string = (assetTexture.bitmaps[0 as number] as any).assetName;
    const texture: Texture = (await this._bobba.assetManager.get('room/room'))
      .textures[`room_${name}.png`];

    const sprite = new Sprite(texture);

    this.color = color;
    this.texture = new Texture(
      this._bobba.app.renderer.generateTexture(sprite)._source
    );
  }
}
