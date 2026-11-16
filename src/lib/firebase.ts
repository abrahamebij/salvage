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

let appCheckInitialized = false;
export function setupAppCheck() {
  if (typeof window === "undefined" || appCheckInitialized) return;
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY;
  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInitialized = true;
    } catch (e) {
      console.warn("Firebase App Check initialization notice:", e);
    }
  }
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
}

export async function runHelloHybridTest(
  mode: InferenceMode = InferenceMode.PREFER_ON_DEVICE
): Promise<HybridTestResult> {
  setupAppCheck();
  const startTime = performance.now();
  const cloudModel = import.meta.env.VITE_FIREBASE_CLOUD_MODEL || "gemini-2.0-flash";

  try {
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
    };
  }
}

export { InferenceMode, InferenceSource };
