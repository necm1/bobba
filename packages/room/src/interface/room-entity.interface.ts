import { Container, Texture } from 'pixi.js';
import { Room } from 'src/room';
import { RoomAsset } from './room-asset.interface';

export type RoomEntityConfiguration = {
  asset?: RoomAsset;
};

export abstract class RoomEntity<T = unknown, K = unknown> extends Container {
  private _asset: RoomAsset | undefined;

  constructor(
    private readonly _room: Room,
    private readonly _configuration: RoomEntityConfiguration & T
  ) {
    super();

    this._asset = _configuration.asset;
  }

  public async render(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async update(data: K): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public get room(): Room {
    return this._room;
  }

  public get configuration(): T {
    return this._configuration;
  }

  public get asset(): RoomAsset | undefined {
    return this._asset;
  }

  public set asset(value: RoomAsset) {
    this._asset = value;

    if (!this._configuration.asset) {
      this._asset.load();
    }
  }
}
