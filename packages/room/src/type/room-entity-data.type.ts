import { Sprite } from 'pixi.js';
import { RoomAsset } from '../interface/room-asset.interface';

export type RoomEntityData = {
  wallHeight: number;
  borderWidth: number;
  tileHeight: number;
  wallLeftColor: number;
  wallRightColor: number;
  wallTopColor: number;
  wallTexture: RoomAsset;
  tileLeftColor: number;
  tileRightColor: number;
  tileTopColor: number;
  tileTexture: RoomAsset;
  masks: Map<string, Sprite>;
};
