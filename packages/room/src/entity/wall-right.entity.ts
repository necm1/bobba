import { Room } from '../room';
import { Container } from 'pixi.js';
import {
  RoomWallLeftEntity,
  RoomWallLeftEntityConfiguration,
} from './wall-left.entity';

export type RoomWallRightEntityConfiguration = {
  hideBorder: boolean;
  hitAreaContainer: Container;
};

export class RoomWallRightEntity extends RoomWallLeftEntity {
  constructor(room: Room, configuration: RoomWallLeftEntityConfiguration) {
    super(room, configuration);
  }

  public override async render(): Promise<void> {
    this._offsets = { x: this._wallWidth, y: 0 };
    this.scale.x = -1;

    const left = this._wallLeftColor;
    this._wallLeftColor = this._wallRightColor;
    this._wallRightColor = left;

    await super.render();
  }
}
