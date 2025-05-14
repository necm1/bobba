import { Container } from 'pixi.js';
import { Room } from 'src/room';

export abstract class RoomEntity<T = unknown> extends Container {
  constructor(
    private readonly _room: Room,
    private readonly _configuration: T
  ) {
    super();
  }

  public async render(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async update(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public get room(): Room {
    return this._room;
  }

  public get configuration(): T {
    return this._configuration;
  }
}
