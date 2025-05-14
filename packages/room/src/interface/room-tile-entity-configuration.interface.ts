import { RoomAsset } from './room-asset.interface';

export interface RoomTileEntityConfiguration {
  asset?: RoomAsset;
  color: string;
  height: number;
  tileLeftColor?: string;
  tileRightColor?: string;
  tileTopColor?: string;
}
