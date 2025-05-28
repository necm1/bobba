import { Vector2D } from '@bobba/utils';
import { ParsedTileType } from './parsed-tile.type';

export type ParsedTileMap = {
  tilemap: ParsedTileType[][];
  largestDiff: number;
  wallOffsets: Vector2D;
  positionOffsets: Vector2D;
  maskOffsets: Vector2D;
};
