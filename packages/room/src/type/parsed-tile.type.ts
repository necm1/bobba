import { ParsedTileWall } from './parsed-tile-wall.type';
import { TileKind } from './tile-kind.type';

export type ParsedTileType =
  | ParsedTileWall
  | { type: 'tile'; z: number }
  | { type: 'hidden' }
  | { type: 'stairs'; kind: 0 | 2; z: number }
  | { type: 'stairCorner'; kind: TileKind; z: number }
  | { type: 'door'; z: number };
