import { Bobba } from '@bobba/core';
import { Room } from '../room';
import { Vector2D, Vector3D } from '@bobba/utils';

type RendererConfiguration = {
  bobba: Bobba;
  room: Room;
};

export abstract class Renderer<T = unknown> {
  constructor(public readonly configuration: RendererConfiguration & T) {}

  public async render(...args: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async prepareAssets(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public get bobba(): Bobba {
    return this.configuration.bobba;
  }

  public get room(): Room {
    return this.configuration.room;
  }

  protected getPosition({ x, y, z }: Vector3D): Vector2D {
    const getBasePosition = () => {
      return { x, y };
    };

    const { x: baseX, y: baseY } = getBasePosition();

    const base = 32;

    // TODO: Right now we are subtracting the tileMapBounds here.
    // This is so the landscapes work correctly. This has something with the mask position being negative for some walls.
    // This fixes it for now.
    const xPos = baseX * base - baseY * base;
    const yPos = baseX * (base / 2) + baseY * (base / 2);

    return {
      x: xPos,
      y: yPos - z * 32,
    };
  }
}
