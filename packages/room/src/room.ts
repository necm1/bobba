import { Container } from 'pixi.js';
import { RoomConfiguration } from './interface/room-configuration.interface';
import { RoomTileMap } from './tile-map';
import { RoomRenderer } from './renderer/room.renderer';
import { RoomTileAsset } from './asset/tile.asset';
import { RoomCamera } from './camera';
import { Bobba } from '@bobba/core';
import { RoomWallAsset } from './asset/wall.asset';

export class Room extends Container {
  private _tileMap: RoomTileMap;
  private _renderer: RoomRenderer;

  private _floorAsset: RoomTileAsset;
  private _wallAsset: RoomWallAsset;

  private _camera: RoomCamera;

  private _bobba: Bobba;

  constructor(config: RoomConfiguration) {
    super();

    this._bobba = config.bobba;
    this._tileMap = new RoomTileMap(config.tileMap);

    this._floorAsset = new RoomTileAsset(config.bobba, 111);
    this._wallAsset = new RoomWallAsset(config.bobba, 101);

    this._renderer = new RoomRenderer(config.bobba, this);
    this.addChild(this._renderer);
  }

  public async render(): Promise<void> {
    await this.renderer.render();
    this._camera = new RoomCamera(this);
    this._bobba.app.stage.addChild(this._camera);
    // this._camera.centerCamera();
  }

  public get bobba(): Bobba {
    return this._bobba;
  }

  public get renderer(): RoomRenderer {
    return this._renderer;
  }

  public get camera(): RoomCamera {
    return this._camera;
  }

  public get tileMap(): RoomTileMap {
    return this._tileMap;
  }

  public get floorAsset(): RoomTileAsset {
    return this._floorAsset;
  }

  public get wallAsset(): RoomWallAsset {
    return this._wallAsset;
  }

  public get roomHeight(): number {
    return this.renderer.getBounds().rectangle.height;
  }

  public get roomWidth(): number {
    return this.renderer.getBounds().rectangle.width;
  }
}
