import { Assets, Texture, Spritesheet, Cache } from 'pixi.js';
import { Manager } from '../interface';

/**
 * @class AssetManager
 * @description This class is responsible for managing assets in the application.
 * It provides methods to load, unload, and manage assets.
 * It also provides methods to handle asset events and manage asset states.
 * @example
 * const assetManager = new AssetManager();
 * assetManager.loadAsset('path/to/asset');
 * assetManager.unloadAsset('path/to/asset');
 * assetManager.on('assetLoaded', (asset) => {
 *  console.log('Asset loaded:', asset);
 * });
 * assetManager.on('assetUnloaded', (asset) => {
 * console.log('Asset unloaded:', asset);
 * });
 */
export class AssetManager implements Manager {
  private static instance: AssetManager;

  private assets: Map<string, Promise<Texture | Spritesheet>> = new Map();

  /**
   * @method getInstance
   * @static
   * @description This method returns the singleton instance of the AssetManager.
   * If the instance does not exist, it creates a new instance.
   * @example
   * const assetManager = AssetManager.getInstance();
   * assetManager.loadAsset('path/to/asset');
   * @returns {AssetManager} The singleton instance of the AssetManager
   */
  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }

    return AssetManager.instance;
  }

  public async loadAssets(
    manifest: Record<string, string>,
    cache = true
  ): Promise<void> {
    await Promise.all(
      Object.entries(manifest).map(([key, path]) =>
        this.loadAsset(key, path, cache)
      )
    );
  }

  public async loadAsset(
    key: string,
    assetPath: string,
    cache = true
  ): Promise<void> {
    if (this.assets.has(key)) {
      await this.assets.get(key);
      console.log('Asset exists loading:', key);
      return;
    }

    if (!Cache.has(key) && cache) {
      Assets.add({
        alias: key,
        src: assetPath,
        metadata: {
          cache: true,
          crossOrigin: 'anonymous',
        },
      });

      this.assets.set(key, Assets.load(key));
      await this.assets.get(key);
    }

    return undefined;
  }

  public async get(key: string): Promise<Texture | Spritesheet> {
    if (this.assets.has(key)) {
      return (await this.assets.get(key)) as Texture | Spritesheet;
    }

    const asset = Assets.get(key);

    if (!asset) {
      throw new Error(`Asset ${key} not loaded`);
    }

    return asset;
  }

  public async unloadAsset(assetPath: string): Promise<void> {
    return Assets.unload(assetPath);
  }

  // on(event: string, callback: Function) {
  //   // Register an event listener for the given event
  //   // this.events.set(event, callback);
  //   // Assets.on(event, callback);
  //   // Assets.on(event, callback);
  // }

  // off(event: string, callback: Function) {
  //   // Unregister an event listener for the given event
  // }
}
