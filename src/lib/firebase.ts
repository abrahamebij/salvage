import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  type GenerativeModel,
} from "firebase/ai";

// Enable Firebase App Check debug token for local development
if (typeof window !== "undefined" && import.meta.env.DEV) {
  // @ts-expect-error - Global debug token for App Check in development
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export type AppCheckState = "active" | "debug" | "inactive";

let appCheckState: AppCheckState = "inactive";
let appCheckInitialized = false;

export function getAppCheckState(): AppCheckState {
  return appCheckState;
}

/**
 * Starts App Check. Firebase AI Logic requires it for this submission.
 * - With a real reCAPTCHA site key: App Check runs normally (in dev it uses the debug token).
 * - In dev with no key: App Check still starts in debug mode (the debug token replaces reCAPTCHA),
 *   so the debug-token workflow works before a site key exists. The console prints a debug token
 *   the first time; register it in Firebase console > App Check > Apps > Manage debug tokens.
 * - In a production build with no key: App Check stays off and this is reported, never hidden.
 */
export function setupAppCheck(): AppCheckState {
  if (typeof window === "undefined" || appCheckInitialized) return appCheckState;

  const rawKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY as string | undefined;
  const hasRealKey = !!rawKey && !rawKey.startsWith("your_");
  const isDev = import.meta.env.DEV;

  if (!hasRealKey && !isDev) {
    console.warn("App Check is OFF: VITE_FIREBASE_APPCHECK_KEY is not set in this build.");
    appCheckState = "inactive";
    return appCheckState;
  }

  try {
    initializeAppCheck(app, {
      // In dev the debug token is used and reCAPTCHA is never contacted, so a placeholder is fine.
      provider: new ReCaptchaV3Provider(hasRealKey ? rawKey! : "debug-mode-placeholder-key"),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
    appCheckState = isDev ? "debug" : "active";
  } catch (e) {
    console.warn("Firebase App Check initialization notice:", e);
    appCheckState = "inactive";
  }
  return appCheckState;
}

/** The cloud model comes only from the environment. There is deliberately no hard-coded fallback. */
export function getCloudModelName(): string {
  const name = import.meta.env.VITE_FIREBASE_CLOUD_MODEL as string | undefined;
  if (!name || name.startsWith("your_")) {
    throw new Error(
      "VITE_FIREBASE_CLOUD_MODEL is not set. Pick a current model from the Firebase AI Logic supported-models page and put it in .env."
    );
  }
  return name;
}

// Initialize Firebase AI Logic with Google AI backend
export const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

export interface HybridTestResult {
  requestedMode: string;
  actualSource: string;
  latencyMs: number;
  output: string;
  success: boolean;
  error?: string;
  timestamp: string;
  cloudModel?: string;
  appCheck: AppCheckState;
}

export async function runHelloHybridTest(
  mode: InferenceMode = InferenceMode.PREFER_ON_DEVICE
): Promise<HybridTestResult> {
  const appCheck = setupAppCheck();
  const startTime = performance.now();
  let cloudModel: string | undefined;

  try {
    cloudModel = getCloudModelName();
    const model: GenerativeModel = getGenerativeModel(ai, {
      mode,
      inCloudParams: {
        model: cloudModel,
      },
    });

    const prompt =
      'You are a mechanical part validator. Reply in JSON with two keys: "status" ("ready") and "engine" ("salvage-hybrid").';

    const result = await model.generateContent(prompt);
    const latencyMs = Math.round(performance.now() - startTime);

    const actualSource =
      result.response.inferenceSource === InferenceSource.ON_DEVICE
        ? "ON_DEVICE"
        : result.response.inferenceSource === InferenceSource.IN_CLOUD
        ? "IN_CLOUD"
        : "UNKNOWN";

    const text = result.response.text();

    return {
      requestedMode: mode,
      actualSource,
      latencyMs,
      output: text,
      success: true,
      timestamp: new Date().toLocaleTimeString(),
      cloudModel,
      appCheck,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    return {
      requestedMode: mode,
      actualSource: "FAILED",
      latencyMs,
      output: "",
      success: false,
      error: errorMessage,
      timestamp: new Date().toLocaleTimeString(),
      cloudModel,
      appCheck,
    };
  }
}

export { InferenceMode, InferenceSource };
