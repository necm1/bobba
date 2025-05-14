import { Vector2D, Vector3D } from '@bobba/utils';
import { RoomAsset } from './room-asset.interface';

export type TileInfo = {
  coords: Vector3D;
  size: Vector2D;
  door: boolean;
};

export interface RoomTileEntityConfiguration {
  asset?: RoomAsset;
  color: string;
  height: number;
  edge?: boolean;
  door?: boolean;
}
