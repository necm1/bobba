import { WallKind } from './wall-kind.type';

export type ParsedTileWall = {
  type: 'wall';
  kind: WallKind;
  height: number;
  hideBorder?: boolean;
};
