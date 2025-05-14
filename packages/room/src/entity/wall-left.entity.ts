import { Room } from '../room';
import { RoomEntity } from '../interface/room-entity.interface';
import {
  Container,
  Graphics,
  Matrix,
  Point,
  Polygon,
  Texture,
  TilingSprite,
} from 'pixi.js';
import { RoomAsset } from '../interface/room-asset.interface';
import { Vector2D } from '@bobba/utils';
import { RoomEntityData } from 'src/type/room-entity-data.type';

export type RoomWallLeftEntityConfiguration = {
  hideBorder: boolean;
  hitAreaContainer: Container;
  cutHeight?: number;
  asset?: RoomAsset;
};

export class RoomWallLeftEntity extends RoomEntity<
  RoomWallLeftEntityConfiguration,
  RoomEntityData
> {
  protected _offsets: Vector2D = { x: 0, y: 0 };
  private _roomZ: number;

  protected _borderWidth = 0;
  protected _wallHeight = 0;
  protected _wallWidth = 32;
  protected _tileHeight = 0;

  protected _wallLeftColor = 0xffffff;
  protected _wallRightColor = 0xffffff;
  protected _wallTopColor = 0xffffff;

  private _drawHitArea = false;
  private _hideBorder = false;

  private _hitAreaLayer: Container | undefined;

  private _asset: RoomAsset;

  constructor(room: Room, configuration: RoomWallLeftEntityConfiguration) {
    super(room, configuration);

    this._asset = configuration.asset || room.wallAsset;

    if (!configuration.asset) {
      this._asset.load();
    }

    this._hideBorder = configuration.hideBorder;
  }

  public override async render(): Promise<void> {
    if (this._hitAreaLayer != null) {
      this.configuration.hitAreaContainer.removeChild(this._hitAreaLayer);
      this._hitAreaLayer = undefined;
    }

    this.removeChildren();

    const hitArea = new Polygon(this._getDisplayPoints());

    this.hitArea = hitArea;

    const primary = this._createPrimaryLayer();
    const border = this._createBorderLayer();
    const top = this._createTopLayer();

    this.addChild(primary);

    if (!this._hideBorder) {
      this.addChild(border);
    }

    this.addChild(top);

    const graphic = new Graphics().poly(hitArea.points).fill(0xff00ff);
    graphic.alpha = this._drawHitArea ? 1 : 0;

    graphic.interactive = true;

    this._hitAreaLayer = graphic;
    this._hitAreaLayer.x = this.x;
    this._hitAreaLayer.y = this.y;
    this._hitAreaLayer.scale = this.scale;

    this.configuration.hitAreaContainer.addChild(this._hitAreaLayer);
  }

  public override async update(data: RoomEntityData): Promise<void> {
    this._borderWidth = data.borderWidth;
    this._wallHeight = data.wallHeight - this.roomZ * 32;
    this._tileHeight = data.tileHeight;
    this._wallLeftColor = data.wallLeftColor;
    this._wallRightColor = data.wallRightColor;
    this._wallTopColor = data.wallTopColor;
    this._asset = data.wallTexture;

    await this.render();
  }

  public override destroy(): void {
    super.destroy();
    this._hitAreaLayer?.destroy();
    this.removeChildren();
  }

  private _createPrimaryLayer(): TilingSprite {
    const sprite = new TilingSprite(this._asset.texture ?? Texture.WHITE);
    sprite.setSize(this._wallWidth, this.wallHeight);

    sprite.setFromMatrix(new Matrix(-1, 0.5, 0, 1));

    sprite.x = this._getOffsetX() + this._borderWidth + this._wallWidth;
    sprite.y = this.wallY;

    sprite.tint = this._wallLeftColor;

    return sprite;
  }

  private _createBorderLayer() {
    const border = new TilingSprite(Texture.WHITE);
    border.setSize(this._borderWidth, this._wallHeight + this._tileHeight);
    border.setFromMatrix(new Matrix(-1, -0.5, 0, 1));

    border.y = this.wallY + this._wallWidth / 2;
    border.x = this._getOffsetX() + this._borderWidth;

    border.tint = this._wallRightColor;

    return border;
  }

  private _createTopLayer() {
    const border = new TilingSprite(Texture.WHITE);
    border.setSize(this._borderWidth, this._wallWidth);
    border.setFromMatrix(new Matrix(1, 0.5, 1, -0.5));

    border.x = this._getOffsetX() + 0;
    border.y = this.wallY + this._wallWidth / 2 - this._borderWidth / 2;

    border.tint = this._wallTopColor;

    return border;
  }

  private _getDisplayPoints() {
    return [
      new Point(
        this._getOffsetX() + this._borderWidth,
        this._wallWidth / 2 - (this.configuration.cutHeight ?? 0)
      ),
      new Point(
        this._getOffsetX() + this._wallWidth + this._borderWidth,
        -(this.configuration.cutHeight ?? 0)
      ),
      new Point(
        this._getOffsetX() + this._wallWidth + this._borderWidth,
        -this._wallHeight
      ),
      new Point(
        this._getOffsetX() + this._borderWidth,
        -this._wallHeight + this._wallWidth / 2
      ),
    ];
  }

  private _getOffsetX() {
    return this.scale.x * this._offsets.x - this._borderWidth;
  }

  private get wallY() {
    return -this._wallHeight;
  }

  private get wallHeight() {
    if (this.configuration.cutHeight != null) {
      return this._wallHeight - this.configuration.cutHeight;
    }

    return this._wallHeight;
  }

  public get roomZ(): number {
    return this._roomZ;
  }

  public set roomZ(value: number) {
    this._roomZ = value;
    this.render();
  }
}
