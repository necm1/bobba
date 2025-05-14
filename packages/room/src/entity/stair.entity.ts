import { Room } from '../room';
import {
  RoomEntity,
  RoomEntityConfiguration,
} from '../interface/room-entity.interface';
import { RoomEntityData } from '../type/room-entity-data.type';
import { RoomMatrix } from '../matrix';
import { Matrix, Point, Texture, TilingSprite } from 'pixi.js';

export type RoomStairEntityConfiguration = {
  tileHeight: number;
  tileLeftColor: string;
  tileRightColor: string;
  tileTopColor: string;
  direction: 0 | 2;
};

const stairBase = 8;

export class RoomStairEntity extends RoomEntity<
  RoomStairEntityConfiguration,
  RoomEntityData
> {
  private _tileHeight: number;
  private _tileLeftColor: number;
  private _tileRightColor: number;
  private _tileTopColor: number;

  constructor(
    room: Room,
    configuration: RoomEntityConfiguration & RoomStairEntityConfiguration
  ) {
    super(room, configuration);

    this._tileHeight = configuration.tileHeight;
  }

  public override async render(): Promise<void> {
    this.removeChildren();

    const { direction } = this.configuration;

    for (let i = 0; i < 4; i++) {
      if (direction === 0) {
        this.addChild(...this._createStairBoxDirection0(3 - i));
      } else if (direction === 2) {
        this.addChild(...this._createStairBoxDirection2(3 - i));
      }
    }
  }

  public override async update(data: RoomEntityData): Promise<void> {
    this._tileHeight = data.tileHeight;
    this._tileLeftColor = data.tileLeftColor;
    this._tileRightColor = data.tileRightColor;
    this._tileTopColor = data.tileTopColor;
    this.asset = data.tileTexture;

    await this.render();
  }

  _createStairBoxDirection0(index: number) {
    const baseX = +stairBase * index;
    const baseY = -stairBase * index * 1.5;
    const texture = this.asset?.texture;

    function createSprite(matrix: Matrix, tint: number, tilePosition: Point) {
      const tile = new TilingSprite(texture ?? Texture.WHITE);
      tile.tilePosition = tilePosition;
      tile.setFromMatrix(matrix);

      tile.tint = tint;

      return tile;
    }

    const tile = createSprite(
      RoomMatrix.getFloorMatrix(baseX, baseY),
      this._tileTopColor,
      new Point(0, 0)
    );
    tile.width = 32;
    tile.height = 8;

    const borderLeft = createSprite(
      RoomMatrix.getLeftMatrix(baseX, baseY, {
        width: 32,
        height: this._tileHeight,
      }),
      this._tileLeftColor,
      new Point(0, 0)
    );
    borderLeft.width = 32;
    borderLeft.height = this._tileHeight;

    const borderRight = createSprite(
      RoomMatrix.getRightMatrix(baseX, baseY, {
        width: 8,
        height: this._tileHeight,
      }),
      this._tileRightColor,
      new Point(0, 0)
    );

    borderRight.width = 8;
    borderRight.height = this._tileHeight;

    return [borderLeft, borderRight, tile];
  }

  _createStairBoxDirection2(index: number) {
    const baseX = -stairBase * index;
    const baseY = -stairBase * index * 1.5;
    const texture = this.asset?.texture;

    function createSprite(matrix: Matrix, tint: number) {
      const tile = new TilingSprite(texture ?? Texture.WHITE);
      tile.tilePosition = new Point(0, 0);
      tile.setFromMatrix(matrix);

      tile.tint = tint;

      return tile;
    }

    const tile = createSprite(
      RoomMatrix.getFloorMatrix(
        baseX + 32 - stairBase,
        baseY + stairBase * 1.5
      ),
      this._tileTopColor
    );
    tile.width = stairBase;
    tile.height = 32;

    const borderLeft = createSprite(
      RoomMatrix.getLeftMatrix(
        baseX + 32 - stairBase,
        baseY + stairBase * 1.5,
        {
          width: stairBase,
          height: this._tileHeight,
        }
      ),
      this._tileLeftColor
    );
    borderLeft.width = stairBase;
    borderLeft.height = this._tileHeight;

    const borderRight = createSprite(
      RoomMatrix.getRightMatrix(baseX, baseY, {
        width: 32,
        height: this._tileHeight,
      }),
      this._tileRightColor
    );

    borderRight.width = 32;
    borderRight.height = this._tileHeight;

    return [borderLeft, borderRight, tile];
  }

  public override destroy() {
    super.destroy();
    this.removeChildren();
  }
}
