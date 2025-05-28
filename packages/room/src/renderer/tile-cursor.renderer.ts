import { Vector3D } from '@bobba/utils';
import { Renderer } from '../interface/renderer.interface';
import { RoomTileCursorEntity } from '../entity/tile-cursor.entity';
import { Container } from 'pixi.js';

type RoomTileCursorRendererConfiguration = {
  primaryLayer: Container;
};

export class RoomTileCursorRenderer extends Renderer<RoomTileCursorRendererConfiguration> {
  private _tileCursors: RoomTileCursorEntity[] = [];
  private _hideTileCursor = false;

  public override async render(
    position: Vector3D,
    container?: Container
  ): Promise<void> {
    if (this._hideTileCursor) {
      return;
    }

    const cursor = new RoomTileCursorEntity(this.room, { position });

    const { x, y } = this.getPosition({
      x: position.x,
      y: position.y,
      z: position.z,
    });

    cursor.x = x;
    cursor.y = y;
    cursor.zIndex = position.x * 1000 + position.y * 1000 + position.z - 1000;

    await cursor.render();

    this._tileCursors.push(cursor);

    if (container) {
      container.addChild(cursor);
      return;
    }

    this.configuration.primaryLayer.addChild(cursor);
  }

  public override async prepareAssets(): Promise<void> {
    //
  }
}
