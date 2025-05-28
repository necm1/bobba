import { Bobba } from '@bobba/core';
import { Vector2D, Vector3D } from '@bobba/utils';
import { Container, Sprite, Texture } from 'pixi.js';
import { Room } from '../room';
import { ParsedTileType } from '../type/parsed-tile.type';
import { RoomEntityData } from '../type/room-entity-data.type';
import { RoomTileRenderer } from './tile.renderer';
import { RoomWallRenderer } from './wall.renderer';
import { RoomStairRenderer } from './stair.renderer';
import { RoomTileCursorRenderer } from './tile-cursor.renderer';

export class RoomRenderer extends Container {
  private _hideWalls = false;
  private _hideFloor = false;

  private _roomWallRenderer: RoomWallRenderer;
  private _roomTileRenderer: RoomTileRenderer;
  private _roomStairRenderer: RoomStairRenderer;
  private _roomTileCursorRenderer: RoomTileCursorRenderer;

  private _tileMapBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };

  private _roomLayerContainer;

  private _tileLayer: Container = new Container();
  private _primaryLayer: Container = new Container();
  private _masksLayer: Container = new Container();

  private _wallLeftColor: number | undefined;
  private _wallRightColor: number | undefined;
  private _wallTopColor: number | undefined;

  private _tileLeftColor: number | undefined;
  private _tileRightColor: number | undefined;
  private _tileTopColor: number | undefined;

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

    const deps = {
      bobba,
      room,
    };

    this._roomLayerContainer = new Container();

    this._roomWallRenderer = new RoomWallRenderer({
      hideFloor: this.hideFloor,
      hideWalls: this.hideWalls,
      ...deps,
    });

    this._roomTileRenderer = new RoomTileRenderer({
      hideFloor: this.hideFloor,
      tileHeight: this._tileHeight,
      tileTopColor: this._tileTopColor?.toString(),
      tileLeftColor: this._tileLeftColor?.toString(),
      tileRightColor: this._tileRightColor?.toString(),
      ...deps,
    });

    this._roomStairRenderer = new RoomStairRenderer({
      tileHeight: this._tileHeight,
      tileTopColor: (this._tileTopColor ?? 0x989865).toString(),
      tileLeftColor: (this._tileLeftColor ?? 0x838357).toString(),
      tileRightColor: (this._tileRightColor ?? 0x666644).toString(),
      roomTileRenderer: this._roomTileRenderer,
      ...deps,
    });

    this._roomTileCursorRenderer = new RoomTileCursorRenderer({
      primaryLayer: this._primaryLayer,
      ...deps,
    });
  }

  public async render(): Promise<void> {
    await this.prepareAssets();

    this._roomLayerContainer.addChild(this._roomWallRenderer.behindWallLayer);
    this._roomLayerContainer.addChild(this._roomWallRenderer.wallLayer);
    this._roomLayerContainer.addChild(this._roomWallRenderer.wallHitAreaLayer);
    this._roomLayerContainer.addChild(this._roomTileRenderer.tileLayer);
    this._roomLayerContainer.addChild(this._roomWallRenderer.landscapeLayer);
    this._roomLayerContainer.addChild(this._primaryLayer);

    this._roomLayerContainer.addChild(this._masksLayer);

    this._roomLayerContainer.x = -this.roomBounds.minX;
    this._roomLayerContainer.y = -this.roomBounds.minY;

    this._primaryLayer.sortableChildren = true;
    this._tileLayer.sortableChildren = true;

    this.addChild(this._roomLayerContainer);

    this._renderTileMap();
  }

  public async prepareAssets(): Promise<void> {
    await Promise.all([
      this._roomTileRenderer.prepareAssets(),
      this._roomWallRenderer.prepareAssets(),
      this._roomStairRenderer.prepareAssets(),
    ]);
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
    [...this._roomTileRenderer.tiles, ...this._roomWallRenderer.walls].forEach(
      async (tile) => await tile.update(this.currentRoomEntityData)
    );
  }

  private async _renderEntity(element: ParsedTileType, { x, y }: Vector2D) {
    switch (element.type) {
      case 'wall': {
        await this._roomWallRenderer.render({ x, y }, element);
        break;
      }
      case 'tile': {
        await this._roomTileRenderer.render({ x, y, z: element.z });
        await this._roomTileCursorRenderer.render({
          x,
          y,
          z: element.z,
        });
        break;
      }

      case 'door':
        await this._renderDoor({ x, y, z: element.z });
        break;

      case 'stairs':
        await this._roomStairRenderer.render(
          { x, y, z: element.z },
          false,
          element.kind
        );

        await this._roomTileCursorRenderer.render({
          x,
          y,
          z: element.z,
        });
        await this._roomTileCursorRenderer.render({
          x,
          y,
          z: element.z + 1,
        });
        break;
      case 'stairCorner':
        await this._roomStairRenderer.render(
          { x, y, z: element.z },
          true,
          element.kind
        );

        await this._roomTileCursorRenderer.render({
          x,
          y,
          z: element.z,
        });
        await this._roomTileCursorRenderer.render({
          x,
          y,
          z: element.z + 1,
        });
        break;
    }
  }

  private async _renderDoor({ x, y, z }: Vector3D): Promise<void> {
    await this._roomTileRenderer.render(
      { x, y, z },
      this._roomWallRenderer.behindWallLayer
    );
    this._roomWallRenderer.renderLeftWall({
      x,
      y,
      z,
      hideBorder: false,
      cutHeight: 90,
    });

    await this._roomTileCursorRenderer.render(
      {
        x,
        y,
        z: z,
      },
      this._roomWallRenderer.behindWallLayer
    );
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
