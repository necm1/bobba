import { RoomTileEntityConfiguration } from '../interface/room-tile-entity-configuration.interface';
import { RoomEntity } from '../interface/room-entity.interface';
import { Room } from '../room';
import { Container, Point, Texture, TilingSprite } from 'pixi.js';
import { RoomMatrix } from '../matrix';

export class RoomWallEntity extends RoomEntity<RoomTileEntityConfiguration> {
  private _container?: Container;
  private _sprites: Container[] = [];

  private _color: string;

  private _tileHeight: number;
  private _tilePositions: Point;

  constructor(room: Room, configuration: RoomTileEntityConfiguration) {
    super(room, configuration);

    this.asset = configuration.asset || room.floorAsset;

    this._color = configuration.color || '#ffffff';
    this._tileHeight = configuration.height;
  }

  public override async render(): Promise<void> {
    this._container?.destroy();
    this._container = new Container();

    const tileMatrix = RoomMatrix.getFloorMatrix(0, 0);
    const texture = this.asset?.texture ?? Texture.WHITE;
    const tile = new TilingSprite(texture);

    tile.tilePosition = this._tilePositions;

    tile._tileTransform.setFromMatrix(tileMatrix);
    tile.width = 32;
    tile.height = 32;
    tile.tint = 0x989865;

    const borderLeftMatrix = RoomMatrix.getLeftMatrix(0, 0, {
      width: 32,
      height: this._tileHeight,
    });

    const borderRightMatrix = RoomMatrix.getRightMatrix(0, 0, {
      width: 32,
      height: this._tileHeight,
    });

    const borderLeft = new TilingSprite(texture);

    borderLeft.tilePosition = this._tilePositions;

    borderLeft._tileTransform.setFromMatrix(borderLeftMatrix);
    borderLeft.width = 32;
    borderLeft.height = this._tileHeight;
    borderLeft.tint = 0x838357;

    const borderRight = new TilingSprite(texture);
    borderRight.tilePosition = this._tilePositions;

    borderRight._tileTransform.setFromMatrix(borderRightMatrix);
    borderRight.width = 32;
    borderRight.height = this._tileHeight;
    borderRight.tint = 0x666644;

    this._sprites.push(this._container);

    this._container.addChild(borderLeft);
    this._container.addChild(borderRight);
    this._container.addChild(tile);
    this.addChild(this._container);
  }

  public override async update(): Promise<void> {
    console.log('update tile entity');
  }

  public override destroy(): void {
    super.destroy();
  }

  get color() {
    return this._color;
  }

  set color(value) {
    this._color = value;
    // this._updateSprites();
  }

  public get tilePositions() {
    return this._tilePositions;
  }

  public set tilePositions(value) {
    this._tilePositions = value;
  }

  public get tileHeight() {
    return this._tileHeight;
  }

  public set tileHeight(value) {
    this._tileHeight = value;
  }
}
