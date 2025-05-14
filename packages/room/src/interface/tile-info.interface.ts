import { Direction, StairType, WallType } from '@bobba/utils';

export interface TileInfo {
  tile: boolean;
  door: boolean;
  height: number;
  stairType: { type: StairType; direction: Direction } | undefined;
  wallType: WallType | undefined;
}
