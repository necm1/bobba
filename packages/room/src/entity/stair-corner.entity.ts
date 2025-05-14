import { Room } from '../room';
import {
  RoomEntity,
  RoomEntityConfiguration,
} from '../interface/room-entity.interface';
import { RoomEntityData } from '../type/room-entity-data.type';
import { RoomMatrix } from '../matrix';
import { Container, Matrix, Point, Texture, TilingSprite } from 'pixi.js';

const stairBase = 8;
export type RoomStairCornerEntityConfiguration = {
  tileHeight: number;
  tileLeftColor: string;
  tileRightColor: string;
  tileTopColor: string;
  type: 'front' | 'left' | 'right';
};

export class RoomStairCornerEntity extends RoomEntity<
  RoomStairCornerEntityConfiguration,
  RoomEntityData
> {
  private _tileHeight: number;
  private _tileLeftColor: number;
  private _tileRightColor: number;
  private _tileTopColor: number;

  constructor(
    room: Room,
    configuration: RoomEntityConfiguration & RoomStairCornerEntityConfiguration
  ) {
    super(room, configuration);

    this._tileHeight = configuration.tileHeight;
  }

  public override async render(): Promise<void> {
    this.removeChildren();

    const { type } = this.configuration;

    for (let i = 0; i < 4; i++) {
      if (type === 'front') {
        this.addChild(...this._createStairBoxFront(3 - i));
      } else if (type === 'left') {
        this.addChild(...this._createStairBoxLeft(3 - i));
      } else if (type === 'right') {
        this.addChild(...this._createStairBoxRight(3 - i));
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

  public override destroy() {
    super.destroy();
    this.removeChildren();
  }

  private _createStairBoxFront(index: number): Container[] {
    const baseXLeft = +stairBase * index;
    const baseYLeft = -stairBase * index * 1.5;

    const baseXRight = 0;
    const baseYRight = -stairBase * index * 2;

    const texture = this.asset?.texture;

    function createSprite(matrix: Matrix, tint: number, tilePosition: Point) {
      const tile = new TilingSprite(texture ?? Texture.WHITE);
      tile.tilePosition = tilePosition;
      tile.setFromMatrix(matrix);

      tile.tint = tint;

      return tile;
    }

    const tileLeft = createSprite(
      RoomMatrix.getFloorMatrix(baseXLeft, baseYLeft),
      this._tileTopColor,
      new Point()
    );

    tileLeft.width = 32 - 8 * index;
    tileLeft.height = 8;

    const tileRight = createSprite(
      RoomMatrix.getFloorMatrix(
        baseXRight + 32 - stairBase,
        baseYRight + stairBase * 1.5
      ),
      this._tileTopColor,
      new Point(0, 0)
    );

    tileRight.width = stairBase;
    tileRight.height = 32 - 8 * index;

    const borderLeft = createSprite(
      RoomMatrix.getLeftMatrix(
        baseXLeft - 8 * index,
        baseYLeft - 8 * index * 0.5,
        {
          width: 32,
          height: this._tileHeight,
        }
      ),
      this._tileLeftColor,
      new Point(0, 0)
    );
    borderLeft.width = 32 - 8 * index;
    borderLeft.height = this._tileHeight;

    const borderRight = createSprite(
      RoomMatrix.getRightMatrix(
        baseXRight - stairBase * index,
        -stairBase * index * 1.5,
        {
          width: 32,
          height: this._tileHeight,
        }
      ),
      this._tileRightColor,
      new Point(0, 0)
    );

    borderRight.width = 32 - 8 * index;
    borderRight.height = this._tileHeight;

    return [borderLeft, borderRight, tileLeft, tileRight];
  }

  private _createStairBoxLeft(index: number) {
    const baseX = -stairBase * index;
    const baseY = -stairBase * index * 1.5;
    const texture = this.asset?.texture;

    function createSprite(matrix: Matrix, tint: number, tilePosition: Point) {
      const tile = new TilingSprite(texture ?? Texture.WHITE);
      tile.tilePosition = tilePosition;
      tile.setFromMatrix(matrix);

      tile.tint = tint;

      return tile;
    }

    const tileRight = createSprite(
      RoomMatrix.getFloorMatrix(
        baseX + 32 - stairBase,
        baseY + stairBase * 1.5
      ),
      this._tileTopColor,
      new Point(0, 0)
    );

    tileRight.width = stairBase;
    tileRight.height = 32 - 8 * index;
    tileRight.zIndex = 2;

    const borderRight = createSprite(
      RoomMatrix.getRightMatrix(baseX - stairBase * index, -stairBase * index, {
        width: 32,
        height: this._tileHeight,
      }),
      this._tileRightColor,
      new Point(0, 0)
    );

    borderRight.width = 32 - 8 * index;
    borderRight.height = this._tileHeight;
    borderRight.zIndex = 1;

    if (index == 0) {
      const cornerOne = createSprite(
        RoomMatrix.getFloorMatrix(baseX + 40, -4),
        this._tileTopColor,
        new Point(0, 0)
      );

      cornerOne.width = 8;
      cornerOne.height = 8;
      cornerOne.zIndex = 0;

      const cornerTwo = createSprite(
        RoomMatrix.getFloorMatrix(baseX + 24, -12),
        this._tileTopColor,
        new Point(0, 0)
      );
      cornerTwo.width = 8;
      cornerTwo.height = 8;
      cornerTwo.zIndex = 0;

      return [tileRight, borderRight, cornerOne, cornerTwo];
    } else {
      return [tileRight, borderRight];
    }
  }

  private _createStairBoxRight(index: number) {
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
      RoomMatrix.getFloorMatrix(baseX + 8 * index, baseY + 8 * index * 0.5),
      this._tileTopColor,
      new Point(0, 0)
    );

    tile.width = 32 - 8 * index;
    tile.height = 8;
    tile.zIndex = 2;

    const borderLeft = createSprite(
      RoomMatrix.getLeftMatrix(baseX, baseY, {
        width: 32,
        height: this._tileHeight,
      }),
      this._tileLeftColor,
      new Point(0, 0)
    );
    borderLeft.width = 32 - 8 * index;
    borderLeft.height = this._tileHeight;
    borderLeft.zIndex = 1;

    if (index == 0) {
      const cornerOne = createSprite(
        RoomMatrix.getFloorMatrix(baseX + 8, -4),
        this._tileTopColor,
        new Point(0, 0)
      );

      cornerOne.width = 8;
      cornerOne.height = 8;
      cornerOne.zIndex = 0;

      const cornerTwo = createSprite(
        RoomMatrix.getFloorMatrix(baseX + 24, -12),
        this._tileTopColor,
        new Point(0, 0)
      );
      cornerTwo.width = 8;
      cornerTwo.height = 8;
      cornerTwo.zIndex = 0;

      return [tile, borderLeft, cornerOne, cornerTwo];
    } else {
      return [tile, borderLeft];
    }
  }
}
