import { Container, Point, Sprite, Texture } from 'pixi.js';
import { Room } from './room';
import { Bobba } from '@bobba/core';
import { RoomTileAsset } from './asset/tile.asset';
import { RoomTileEntity } from './entity/tile.entity';
import { ParsedTileType } from './type/parsed-tile.type';
import { Vector2D, Vector3D } from '@bobba/utils';
import { ParsedTileWall } from './type/parsed-tile-wall.type';
import { RoomWallRightEntity } from './entity/wall-right.entity';
import { RoomWallLeftEntity } from './entity/wall-left.entity';
import { RoomWallOuterCornerEntity } from './entity/wall-outer-corner.entity';
import { RoomEntityData } from './type/room-entity-data.type';

export class RoomRenderer extends Container {
  private _hideWalls = false;
  private _hideFloor = false;

  private _tileMapBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };

  private _roomLayerContainer;

  private _behindWallLayer: Container = new Container();
  private _wallLayer: Container = new Container();
  private _tileLayer: Container = new Container();
  private _primaryLayer: Container = new Container();
  private _landscapeLayer: Container = new Container();
  private _wallHitAreaLayer: Container = new Container();
  private _masksLayer: Container = new Container();

  private _wallLeftColor: number | undefined;
  private _wallRightColor: number | undefined;
  private _wallTopColor: number | undefined;

  private _tileLeftColor: number | undefined;
  private _tileRightColor: number | undefined;
  private _tileTopColor: number | undefined;

  // private _walls: (WallLeft | WallRight | WallOuterCorner)[] = [];
  private _walls: (RoomWallLeftEntity | RoomWallOuterCornerEntity)[] = [];
  private _tiles: RoomTileEntity[] = [];
  // private _tileCursors: TileCursor[] = [];
  // private _masks: Map<string, RoomLandscapeMaskSprite> = new Map();

  private _borderWidth = 8;
  private _tileHeight = 8;
  private _wallHeight = 116;

  private _rebuildRoom = false;

  constructor(private readonly bobba: Bobba, private readonly room: Room) {
    super();

    this._tileMapBounds = room.tileMap.getTileMapBounds({
      x: this.room.tileMap.wallOffsets.x,
      y: this.room.tileMap.wallOffsets.y,
    });

    this._roomLayerContainer = new Container();
  }

  public async render(): Promise<void> {
    await this.prepareAssets();

    this._roomLayerContainer.addChild(this._behindWallLayer);
    this._roomLayerContainer.addChild(this._wallLayer);
    this._roomLayerContainer.addChild(this._wallHitAreaLayer);
    this._roomLayerContainer.addChild(this._tileLayer);
    this._roomLayerContainer.addChild(this._landscapeLayer);
    this._roomLayerContainer.addChild(this._primaryLayer);

    this._roomLayerContainer.addChild(this._masksLayer);
    this._roomLayerContainer.x = -this.roomBounds.minX;
    this._roomLayerContainer.y = -this.roomBounds.minY;
    this._primaryLayer.sortableChildren = true;
    this._tileLayer.sortableChildren = true;

    this.addChild(this._roomLayerContainer);

    this._renderTileMap();
    console.log('Room renderer rendered', this._tiles);
  }

  public async prepareAssets(): Promise<void> {
    this.room.floorAsset.texture._source.scaleMode = 'nearest';
    await this.room.floorAsset
      .load()
      .then(() => console.log('Floor asset loaded'));
    await this.room.wallAsset
      .load()
      .then(() => console.log('Wall asset loaded'));

    // this.room.wallAsset.load();
  }

  private async _renderTileMap(): Promise<void> {
    for (let y = 0; y < this.room.tileMap.parsedTileTypes.length; y++) {
      for (let x = 0; x < this.room.tileMap.parsedTileTypes[y].length; x++) {
        const cell = this.room.tileMap.parsedTileTypes[y][x];

        await this._renderEntity(cell, { x, y });
      }
    }

    await this._updateEntities();

    this._roomLayerContainer.x = -this.roomBounds.minX;
    this._roomLayerContainer.y = -this.roomBounds.minY;
  }

  private async _updateEntities(): Promise<void> {
    [...this._tiles, ...this._walls].forEach(
      async (tile) => await tile.update(this.currentRoomEntityData)
    );
  }

  private async _renderEntity(element: ParsedTileType, { x, y }: Vector2D) {
    switch (element.type) {
      case 'wall': {
        await this._renderWall({ x, y }, element);
        break;
      }
      case 'tile': {
        await this._renderTile({ x, y, z: element.z });
        break;
      }

      case 'door':
        await this._renderDoor({ x, y, z: element.z });
        break;
    }
  }

  private _getPosition(
    roomX: number,
    roomY: number,
    roomZ: number
  ): { x: number; y: number } {
    const getBasePosition = () => {
      return { x: roomX, y: roomY };
    };

    const { x, y } = getBasePosition();

    const base = 32;

    // TODO: Right now we are subtracting the tileMapBounds here.
    // This is so the landscapes work correctly. This has something with the mask position being negative for some walls.
    // This fixes it for now.
    const xPos = x * base - y * base;
    const yPos = x * (base / 2) + y * (base / 2);

    return {
      x: xPos,
      y: yPos - roomZ * 32,
    };
  }

  private async _renderDoor({ x, y, z }: Vector3D): Promise<void> {
    await this._renderTile({ x, y, z }, this._behindWallLayer);
    this._renderLeftWall({ x, y, z, hideBorder: false, cutHeight: 90 });
  }

  private async _renderWall({ x, y }: Vector2D, element: ParsedTileWall) {
    if (this._hideWalls || this._hideFloor) {
      return;
    }

    const height = element.height;

    switch (element.kind) {
      case 'colWall':
        await this._renderRightWall({
          x,
          y,
          z: height,
          hideBorder: element.hideBorder,
        });
        break;
      case 'rowWall':
        await this._renderLeftWall({
          x,
          y,
          z: height,
          hideBorder: element.hideBorder,
        });
        break;

      case 'innerCorner':
        this._renderRightWall({ x, y, z: height });
        this._renderLeftWall({ x, y, z: height, hideBorder: true });
        break;

      case 'outerCorner':
        await this._renderOuterCornerWall({ x, y, z: height });
        break;
    }
  }

  private async _renderOuterCornerWall({
    x: roomX,
    y: roomY,
    z: roomZ,
  }: Vector3D): Promise<void> {
    const wall = new RoomWallOuterCornerEntity(this.room, {});

    const { x, y } = this._getPosition(roomX + 1, roomY, roomZ);
    wall.x = x;
    wall.y = y;
    wall.roomZ = roomZ;

    await wall.render();

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  private async _renderLeftWall({
    x,
    y,
    z,
    hideBorder = false,
    cutHeight,
  }: Vector3D & { hideBorder?: boolean; cutHeight?: number }) {
    const wall = new RoomWallLeftEntity(this.room, {
      hideBorder,
      hitAreaContainer: this._wallHitAreaLayer,
      cutHeight,
    });

    const { x: actualX, y: actualY } = this._getPosition(x + 1, y, z);
    wall.x = actualX;
    wall.y = actualY;
    wall.roomZ = z;

    await wall.render();

    console.log('Left wall', wall);

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  private async _renderRightWall({
    x,
    y,
    z,
    hideBorder = false,
  }: Vector3D & { hideBorder?: boolean }) {
    const wall = new RoomWallRightEntity(this.room, {
      hideBorder,
      hitAreaContainer: this._wallHitAreaLayer,
    });

    const { x: actualX, y: actualY } = this._getPosition(x, y + 1, z);
    wall.x = actualX + 32;
    wall.y = actualY;
    wall.roomZ = z;

    await wall.render();

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  private async _renderTile({ x, y, z }: Vector3D, container?: Container) {
    if (this._hideFloor) {
      return;
    }

    const tile = new RoomTileEntity(this.room, {
      color: '#eeeeee',
      height: this._tileHeight,
    });

    const xEven = x % 2 === 0;
    const yEven = y % 2 === 0;

    tile.tilePositions = new Point(xEven ? 32 : 0, yEven ? 32 : 0);
    const position = this._getPosition(x, y, z);

    tile.x = position.x;
    tile.y = position.y;

    await tile.render();

    (container ?? this._tileLayer).addChild(tile);
    this._tiles.push(tile);
  }

  public get hideWalls() {
    return this._hideWalls;
  }

  public set hideWalls(value) {
    this._hideWalls = value;
    this._rebuildRoom = true;
  }

  public get hideFloor() {
    return this._hideFloor;
  }

  public set hideFloor(value) {
    this._hideFloor = value;
    this._rebuildRoom = true;
  }

  public get roomBounds() {
    const hasWalls = this.hideWalls || this.hideFloor;

    const minOffsetY = hasWalls ? 0 : -this._wallHeight - this._borderWidth;
    const minXOffset = hasWalls ? 0 : -this._borderWidth;
    const maxOffsetX = hasWalls ? 0 : this._borderWidth;
    const maxOffsetY = hasWalls ? 0 : this._tileHeight;

    return {
      minX: this._tileMapBounds.minX + minXOffset,
      maxX: this._tileMapBounds.maxX + maxOffsetX,
      minY: this._tileMapBounds.minY + minOffsetY,
      maxY: this._tileMapBounds.maxY + maxOffsetY,
    };
  }

  private get currentRoomEntityData(): RoomEntityData {
    return {
      borderWidth: this._borderWidth,
      tileHeight: this._tileHeight,
      wallHeight: this.largestWallHeight,
      wallLeftColor: this._wallLeftColor ?? 0x91949f,
      wallRightColor: this._wallRightColor ?? 0xbbbecd,
      wallTopColor: this._wallTopColor ?? 0x70727b,
      tileLeftColor: this._tileLeftColor ?? 0x838357,
      tileRightColor: this._tileRightColor ?? 0x666644,
      tileTopColor: this._tileTopColor ?? 0x989865,
      tileTexture: this.room.floorAsset ?? Texture.WHITE,
      wallTexture: this.room.wallAsset ?? Texture.WHITE,
      // masks: this._masks,
      masks: new Map<string, Sprite>(),
    };
  }

  private get largestWallHeight() {
    return this.room.tileMap.parsedTileMap.largestDiff * 32 + this._wallHeight;
  }
}
