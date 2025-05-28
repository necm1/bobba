import { Container, Point } from 'pixi.js';
import { Renderer } from '../interface/renderer.interface';
import { RoomTileEntity } from '../entity/tile.entity';
import { Vector3D } from '@bobba/utils';
import { RoomStairEntity } from '../entity/stair.entity';
import { RoomStairCornerEntity } from 'src/entity/stair-corner.entity';

type RoomTileRendererConfiguration = {
  hideFloor: boolean;
  tileHeight: number;
  tileLeftColor?: string;
  tileRightColor?: string;
  tileTopColor?: string;
};

export class RoomTileRenderer extends Renderer<RoomTileRendererConfiguration> {
  private _tileLayer = new Container();
  private _tiles: (RoomTileEntity | RoomStairEntity | RoomStairCornerEntity)[] =
    [];

  public override async render({ x, y, z }: Vector3D, container?: Container) {
    if (this.configuration.hideFloor) {
      return;
    }

    const tile = new RoomTileEntity(this.room, {
      color: '#eeeeee',
      height: this.configuration.tileHeight,
      tileTopColor: this.configuration.tileTopColor,
      tileLeftColor: this.configuration.tileLeftColor,
      tileRightColor: this.configuration.tileRightColor,
    });

    const xEven = x % 2 === 0;
    const yEven = y % 2 === 0;

    tile.tilePositions = new Point(xEven ? 32 : 0, yEven ? 32 : 0);
    const position = this.getPosition({ x, y, z });

    tile.x = position.x;
    tile.y = position.y;

    await tile.render();
    this._tiles.push(tile);

    if (container) {
      container.addChild(tile);
      return;
    }

    this._tileLayer.addChild(tile);
  }

  public override async prepareAssets(): Promise<void> {
    this.room.floorAsset.texture._source.scaleMode = 'nearest';

    await this.room.floorAsset.load();
  }

  public get tiles(): (
    | RoomTileEntity
    | RoomStairEntity
    | RoomStairCornerEntity
  )[] {
    return this._tiles;
  }

  public get tileLayer(): Container {
    return this._tileLayer;
  }
}
