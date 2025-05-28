import { Vector3D } from '@bobba/utils';
import { Renderer } from '../interface/renderer.interface';
import { RoomStairEntity } from '../entity/stair.entity';
import { RoomTileRenderer } from './tile.renderer';
import { RoomStairCornerEntity } from '../entity/stair-corner.entity';

type RoomStairRendererConfiguration = {
  tileHeight: number;
  tileLeftColor: string;
  tileRightColor: string;
  tileTopColor: string;
  roomTileRenderer: RoomTileRenderer;
};

type Direction = 0 | 2;
type Kind = 'left' | 'front' | 'right';

export class RoomStairRenderer extends Renderer<RoomStairRendererConfiguration> {
  public override async render(
    { x, y, z }: Vector3D,
    isCorner = false,
    type: Direction | Kind | undefined = undefined
  ): Promise<void> {
    if (isCorner) {
      await this._renderStairCorner({ x, y, z }, type as Kind);
      return;
    }

    await this._renderStair({ x, y, z }, type as Direction);
  }

  public override async prepareAssets(): Promise<void> {
    //
  }

  private async _renderStairCorner({ x, y, z }: Vector3D, type: Kind) {
    const stair = new RoomStairCornerEntity(this.room, {
      asset: this.configuration.room.floorAsset,
      type: type as Kind,
      tileHeight: this.configuration.tileHeight,
      tileLeftColor: this.configuration.tileLeftColor,
      tileRightColor: this.configuration.tileRightColor,
      tileTopColor: this.configuration.tileTopColor,
    });
    const position = this.getPosition({ x, y, z });

    stair.x = position.x;
    stair.y = position.y;

    await stair.render();

    this.configuration.roomTileRenderer.tiles.push(stair);
    this.configuration.roomTileRenderer.tileLayer.addChild(stair);

    // this._createTileCursor(x, y, z);
    // this._createTileCursor(x, y, z + 1);
  }

  private async _renderStair({ x, y, z }: Vector3D, direction: Direction) {
    const stair = new RoomStairEntity(this.room, {
      asset: this.configuration.room.floorAsset,
      tileHeight: this.configuration.tileHeight,
      tileLeftColor: this.configuration.tileLeftColor,
      tileRightColor: this.configuration.tileRightColor,
      tileTopColor: this.configuration.tileTopColor,
      direction,
    });

    const position = this.getPosition({ x, y, z });
    stair.x = position.x;
    stair.y = position.y;

    await stair.render();

    this.configuration.roomTileRenderer.tiles.push(stair);
    this.configuration.roomTileRenderer.tileLayer.addChild(stair);
  }
}
