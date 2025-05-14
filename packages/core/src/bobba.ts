import { Application, Sprite, Texture, ICanvas, RenderLayer } from 'pixi.js';
import { AssetManager } from '@bobba/utils';

export class Bobba {
  private static instance: Bobba;
  public app: Application;
  public backgroundSprite: Sprite;
  public canvas: ICanvas;
  public assetManager: AssetManager = AssetManager.getInstance();
  public layer = new RenderLayer();

  /**
   * @method getInstance
   * @static
   * @description This method returns the singleton instance of Bobba.
   * If the instance does not exist, it creates a new instance.
   */
  public static getInstance(): Bobba {
    if (!Bobba.instance) {
      Bobba.instance = new Bobba();
    }

    return Bobba.instance;
  }

  public async init() {
    await this._initializePixiApplication();
    await this._setupBackground();
    this._addResizeListener();

    document.body.appendChild(this.app.canvas);
  }

  public async load(): Promise<void> {
    await this.assetManager.loadAssets({
      'room/assets': 'http://127.0.0.1:8081/generic/room/room_data.json',
      'room/room': 'http://127.0.0.1:8081/generic/room/room.json',
      'room/cursors':
        'http://127.0.0.1:8081/generic/tile_cursor/tile_cursor.json',
      'furnitures/floor/placeholder':
        'http://127.0.0.1:8081/generic/place_holder/place_holder_furniture.json',
      'furnitures/wall/placeholder':
        'http://127.0.0.1:8081/generic/place_holder/place_holder_wall_item.json',
      'furnitures/furnidata': 'http://127.0.0.1:8081/gamedata/furnidata.json',
      'figures/figuredata': 'http://127.0.0.1:8081/gamedata/figuredata.json',
      'figures/figuremap': 'http://127.0.0.1:8081/gamedata/figuremap.json',
      'figures/draworder': 'http://127.0.0.1:8081/gamedata/draworder.json',
      'figures/actions':
        'http://127.0.0.1:8081/generic/HabboAvatarActions.json',
      'figures/partsets':
        'http://127.0.0.1:8081/generic/HabboAvatarPartSets.json',
      'figures/animations':
        'http://127.0.0.1:8081/generic/HabboAvatarAnimations.json',
    });

    console.log('Assets loaded');
  }

  /**
   * Destroys the Bobba instance and releases resources.
   * @public
   */
  public destroy(): void {
    this.app.destroy(true, { children: true });
    window.removeEventListener('resize', this._addResizeListener);
    console.log('Bobba instance destroyed.');
  }

  /**
   * Initializes the PixiJS application.
   * @private
   */
  private async _initializePixiApplication(): Promise<void> {
    this.app = new Application();

    await this.app.init({
      backgroundColor: 0x1099bb,
      resizeTo: window,
      height: window.innerHeight,
      width: window.innerWidth,
      antialias: false,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      eventMode: 'passive',
    });

    this.canvas = this.app.canvas;

    // this.layer..enableSort = true;
    this.app.stage.addChild(this.layer);
  }

  /**
   * Sets up the background gradient texture and adds it to the stage.
   * @private
   */
  private async _setupBackground(): Promise<void> {
    return new Promise<void>((res) => {
      const texture = this.createGradientTexture(
        document.body.clientWidth,
        document.body.clientHeight,
        [
          [0, '#0B5A80'],
          [1, '#0B3A65'],
        ]
      );

      this.backgroundSprite = new Sprite(texture);
      this.app.stage.addChildAt(this.backgroundSprite, 0);

      res();
    });
  }

  /**
   * Adds a resize event listener to handle window resizing.
   * @private
   */
  private _addResizeListener(): void {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.app.renderer.resize(w, h);
      this.backgroundSprite.width = w;
      this.backgroundSprite.height = h;
    });
  }

  private createGradientTexture(
    width: number,
    height: number,
    colorStops: [number, string][]
  ): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    colorStops.forEach(([offset, color]) => {
      gradient.addColorStop(offset, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return Texture.from(canvas);
  }
}
