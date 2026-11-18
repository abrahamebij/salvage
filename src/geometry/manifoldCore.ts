import Module from "manifold-3d";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let manifoldInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise: Promise<any> | null = null;

/**
 * Loads and initialises the manifold-3d WASM kernel once.
 * In the browser (Vite) the .wasm asset URL is resolved through `?url`.
 * In Node (the test suite) the package's default loader finds the .wasm itself.
 */
export async function getManifold() {
  if (manifoldInstance) return manifoldInstance;
  if (!initPromise) {
    initPromise = (async () => {
      let module;
      if (typeof window !== "undefined") {
        const { default: wasmUrl } = await import("manifold-3d/manifold.wasm?url");
        module = await Module({ locateFile: () => wasmUrl });
      } else {
        module = await Module();
      }
      module.setup();
      manifoldInstance = module;
      return module;
    })();
  }
  return initPromise;
}
