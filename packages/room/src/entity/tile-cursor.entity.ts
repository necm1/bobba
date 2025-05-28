import { Room } from '../room';
import { RoomEntity } from '../interface/room-entity.interface';
import { RoomEntityData } from '../type/room-entity-data.type';
import { Graphics, Texture } from 'pixi.js';
import { Vector3D } from '@bobba/utils';

const points = {
  p1: { x: 0, y: 16 },
  p2: { x: 32, y: 0 },
  p3: { x: 64, y: 16 },
  p4: { x: 32, y: 32 },
};

type RoomTileCursorEntityConfiguration = {
  position: Vector3D;
};

export class RoomTileCursorEntity extends RoomEntity<
  RoomTileCursorEntityConfiguration,
  RoomEntityData
> {
  private _graphics: Graphics;
  private _hover = false;

  constructor(room: Room, configuration: RoomTileCursorEntityConfiguration) {
    super(room, configuration);
    this._graphics = new Graphics();
  }

  public override async render(): Promise<void> {
    const graphics = this._graphics;

    if (!graphics) {
      return;
    }

    graphics.clear();

    if (this._hover) {
      this._drawBorder(0x000000, 0.33, 0);
      this._drawBorder(0xa7d1e0, 1, -2);
      this._drawBorder(0xffffff, 1, -3);
    }

    this.addChild(graphics);
  }

  private _drawBorder(color: number, alpha = 1, offsetY: number): void {
    this._graphics
      .fill({
        color,
        alpha,
      })
      .moveTo(points.p1.x, points.p1.y + offsetY)
      .lineTo(points.p2.x, points.p2.y + offsetY)
      .lineTo(points.p3.x, points.p3.y + offsetY)
      .lineTo(points.p4.x, points.p4.y + offsetY)
      .circle(points.p1.x + 6, points.p1.y + offsetY, 6)
      .lineTo(points.p2.x, points.p2.y + 3 + offsetY)
      .lineTo(points.p3.x - 6, points.p3.y + offsetY)
      .lineTo(points.p4.x, points.p4.y - 3 + offsetY)
      .cut();
  }
}
