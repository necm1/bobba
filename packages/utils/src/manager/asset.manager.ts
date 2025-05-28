import { Assets, Texture, Spritesheet, Cache } from 'pixi.js';
import { Manager } from '../interface';
import { EventEmitter } from 'events';

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
  // private eventEmitter: EventEmitter = new EventEmitter();

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
    try {
      await Promise.all(
        Object.entries(manifest).map(([key, path]) =>
          this.loadAsset(key, path, cache)
        )
      );
      // this.emit('resources.loaded', manifest);
    } catch (error) {
      console.error('Error loading assets:', error);
      // this.emit('resources.error', error);
    }
  }

  public async loadAsset(
    key: string,
    assetPath: string | Texture | Spritesheet,
    cache = true
  ): Promise<void> {
    if (this.assets.has(key)) {
      await this.assets.get(key);
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

      const assetPromise = Assets.load(key);
      this.assets.set(key, assetPromise);

      try {
        await assetPromise;
        console.log(`Asset ${key} loaded successfully`);
        // this.emit('asset.loaded', { key, assetPath });
      } catch (error) {
        console.error(`Error loading asset ${key}:`, error);
        // this.emit('asset.error', { key, error });
      }
    }
  }

  public async get(key: string): Promise<any> {
    if (this.assets.has(key)) {
      return await this.assets.get(key);
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

  // public on(event: string, listener: (data: unknown) => void): void {
  //   this.eventEmitter.on(event, listener);
  // }

  // public off(event: string, listener: (data: unknown) => void): void {
  //   this.eventEmitter.off(event, listener);
  // }

  // private emit(event: string, data: unknown): void {
  //   this.eventEmitter.emit(event, data);
  // }
}
