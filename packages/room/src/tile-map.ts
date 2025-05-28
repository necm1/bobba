import { Vector2D } from '@bobba/utils';
import { TileType } from './type/tile.type';
import { ParsedTileMap } from './type/parsed-tile-map.type';
import { RowWall } from './type/row-wall.type';
import { ColumnWall } from './type/column-wall.type';
import { ParsedTileType } from './type/parsed-tile.type';
import { Point } from 'pixi.js';

const offsets = {
  none: { x: 0, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  topLeft: { x: -1, y: -1 },
  bottomLeft: { x: -1, y: 1 },
  right: { x: 1, y: 0 },
  topRight: { x: 1, y: -1 },
  bottomRight: { x: 1, y: 1 },
};

export class RoomTileMap {
  private _map: TileType[][];
  private _parsedTileMap: ParsedTileMap;

  private _rowWalls = new Map<string, RowWall>();
  private _columnWalls = new Map<string, ColumnWall>();

  constructor(tileMap: string) {
    this._map = this.parseMapFromString(tileMap);
    this._parsedTileMap = this.parseTileMap(this._map);
  }

  public padTileMap() {
    const firstRow = this._map[0];
    if (firstRow == null) throw new Error('Invalid row');

    let offsetY = 0;
    let offsetX = 0;

    if (firstRow.some((type) => type !== 'x')) {
      this._map = [firstRow.map(() => 'x' as const), ...this._map];
      offsetY += 1;
    }

    const nonPrefixedRows = this._map.filter((row) => row[0] !== 'x');
    if (nonPrefixedRows.length > 1) {
      this._map = this._map.map((row): TileType[] => ['x', ...row]);
      offsetX += 1;
    }

    return {
      map: this._map,
      offsetX,
      offsetY,
    };
  }

  private parseMapFromString(tileMap: string): TileType[][] {
    if (!tileMap) {
      throw new Error('Tile map cannot be empty.');
    }

    tileMap = tileMap.replace(/ /g, '').replace(/\n\n/g, '\n');
    return tileMap
      .split(/\r?\n/)
      .map((row: string) => row.trim())
      .filter((row: string) => row.length)
      .map((line) => line.split('').map((char) => char as TileType));
  }

  private parseTileMap(tileMap: TileType[][]): ParsedTileMap {
    const rowWalls = this.getRowWalls();
    const columnWalls = this.getColumnWalls();

    rowWalls.forEach((info) => {
      for (let y = info.startY; y <= info.endY; y++) {
        this._rowWalls.set(`${info.x}_${y}`, info);
      }
    });

    columnWalls.forEach((info) => {
      for (let x = info.startX; x <= info.endX; x++) {
        this._columnWalls.set(`${x}_${info.y}`, info);
      }
    });

    this.padTileMap();

    const result: ParsedTileType[][] = this._map.map((row) =>
      row.map(() => ({ type: 'hidden' as const }))
    );

    let lowestTile: number | undefined;
    let highestTile: number | undefined;
    let hasDoor = false;

    function applyHighLowTile(current: number) {
      if (highestTile == null || current > highestTile) {
        highestTile = current;
      }

      if (lowestTile == null || current < lowestTile) {
        lowestTile = current;
      }
    }

    for (let y = 0; y < this._map.length; y++) {
      for (let x = 0; x < this._map[y].length; x++) {
        const resultX = x;
        const resultY = y;

        const tileInfo = this.getTileInfo({ x, y });
        const tileInfoBelow = this.getTileInfo({ x, y: y + 1 });
        const tileInfoRight = this.getTileInfo({ x: x + 1, y });

        const wall = this.getWall({ x, y });

        if (wall != null) {
          switch (wall.kind) {
            case 'column': {
              const colWallHeightDiff =
                tileInfoBelow.height != null
                  ? Math.abs(tileInfoBelow.height - wall.height)
                  : 0;

              result[resultY][resultX] = {
                kind: 'colWall',
                type: 'wall',
                height: wall.height,
                hideBorder: colWallHeightDiff > 0,
              };
              break;
            }

            case 'row': {
              const rowWallHeightDiff =
                tileInfoRight.height != null
                  ? Math.abs(tileInfoRight.height - wall.height)
                  : 0;

              result[resultY][resultX] = {
                kind: 'rowWall',
                type: 'wall',
                height: wall.height,
                hideBorder: tileInfoBelow.rowDoor || rowWallHeightDiff > 0,
              };
              break;
            }

            case 'innerCorner': {
              result[resultY][resultX] = {
                kind: 'innerCorner',
                type: 'wall',
                height: wall.height,
              };
              break;
            }

            case 'outerCorner': {
              result[resultY][resultX] = {
                kind: 'outerCorner',
                type: 'wall',
                height: wall.height,
              };
              break;
            }
          }
        }

        if (!tileInfo.rowDoor || hasDoor) {
          if (tileInfo.stairs != null && tileInfo.height != null) {
            if (tileInfo.stairs.isCorner) {
              result[resultY][resultX] = {
                type: 'stairCorner',
                kind: tileInfo.stairs.cornerType,
                z: tileInfo.height,
              };
            } else if (tileInfo.stairs.direction != null) {
              result[resultY][resultX] = {
                type: 'stairs',
                kind: tileInfo.stairs.direction,
                z: tileInfo.height,
              };
            }

            applyHighLowTile(tileInfo.height);
          } else if (tileInfo.height != null) {
            result[resultY][resultX] = { type: 'tile', z: tileInfo.height };
            applyHighLowTile(tileInfo.height);
          }
        } else {
          hasDoor = true;
          result[resultY][resultX] = { type: 'door', z: tileInfo.height ?? 0 };
        }
      }
    }

    let largestDiff = 0;

    if (lowestTile != null && highestTile != null) {
      largestDiff = highestTile - lowestTile;
    }

    const wallOffsets = {
      x: 1,
      y: 1,
    };

    return {
      tilemap: result,
      largestDiff,
      wallOffsets,
      // When the tilemap has a door, we offset the objects in the room by one in the x direction.
      // This makes it so objects appear at the same position, for a room without a door
      // and for a room with a door.
      positionOffsets: { x: 0, y: 0 },
      maskOffsets: { x: -wallOffsets.x, y: -wallOffsets.y },
    };
  }

  public getTile({ x, y }: Vector2D, offset: keyof typeof offsets = 'none') {
    x = x + offsets[offset].x;
    y = y + offsets[offset].y;

    if (!this._map[y] || !this._map[y][x]) {
      return 'x';
    }

    return this.getNumberOfTileType(this._map[y][x]);
  }

  public getNumberOfTileType(tileType: TileType): number | 'x' {
    if (tileType === 'x' || tileType == null) return 'x';
    const parsedNumber = Number(tileType);
    if (isNaN(parsedNumber)) {
      const offset = 9;
      return tileType.charCodeAt(0) - 96 + offset;
    }
    return parsedNumber;
  }

  public isTile(type: number | 'x'): type is number {
    return !isNaN(Number(type));
  }

  public getStairs(x: number, y: number) {
    const type = this.getTile({ x, y });
    const topType = this.getTile({ x, y }, 'top');
    const leftType = this.getTile({ x, y }, 'left');
    const rightType = this.getTile({ x, y }, 'right');
    const topLeftType = this.getTile({ x, y }, 'topLeft');
    const bottomLeftType = this.getTile({ x, y }, 'bottomLeft');
    const topRightType = this.getTile({ x, y }, 'topRight');

    if (this.isTile(topType) && this.isTile(type)) {
      const diff = Number(topType) - Number(type);

      if (diff === 1) {
        return { direction: 0 as const };
      }
    }

    if (this.isTile(leftType) && this.isTile(type)) {
      const diff = Number(leftType) - Number(type);

      if (diff === 1) {
        return { direction: 2 as const };
      }
    }

    if (
      this.isTile(bottomLeftType) &&
      this.isTile(type) &&
      (leftType === 'x' || Number(leftType) <= Number(type))
    ) {
      const diff = Number(bottomLeftType) - Number(type);
      if (diff === 1) {
        return { cornerType: 'left' as const, isCorner: true };
      }
    }

    if (
      this.isTile(topRightType) &&
      this.isTile(type) &&
      (rightType === 'x' || Number(rightType) <= Number(type))
    ) {
      const diff = Number(topRightType) - Number(type);
      if (diff === 1) {
        return { cornerType: 'right' as const, isCorner: true };
      }
    }

    if (
      this.isTile(topLeftType) &&
      this.isTile(type) &&
      (leftType === 'x' || Number(leftType) <= Number(type))
    ) {
      const diff = Number(topLeftType) - Number(type);
      if (diff === 1) {
        return { cornerType: 'front' as const, isCorner: true };
      }
    }
  }

  public getTileInfo({ x, y }: Vector2D) {
    const type = this.getTile({ x, y });

    const leftType = this.getTile({ x: x - 1, y });
    const topType = this.getTile({ x, y: y - 1 });

    const topLeftDiagonalType = this.getTile({ x: x - 1, y: y - 1 });
    const bottomLeftDiagonalType = this.getTile({ x: x - 1, y: y + 1 });
    const bottomType = this.getTile({ x, y: y + 1 });
    const rightType = this.getTile({ x: x + 1, y });

    // A row door can be identified if its surrounded by nothing to the left, top and bottom.
    const rowDoor =
      topType === 'x' &&
      leftType === 'x' &&
      topLeftDiagonalType === 'x' &&
      bottomType === 'x' &&
      bottomLeftDiagonalType === 'x' &&
      this.isTile(rightType) &&
      this.isTile(type);

    const stairs = this.getStairs(x, y);
    const baseHeight = this.isTile(type) ? type : undefined;

    return {
      rowEdge: leftType === 'x' && this.isTile(type),
      colEdge: topType === 'x' && this.isTile(type),
      innerEdge:
        topLeftDiagonalType === 'x' &&
        this.isTile(type) &&
        this.isTile(topType) &&
        this.isTile(leftType),
      stairs: stairs,
      height: baseHeight,
      rowDoor: rowDoor,
    };
  }

  public getRowWalls() {
    let lastY = this._map.length - 1;

    let wallEndY: number | undefined;
    let wallStartY: number | undefined;
    let height: number | undefined;

    const walls: RowWall[] = [];

    for (let x = 0; x < this._map[0].length; x++) {
      for (let y = lastY; y >= 0; y--) {
        const current = this.getTileInfo({ x, y });

        if (current.rowEdge && !current.rowDoor) {
          if (wallEndY == null) {
            wallEndY = y;
          }

          wallStartY = y;
          lastY = y - 1;

          if (height == null || (current.height ?? 0) < height) {
            height = current.height;
          }
        } else {
          if (wallEndY != null && wallStartY != null) {
            walls.push({
              startY: wallStartY,
              endY: wallEndY,
              x: x - 1,
              height: height ?? 0,
            });
            wallEndY = undefined;
            wallStartY = undefined;
            height = undefined;
          }
        }
      }
    }

    return walls;
  }

  public getColumnWalls() {
    let lastX = this._map[0].length - 1;

    let wallEndX: number | undefined;
    let wallStartX: number | undefined;
    let height: number | undefined;

    const walls: ColumnWall[] = [];

    for (let y = 0; y < this._map.length; y++) {
      for (let x = lastX; x >= 0; x--) {
        const current = this.getTileInfo({ x, y });

        if (current.colEdge && !current.rowDoor) {
          if (wallEndX == null) {
            wallEndX = x;
          }

          wallStartX = x;
          lastX = x - 1;
          if (height == null || (current.height ?? 0) < height) {
            height = current.height;
          }
        } else {
          if (wallEndX != null && wallStartX != null) {
            walls.push({
              startX: wallStartX,
              endX: wallEndX,
              y: y - 1,
              height: height ?? 0,
            });
            wallEndX = undefined;
            wallStartX = undefined;
            height = undefined;
          }
        }
      }
    }

    return walls;
  }

  public getWall({ x, y }: Vector2D) {
    const rightColWall = this._columnWalls.get(`${x + 1}_${y}`);
    const bottomRowWall = this._rowWalls.get(`${x}_${y + 1}`);

    if (rightColWall != null && bottomRowWall != null) {
      // This is a outer corner
      return {
        kind: 'outerCorner' as const,
        height: Math.min(rightColWall.height, bottomRowWall.height),
      };
    }

    const leftColWall = this._columnWalls.get(`${x}_${y}`);
    const topRowWall = this._rowWalls.get(`${x}_${y}`);

    if (leftColWall != null && topRowWall != null) {
      return {
        kind: 'innerCorner' as const,
        height: Math.min(leftColWall.height, topRowWall.height),
      };
    }

    const rowWall = this._rowWalls.get(`${x}_${y}`);
    if (rowWall != null)
      return {
        kind: 'row' as const,
        height: rowWall.height,
      };

    const colWall = this._columnWalls.get(`${x}_${y}`);
    if (colWall != null) return { kind: 'column', height: colWall.height };
  }

  public getPosition(
    roomX: number,
    roomY: number,
    roomZ: number,
    wallOffsets: Vector2D
  ) {
    roomX = roomX + wallOffsets.x;
    roomY = roomY + wallOffsets.y;

    const base = 32;

    const xPos = roomX * base - roomY * base;
    const yPos = roomX * (base / 2) + roomY * (base / 2);

    return {
      x: xPos,
      y: yPos - roomZ * 32,
    };
  }

  public getTileMapBounds(wallOffsets: Vector2D) {
    let minX: number | undefined;
    let minY: number | undefined;

    let maxX: number | undefined;
    let maxY: number | undefined;

    this.parsedTileTypes.forEach((row, y) => {
      row.forEach((column, x) => {
        if (column.type !== 'tile') return;
        const position = this.getPosition(x, y, column.z, wallOffsets);
        const localMaxX = position.x + 64;
        const localMaxY = position.y + 32;

        if (minX == null || position.x < minX) {
          minX = position.x;
        }

        if (minY == null || position.y < minY) {
          minY = position.y;
        }

        if (maxX == null || localMaxX > maxX) {
          maxX = localMaxX;
        }

        if (maxY == null || localMaxY > maxY) {
          maxY = localMaxY;
        }
      });
    });

    if (minX == null || minY == null || maxX == null || maxY == null) {
      throw new Error('Couldnt figure out dimensions');
    }

    return {
      minX,
      minY: minY - 32,
      maxX,
      maxY: maxY - 32,
    };
  }

  public getTilePosition(roomX: number, roomY: number) {
    const xEven = roomX % 2 === 0;
    const yEven = roomY % 2 === 0;

    return new Point(xEven ? 0 : 32, yEven ? 32 : 0);
  }

  public get map() {
    return this._map;
  }

  public get parsedTileMap() {
    return this._parsedTileMap;
  }

  public get largestDiff() {
    return this.parsedTileMap.largestDiff;
  }

  public get parsedTileTypes() {
    return this.parsedTileMap.tilemap;
  }

  public get wallOffsets() {
    return this.parsedTileMap.wallOffsets;
  }
}
