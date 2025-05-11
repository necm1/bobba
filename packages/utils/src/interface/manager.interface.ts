export abstract class Manager {
  private static instance: Manager;

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
  public static getInstance(): Manager {
    throw new Error(
      'getInstance method must be implemented in the derived class'
    );
  }
}
