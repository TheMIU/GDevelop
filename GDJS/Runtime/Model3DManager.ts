/*
 * GDevelop JS Platform
 * Copyright 2013-present Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  const logger = new gdjs.Logger('Model3DManager');
  type OnProgressCallback = (loadedCount: integer, totalCount: integer) => void;
  type OnCompleteCallback = (totalCount: integer) => void;

  /**
   * Load GLB files (using `Three.js`), using the "model3D" resources
   * registered in the game resources.
   */
  export class Model3DManager {
    /**
     * Map associating a resource name to the loaded Three.js model.
     */
    private _loadedThreeModels = new Map<String, THREE.Object3D>();

    _resourcesLoader: RuntimeGameResourcesLoader;
    _resources: ResourceData[];

    _loader: THREE_ADDONS.GLTFLoader | null = null;

    _invalidModel: THREE.Object3D | null = null;

    /**
     * @param resources The resources data of the game.
     * @param resourcesLoader The resources loader of the game.
     */
    constructor(
      resources: ResourceData[],
      resourcesLoader: RuntimeGameResourcesLoader
    ) {
      this._resources = resources;
      this._resourcesLoader = resourcesLoader;

      if (typeof THREE !== 'undefined') {
        this._loader = new THREE_ADDONS.GLTFLoader();

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this._invalidModel = new THREE.Mesh(geometry);
      }
    }

    /**
     * Update the resources data of the game. Useful for hot-reloading, should not be used otherwise.
     *
     * @param resources The resources data of the game.
     */
    setResources(resources: ResourceData[]): void {
      this._resources = resources;
    }

    /**
     * Load all the 3D models.
     *
     * Note that even if a file is already loaded, it will be reloaded (useful for hot-reloading,
     * as files can have been modified without the editor knowing).
     *
     * @param onProgress The function called after each file is loaded.
     * @param onComplete The function called when all file are loaded.
     */
    loadModels(
      onProgress: OnProgressCallback,
      onComplete: OnCompleteCallback
    ): void {
      const resources = this._resources;
      const model3DResources = resources.filter(function (resource) {
        return resource.kind === 'model3D';
      });
      if (model3DResources.length === 0 || !this._loader) {
        return onComplete(model3DResources.length);
      }

      let loaded = 0;
      for (let i = 0; i < model3DResources.length; ++i) {
        const resource = model3DResources[i];

        this._loader.load(
          resource.file,
          (gltf) => {
            gltf.scene.rotation.order = 'ZYX';
            this._loadedThreeModels.set(resource.name, gltf.scene);

            loaded++;
            if (loaded === model3DResources.length) {
              onComplete(model3DResources.length);
            } else {
              onProgress(loaded, model3DResources.length);
            }
          },
          undefined,
          (error) => {
            logger.error(error);

            loaded++;
            if (loaded === model3DResources.length) {
              onComplete(model3DResources.length);
            } else {
              onProgress(loaded, model3DResources.length);
            }
          }
        );
      }
    }

    /**
     * Return a 3D model.
     *
     * Caller should not modify the object but clone it.
     *
     * @param resourceName The name of the json resource.
     * @returns a 3D model if it exists.
     */
    getModel(resourceName: string): THREE.Object3D | null {
      return this._loadedThreeModels.get(resourceName) || this._invalidModel;
    }
  }
}