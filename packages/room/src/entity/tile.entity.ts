import { RoomTileEntityConfiguration } from '../interface/room-tile-entity-configuration.interface';
import { RoomEntity } from '../interface/room-entity.interface';
import { Room } from '../room';
import { RoomAsset } from '../interface/room-asset.interface';
import { Container, Point, Texture, TilingSprite } from 'pixi.js';
import { RoomMatrix } from '../matrix';
import { RoomEntityData } from '../type/room-entity-data.type';

export class RoomTileEntity extends RoomEntity<
  RoomTileEntityConfiguration,
  RoomEntityData
> {
  private _entityLayerContainer?: Container;
  private _tileContainers: Container[] = [];

  private _asset: RoomAsset;
  private _color: string;

  private _tileHeight: number;
  private _tilePositions: Point;

  constructor(room: Room, configuration: RoomTileEntityConfiguration) {
    super(room, configuration);

    this._asset = configuration.asset || room.floorAsset;

    if (!configuration.asset) {
      this._asset.load();
    }

    this._color = configuration.color || '#ffffff';
    this._tileHeight = configuration.height;
  }

  public override async render(): Promise<void> {
    this._entityLayerContainer?.destroy();
    this._entityLayerContainer = new Container();

    this._destroySprites();

    const tileMatrix = RoomMatrix.getFloorMatrix(0, 0);

    const texture = this._asset.texture ?? Texture.WHITE;

    const tile = new TilingSprite();
    tile.texture = texture;

    tile.tilePosition = this._tilePositions;

    tile.setSize(32, 32);
    tile.setFromMatrix(tileMatrix);
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

    borderLeft.setFromMatrix(borderLeftMatrix);
    borderLeft.setSize(32, this._tileHeight);
    borderLeft.tint = 0x838357;

    const borderRight = new TilingSprite(texture);
    borderRight.tilePosition = this._tilePositions;

    borderRight.setFromMatrix(borderRightMatrix);
    borderRight.setSize(32, this._tileHeight);
    borderRight.tint = 0x666644;

    // Cache the textures
    borderRight.updateCacheTexture();
    borderLeft.updateCacheTexture();
    tile.updateCacheTexture();

    this._tileContainers.push(this._entityLayerContainer);

    this._entityLayerContainer.addChild(borderLeft);
    this._entityLayerContainer.addChild(borderRight);
    this._entityLayerContainer.addChild(tile);

    this.addChild(this._entityLayerContainer);
  }

  public override async update(data: RoomEntityData): Promise<void> {
    this._tileHeight = data.tileHeight;
    this._asset = data.tileTexture;
    await this.render();
  }

  public override destroy(): void {
    super.destroy();
    this._destroySprites();
  }

  private _destroySprites() {
    this._tileContainers.forEach((sprite) => {
      sprite.destroy();
    });
    this._tileContainers = [];
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
