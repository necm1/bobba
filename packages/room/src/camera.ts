import { Container, FederatedPointerEvent, Point, Transform } from 'pixi.js';
import { Room } from './room';
import gsap from 'gsap';
import { Vector2D } from '@bobba/utils';

type RoomCameraDeps = {
  currentX: number;
  currentY: number;
  pointerId: number;
  startX: number;
  startY: number;
  skipBoundsCheck?: boolean;
};

type RoomCameraDraggingState = {
  type: RoomCameraStateType.DRAGGING;
} & RoomCameraDeps;

type RoomCameraCenterState = {
  type: RoomCameraStateType.CENTER;
} & Omit<RoomCameraDeps, 'pointerId' | 'skipBoundsCheck'>;

type RoomCameraDistanceState = {
  type: RoomCameraStateType.DISTANCE;
} & Omit<RoomCameraDeps, 'currentY' | 'currentX' | 'skipBoundsCheck'>;

type RoomCameraState =
  | {
      type: RoomCameraStateType.WAITING;
    }
  | RoomCameraDistanceState
  | RoomCameraDraggingState
  | RoomCameraCenterState;

enum RoomCameraStateType {
  WAITING = 'WAITING',
  DRAGGING = 'DRAGGING',
  CENTER = 'CENTER',
  DISTANCE = 'DISTANCE',
}

export class RoomCamera extends Container {
  private _state: RoomCameraState = { type: RoomCameraStateType.WAITING };

  private _offsets: Vector2D = { x: 0, y: 0 };
  private _animatedOffsets: Vector2D = { x: 0, y: 0 };

  private _container: Container;
  private _parentContainer: Container;

  constructor(public room: Room) {
    super();

    this._parentContainer = new Container();
    this._parentContainer.hitArea = this.room.bobba.app.screen;
    this._parentContainer.interactive = true;

    this._container = new Container();
    this._container.addChild(this.room);

    this._parentContainer.addChild(this._container);
    this.addChild(this._parentContainer);

    this._initializeListeners();
  }

  public override destroy(): void {
    this._parentContainer.removeAllListeners();
  }

  private _initializeListeners(): void {
    this._parentContainer.on('pointerdown', (e) => this._handlePointerDown(e));
    this._parentContainer.on('pointermove', (e) => this._handlePointerMove(e));
    this._parentContainer.on('pointerup', (e) => this._handlePointerUp(e));
  }

  private _handlePointerDown(event: FederatedPointerEvent): void {
    const position = event.getLocalPosition(this.parent);

    if (this._state.type === RoomCameraStateType.WAITING) {
      this._enterDistanceState(position, event.pointerId);
    } else if (this._state.type === RoomCameraStateType.CENTER) {
      this._drag(position, event.pointerId);
    }
  }

  private _drag(position: Point, pointerId: number): void {
    this._offsets = this._animatedOffsets;
    this._animatedOffsets = { x: 0, y: 0 };

    this._state = {
      type: RoomCameraStateType.DRAGGING,
      pointerId,
      startX: position.x,
      startY: position.y,
      currentX: this._offsets.x,
      currentY: this._offsets.y,
      skipBoundsCheck: true,
    };

    this._updatePosition();
  }

  private _enterDistanceState(position: Point, pointerId: number): void {
    this._state = {
      type: RoomCameraStateType.DISTANCE,
      pointerId,
      startX: position.x,
      startY: position.y,
    };
  }

  private _updatePosition(): void {
    switch (this._state.type) {
      case RoomCameraStateType.DRAGGING: {
        // When dragging, the current position consists of the current offset of the camera
        // and the drag difference.

        const diffX = this._state.currentX - this._state.startX;
        const diffY = this._state.currentY - this._state.startY;

        this._container.x = this._offsets.x + diffX;
        this._container.y = this._offsets.y + diffY;
        break;
      }

      case RoomCameraStateType.CENTER: {
        // When animating back to the zero point, we use the animatedOffsets of the camera.

        this._container.x = this._animatedOffsets.x;
        this._container.y = this._animatedOffsets.y;
        break;
      }

      default: {
        this._container.x = this._offsets.x;
        this._container.y = this._offsets.y;
      }
    }
  }

  private _handlePointerMove(event: FederatedPointerEvent): void {
    const box = this.room.bobba.app.canvas.getBoundingClientRect();
    const position = new Point(
      event.clientX - box.x - this.parent.worldTransform.tx,
      event.clientY - box.y - this.parent.worldTransform.ty
    );

    switch (this._state.type) {
      case RoomCameraStateType.DISTANCE: {
        this._tryUpgradeForDistance(this._state, position, event.pointerId);
        break;
      }

      case RoomCameraStateType.DRAGGING: {
        this._updateDragging(this._state, position, event.pointerId);
        break;
      }
    }
  }

  private _tryUpgradeForDistance(
    state: RoomCameraDistanceState,
    position: Point,
    pointerId: number
  ): void {
    if (state.pointerId !== pointerId) return;

    const distance = Math.sqrt(
      (position.x - state.startX) ** 2 + (position.y - state.startY) ** 2
    );

    // When the distance of the pointer travelled more than 10px, start dragging.
    if (distance >= 10) {
      this._state = {
        currentX: position.x,
        currentY: position.y,
        startX: position.x,
        startY: position.y,
        pointerId: pointerId,
        type: RoomCameraStateType.DRAGGING,
      };
      this._updatePosition();
    }
  }

  private _updateDragging(
    state: RoomCameraDraggingState,
    position: Point,
    pointerId: number
  ): void {
    if (state.pointerId !== pointerId) return;

    this._state = {
      ...state,
      currentX: position.x,
      currentY: position.y,
    };

    this._updatePosition();
  }

  private _handlePointerUp(event: FederatedPointerEvent): void {
    if (
      this._state.type === RoomCameraStateType.WAITING ||
      this._state.type === RoomCameraStateType.CENTER
    )
      return;

    if (this._state.pointerId !== event.pointerId) return;

    let animatingBack = false;

    if (this._state.type === RoomCameraStateType.DRAGGING) {
      animatingBack = this._stopDragging(this._state);
    }

    if (!animatingBack) {
      this._resetDrag();
    }
  }

  private _stopDragging(state: RoomCameraDraggingState): boolean {
    const diffX = state.currentX - state.startX;
    const diffY = state.currentY - state.startY;

    const currentOffsets = {
      x: this._offsets.x + diffX,
      y: this._offsets.y + diffY,
    };

    console.log('currentOffsets', currentOffsets, diffX, diffY, this._offsets);

    if (
      this.isOutOfBounds(currentOffsets) ||
      (state.skipBoundsCheck != null && state.skipBoundsCheck)
    ) {
      console.log('Centering camera 1');
      this.centerCamera(state, currentOffsets);
      console.log('Centering camera 2');
      return true;
    } else {
      console.log('Not centering camera');
      this._offsets = currentOffsets;
    }

    return false;
  }

  private _resetDrag(): void {
    this._state = { type: RoomCameraStateType.WAITING };
    this._updatePosition();
  }

  // private _onZoom = (event: WheelEvent): void => {
  //   const zoom = this.room.renderer.configuration.zoom!;
  //   const { step, level, min, max } = zoom;

  //   zoom.level = Math.max(
  //     min!,
  //     Math.min(max!, level! + (event.deltaY > 0 ? -step! : step!))
  //   );

  //   if (level === zoom.level && (level === min || level === max)) return;

  //   this.zoom(zoom.level!, zoom.duration!);
  // };

  // private _dragStart = (): void => {
  //   if (Date.now() - this._lastClickTime > this._clickThreshold) {
  //     this.dragging = true;
  //   }
  // };

  // private _dragEnd = (): void => {
  //   this.hasDragged = false;
  //   this.dragging = false;
  //   this._lastClickTime = Date.now();

  //   if (this.isOutOfBounds() && this.room.centerCamera) this.centerCamera();
  // };

  // private _dragMove = (event: PointerEvent): void => {
  //   if (this.dragging) {
  //     this.hasDragged = true;
  //     this.pivot.x -= event.movementX / (this.scale.x * devicePixelRatio);
  //     this.pivot.y -= event.movementY / (this.scale.y * devicePixelRatio);
  //   }
  // };

  public isOutOfBounds(offsets: Vector2D): boolean {
    // const { x, y } = this.pivot;
    // const { width, height } = this.room.bobba.canvas;
    // const { x: scaleX, y: scaleY } = {
    //   x: this.scale.x * devicePixelRatio,
    //   y: this.scale.y * devicePixelRatio,
    // };
    // const { width: scaledWidth, height: scaledHeight } = {
    //   width: width / scaleX / 2,
    //   height: height / scaleY / 2,
    // };

    // return (
    //   x - scaledWidth > this.width / scaleX ||
    //   x + scaledWidth < 0 ||
    //   y - scaledHeight > this.height / scaleY ||
    //   y + scaledHeight < 0
    // );

    const roomX = this.parent.worldTransform.tx + this.room.x;
    const roomY = this.parent.worldTransform.ty + this.room.y;

    const parentBounds = this.room.bobba.app.screen;

    if (roomX + this.room.roomWidth + offsets.x <= 0) {
      // The room is out of bounds to the left side.
      return true;
    }

    if (roomX + offsets.x >= parentBounds.width) {
      // The room is out of bounds to the right side.
      return true;
    }

    if (roomY + this.room.roomHeight + offsets.y <= 0) {
      // The room is out of bounds to the top side.
      return true;
    }

    if (roomY + offsets.y >= parentBounds.height) {
      // The room is out of bounds to the botoom side.
      return true;
    }

    return false;
  }

  public centerCamera(
    state: RoomCameraState = {
      type: RoomCameraStateType.WAITING,
    },
    current: Vector2D = { x: 0, y: 0 }
  ): void {
    const duration = 0.5;

    this._animatedOffsets = current;
    this._offsets = { x: 0, y: 0 };

    const newPos = { ...this._animatedOffsets };

    // gsap.to(this._container, {
    //   x: newPos.x,
    //   y: newPos.y,
    //   duration,
    //   ease: 'expo.inOut',
    // });

    gsap.to(newPos, {
      x: 0,
      y: 0,
      duration: duration / 1000, // GSAP erwartet Sekunden, Tween.js Millisekunden
      ease: 'power2.out', // Quadratic Out entspricht power2.out in GSAP
      onUpdate: () => {
        this._animatedOffsets = newPos;
        this._updatePosition();
      },
      onComplete: () => {
        this._state = { type: RoomCameraStateType.WAITING };
        this._updatePosition();
      },
    });
    // gsap.to(this.pivot, {
    //   x: Math.floor(this.width / this.scale.x / 2),
    //   y: Math.floor(this.height / this.scale.y / 2),
    //   duration,
    //   ease: 'expo.inOut',
    // });

    this._updatePosition();
  }

  // public zoom(zoom: number, duration = 0.8): void {
  //   const options: gsap.TweenVars = {
  //     x: zoom,
  //     y: zoom,
  //     duration,
  //     onStart: () => {
  //       this.zooming = true;
  //     },
  //     onComplete: () => {
  //       if (this.isOutOfBounds() && this.room.centerCamera) this.centerCamera();
  //       this.zooming = false;
  //     },
  //   };

  //   if (this.room.renderer.configuration.zoom?.direction === 'cursor') {
  //     const pointer = Object.assign(
  //       {},
  //       this.room.bobba.app.renderer.events.pointer.global
  //     );
  //     const { x: x1, y: y1 } = this.toLocal(pointer);

  //     options.onUpdate = () => {
  //       const { x: x2, y: y2 } = this.toLocal(pointer);
  //       this.pivot.x += x1 - x2;
  //       this.pivot.y += y1 - y2;
  //     };
  //   }

  //   gsap.to(this.scale, options);
  // }

  // public async screenshot(target: HTMLElement): Promise<string> {
  //   const renderer = this.room.bobba.app.renderer;
  //   const frame: DOMRect = target.getBoundingClientRect();
  //   const { left, top }: DOMRect =
  //     this.room.renderer.canvas.getBoundingClientRect();
  //   const rectPosition: Point = new Point(frame.left - left, frame.top - top);
  //   const renderTexture: RenderTexture = RenderTexture.create({
  //     height: frame.height,
  //     width: frame.width,
  //   });
  //   const transform: Matrix = new Matrix().translate(
  //     -rectPosition.x,
  //     -rectPosition.y
  //   );

  //   renderTexture.baseTexture.clear.setValue(
  //     this.room.renderer.configuration.backgroundColor
  //   );
  //   renderTexture.baseTexture.clear.setAlpha(
  //     this.room.renderer.configuration.backgroundAlpha
  //   );
  //   renderer.render(this.room.bobba.app.stage, {
  //     renderTexture,
  //     transform,
  //   });

  //   return await renderer.extract.base64(renderTexture);
  // }
}
