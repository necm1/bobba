import { Container, Point, SCALE_MODES, Texture } from 'pixi.js';
import { Room } from './room';
import { Bobba } from '@bobba/core';
import { RoomTileAsset } from './asset/tile.asset';
import { RoomTileEntity } from './entity/tile.entity';
import { ParsedTileType } from './type/parsed-tile.type';
import { Vector2D, Vector3D } from '@bobba/utils';

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

  private _wallTexture: RoomTileAsset | undefined;
  private _floorTexture: Texture | undefined;

  // private _walls: (WallLeft | WallRight | WallOuterCorner)[] = [];
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

    // this.room.wallAsset.load();
  }

  private async _renderTileMap(): Promise<void> {
    for (let y = 0; y < this.room.tileMap.parsedTileTypes.length; y++) {
      for (let x = 0; x < this.room.tileMap.parsedTileTypes[y].length; x++) {
        const cell = this.room.tileMap.parsedTileTypes[y][x];

        await this._renderEntity(cell, { x, y });
      }
    }

    this._roomLayerContainer.x = -this.roomBounds.minX;
    this._roomLayerContainer.y = -this.roomBounds.minY;
  }

  private async _renderEntity(element: ParsedTileType, { x, y }: Vector2D) {
    switch (element.type) {
      case 'tile': {
        await this._renderTile({ x, y, z: element.z });
        break;
      }
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
}
