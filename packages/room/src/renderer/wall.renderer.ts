import { Renderer } from '../interface/renderer.interface';
import { RoomWallLeftEntity } from '../entity/wall-left.entity';
import { RoomWallOuterCornerEntity } from '../entity/wall-outer-corner.entity';
import { RoomWallRightEntity } from '../entity/wall-right.entity';
import { Container } from 'pixi.js';
import { Vector2D, Vector3D } from '@bobba/utils';
import { ParsedTileWall } from '../type/parsed-tile-wall.type';

type RoomWallRendererConfiguration = {
  hideWalls: boolean;
  hideFloor: boolean;
};

type RoomWallRendererEntities = (
  | RoomWallLeftEntity
  | RoomWallRightEntity
  | RoomWallOuterCornerEntity
)[];

export class RoomWallRenderer extends Renderer<RoomWallRendererConfiguration> {
  private _walls: RoomWallRendererEntities = [];

  private _behindWallLayer = new Container();
  private _wallLayer = new Container();
  private _landscapeLayer: Container = new Container();
  private _wallHitAreaLayer: Container = new Container();

  public override async render(
    { x, y }: Vector2D,
    element: ParsedTileWall
  ): Promise<void> {
    if (this.configuration.hideWalls || this.configuration.hideFloor) {
      return;
    }

    const height = element.height;

    switch (element.kind) {
      case 'colWall':
        await this.renderRightWall({
          x,
          y,
          z: height,
          hideBorder: element.hideBorder,
        });
        break;
      case 'rowWall':
        await this.renderLeftWall({
          x,
          y,
          z: height,
          hideBorder: element.hideBorder,
        });
        break;

      case 'innerCorner':
        this.renderRightWall({ x, y, z: height });
        this.renderLeftWall({ x, y, z: height, hideBorder: true });
        break;

      case 'outerCorner':
        await this.renderOuterCornerWall({ x, y, z: height });
        break;
    }
  }

  public override async prepareAssets(): Promise<void> {
    await this.room.wallAsset.load();
  }

  public async renderOuterCornerWall({
    x: roomX,
    y: roomY,
    z: roomZ,
  }: Vector3D): Promise<void> {
    const wall = new RoomWallOuterCornerEntity(this.room, {});

    const { x, y } = this.getPosition({ x: roomX + 1, y: roomY, z: roomZ });
    wall.x = x;
    wall.y = y;
    wall.roomZ = roomZ;

    await wall.render();

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  public async renderLeftWall({
    x,
    y,
    z,
    hideBorder = false,
    cutHeight,
  }: Vector3D & { hideBorder?: boolean; cutHeight?: number }) {
    const wall = new RoomWallLeftEntity(this.room, {
      hideBorder,
      hitAreaContainer: this._wallHitAreaLayer,
      cutHeight,
    });

    const { x: actualX, y: actualY } = this.getPosition({ x: x + 1, y, z });
    wall.x = actualX;
    wall.y = actualY;
    wall.roomZ = z;

    await wall.render();

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  public async renderRightWall({
    x,
    y,
    z,
    hideBorder = false,
  }: Vector3D & { hideBorder?: boolean }) {
    const wall = new RoomWallRightEntity(this.room, {
      hideBorder,
      hitAreaContainer: this._wallHitAreaLayer,
    });

    const { x: actualX, y: actualY } = this.getPosition({ x, y: y + 1, z });
    wall.x = actualX + 32;
    wall.y = actualY;
    wall.roomZ = z;

    await wall.render();

    this._wallLayer.addChild(wall);
    this._walls.push(wall);
  }

  public get walls(): RoomWallRendererEntities {
    return this._walls;
  }

  public get behindWallLayer(): Container {
    return this._behindWallLayer;
  }

  public get wallLayer(): Container {
    return this._wallLayer;
  }

  public get wallHitAreaLayer(): Container {
    return this._wallHitAreaLayer;
  }

  public get landscapeLayer(): Container {
    return this._landscapeLayer;
  }
}
