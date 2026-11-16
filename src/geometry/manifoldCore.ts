import Module from "manifold-3d";
import wasmUrl from "manifold-3d/manifold.wasm?url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let manifoldInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise: Promise<any> | null = null;

export async function getManifold() {
  if (manifoldInstance) return manifoldInstance;
  if (!initPromise) {
    initPromise = (async () => {
      const module = await Module({
        locateFile: () => wasmUrl,
      });
      module.setup();
      manifoldInstance = module;
      return module;
    })();
  }
  return initPromise;
}
