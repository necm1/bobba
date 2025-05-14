import { Room } from '../room';
import { RoomEntity } from '../interface/room-entity.interface';
import { Matrix, Texture, TilingSprite } from 'pixi.js';
import { RoomEntityData } from '../type/room-entity-data.type';

export class RoomWallOuterCornerEntity extends RoomEntity<
  unknown,
  RoomEntityData
> {
  private _borderWidth = 0;
  private _wallHeight = 0;
  private _wallTopColor = 0;

  private _roomZ = 0;

  constructor(room: Room, configuration: unknown) {
    super(room, configuration);
  }

  public override async render(): Promise<void> {
    const border = new TilingSprite(Texture.WHITE);
    border.setSize(this._borderWidth, this._borderWidth);
    border.setFromMatrix(new Matrix(1, 0.5, 1, -0.5));
    border.tint = this._wallTopColor;
    border.x = -this._borderWidth;
    border.y =
      -this._wallHeight +
      this.roomZ * 32 -
      32 / 2 +
      this._borderWidth / 2 +
      (32 - this._borderWidth);

    this.addChild(border);
  }

  public override async update(data: RoomEntityData): Promise<void> {
    this._borderWidth = data.borderWidth;
    this._wallHeight = data.wallHeight;
    this._wallTopColor = data.wallTopColor;

    await this.render();
  }

  public override destroy(): void {
    super.destroy();
  }

  public get roomZ(): number {
    return this._roomZ;
  }

  public set roomZ(value: number) {
    this._roomZ = value;
    this.render();
  }
}
