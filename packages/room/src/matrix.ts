import { Matrix } from 'pixi.js';

type PlanePoints = {
  a: { x: number; y: number };
  b: { x: number; y: number };
  c: { x: number; y: number };
  d: { x: number; y: number };
};

export class RoomMatrix {
  public static getFloorMatrix(x: number, y: number) {
    return this._createPlaneMatrix(
      {
        c: { x: 0, y: 16 },
        d: { x: 32, y: 0 },
        a: { x: 64, y: 16 },
        b: { x: 32, y: 32 },
      },
      { width: 32, height: 32, x, y }
    );
  }

  public static getLeftMatrix(
    x: number,
    y: number,
    dim: { width: number; height: number }
  ) {
    return this._createPlaneMatrix(
      {
        b: { x: 0, y: 16 },
        c: { x: dim.width, y: 16 + dim.width / 2 },
        d: { x: dim.width, y: 16 + dim.width / 2 + dim.height },
        a: { x: 0, y: 16 + dim.height },
      },
      { width: dim.width, height: dim.height, x, y }
    );
  }

  public static getRightMatrix(
    x: number,
    y: number,
    dim: { width: number; height: number }
  ) {
    return this._createPlaneMatrix(
      {
        b: { x: 32, y: 32 },
        c: { x: 32 + dim.width, y: 32 - dim.width / 2 },
        d: { x: 32 + dim.width, y: 32 + dim.height - dim.width / 2 },
        a: { x: 32, y: 32 + dim.height },
      },
      {
        width: dim.width,
        height: dim.height,
        x: x,
        y: y,
      }
    );
  }

  private static _createPlaneMatrix(
    points: PlanePoints,
    {
      width,
      height,
      x,
      y,
    }: { width: number; height: number; x: number; y: number }
  ) {
    let diffDxCx = points.d.x - points.c.x;
    let diffDyCy = points.d.y - points.c.y;
    let diffBxCx = points.b.x - points.c.x;
    let diffByCy = points.b.y - points.c.y;

    if (Math.abs(diffBxCx - width) <= 1) {
      diffBxCx = width;
    }
    if (Math.abs(diffByCy - width) <= 1) {
      diffByCy = width;
    }
    if (Math.abs(diffDxCx - height) <= 1) {
      diffDxCx = height;
    }
    if (Math.abs(diffDyCy - height) <= 1) {
      diffDyCy = height;
    }

    const a = diffBxCx / width;
    const b = diffByCy / width;
    const c = diffDxCx / height;
    const d = diffDyCy / height;

    const baseX = x + points.c.x;
    const baseY = y + points.c.y;

    const matrix: Matrix = new Matrix(a, b, c, d, baseX, baseY);

    return matrix;
  }
}
