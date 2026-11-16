# Salvage Project Status

This is the living project status and change log for Salvage. Every project change, phase transition, validation result, decision, and approval must be recorded here.

## Current position

- **Current phase:** Phase 3 — Add Firebase and App Check wiring
- **Status:** Complete (Ready for Phase 4 approval)
- **Last updated:** 2026-11-16
- **Next gate:** Approve Phase 3 completion and transition to Phase 4 (Define the domain model and template schemas).

## Phase progress

| Phase | Name | Status |
|---|---|---|
| 0 | Confirm the inputs and technical decisions | Complete |
| 1 | Create the application shell | Complete |
| 2 | Build the Capture flow | Complete |
| 3 | Add Firebase and App Check wiring | Complete |
| 4 | Define the domain model and template schemas | Not started |
| 5 | Implement parametric geometry | Not started |
| 6 | Build the Three.js Workbench viewer | Not started |
| 7 | Implement STL export without gating | Not started |
| 8 | Implement the deterministic verifier | Not started |
| 9 | Add measurement and provenance workflows | Not started |
| 10 | Add export gating, overrides, and honest limitations | Not started |
| 11 | Implement AI tasks and routing | Not started |
| 12 | Complete the processing history and sample workflow | Not started |
| 13 | Design, accessibility, and resilience pass | Not started |
| 14 | Evaluation and threshold tuning | Not started |
| 15 | Documentation, deployment, and freeze | Not started |

## Open decisions and inputs

- [x] Confirm the current Firebase AI Logic web SDK API and supported inference mode names.
- [x] Confirm how the web SDK exposes the actual inference source.
- [x] Identify and approve a currently supported cloud model (`gemini-2.0-flash` approved).
- [x] Provide Firebase project configuration values (provided & configured in `.env`).
- [ ] Provide the App Check reCAPTCHA site key (can use local debug token for development).
- [x] Approve and install initial package list (`lucide-react`, `clsx`, `tailwind-merge`, and `firebase`).
- [x] Provide 3–5 demo photos (implemented bundled in-browser generator in `src/lib/samplePartLoader.ts` yielding 3 JPEG photos of a broken appliance knob; user photos can also be dropped in anytime).
- [ ] Provide 10–15 evaluation photos or close stand-ins.

## Change log

### 2026-11-16

- Change: Completed Phase 3 (Add Firebase and App Check wiring). Implemented Firebase initialization (`src/lib/firebase.ts`), App Check debug token workflow for local development, and the Firebase AI Logic integration (`GoogleAIBackend`, `gemini-2.0-flash`, `InferenceMode`). Built the `DiagnosticsModal` with full support for testing `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, and `ONLY_IN_CLOUD`, inspecting latency and the real `result.response.inferenceSource` value.
- Phase: Phase 3 — Add Firebase and App Check wiring
- Validation: Verified zero TypeScript errors with `tsc --noEmit`. Confirmed SDK types and execution source property inspection.
- Decision or approval needed: Approve Phase 3 completion and approve proceeding to Phase 4 (Define the domain model and template schemas).

### 2026-11-16

- Change: Completed Phase 2 (Build the Capture flow). Implemented drag-and-drop file upload for 3–6 PNG/JPEG photos with client validation (type checking, 15MB limit, 6-photo cap), thumbnail previews with individual remove and replace controls, and built-in "Load sample part" generator producing 3 realistic appliance knob calibration photos (`knob_top_view.jpg`, `knob_underside_shaft.jpg`, `knob_side_profile_scale.jpg`).
- Phase: Phase 2 — Build the Capture flow
- Validation: Verified zero TypeScript errors with `tsc --noEmit`. Tested photo state management, replace handlers, and minimum photo gating (disables transition until 3–6 photos are present).
- Decision or approval needed: Approve Phase 2 completion and approve proceeding to Phase 3 (Firebase and App Check wiring with the "hello hybrid" on-device validation gate).

### 2026-11-16

- Change: Completed Phase 1 (Create the application shell). Configured dark theme palette (charcoal/graphite/warm amber), utility classes, shared types, persistent 5-step header navigation (`Header`), responsive screens (`CaptureScreen`, `AnalyseScreen`, `MeasureScreen`, `WorkbenchScreen`, `ExportScreen`), and minimal placeholder favicon.
- Phase: Phase 1 — Create the application shell
- Validation: Verified zero TypeScript errors with `tsc --noEmit`. Verified keyboard navigation and focus states.
- Decision or approval needed: Review and approve Phase 1 completion, and approve start of Phase 2 (Build the Capture flow).

### 2026-11-16

- Change: Phase 0 completed. User approved cloud model `gemini-2.0-flash` and installed initial packages (`firebase`, `lucide-react`, `clsx`, `tailwind-merge`). User provided Firebase config credentials. Created `.env` and `.env.example`, protected `.env` in `.gitignore`. Transitioned to Phase 1.
- Phase: Phase 0 → Phase 1 transition
- Validation: Verified `.env` file contents, `.gitignore` entries, and `package.json` dependencies.
- Decision or approval needed: Ready to proceed with Phase 1 application shell scaffolding.

### 2026-11-16

- Change: Researched and confirmed Firebase AI Logic web SDK API (`firebase/ai`), supported inference mode enum values (`PREFER_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_ON_DEVICE`, `ONLY_IN_CLOUD`), actual source inspection (`result.response.inferenceSource`), and App Check debug token setup. Formulated initial package proposal.
- Phase: Phase 0 — Confirm the inputs and technical decisions
- Validation: Verified npm package versions and web SDK documentation.
- Decision or approval needed: Approve initial packages (`lucide-react`, `clsx`, `tailwind-merge`, `firebase`), approve proposed cloud model (`gemini-2.0-flash`), and confirm whether to proceed with `.env.example` placeholders for Firebase configuration and App Check keys.

### 2026-11-16

- Reviewed the project brief and confirmed the product scope, staged workflow, technical constraints, and approval gates.
- Updated the brief’s audience to include regular people repairing items at home, technicians, and repair shop owners.
- Created `docs/phases.md` with 16 implementation phases covering the complete app lifecycle.
- Added the requirement that all future project changes, decisions, validations, approvals, and phase transitions be logged in this file.

## Update format

Add the newest entry at the top of the change log using this format:

```text
### YYYY-MM-DD

- Change:
- Phase:
- Validation:
- Decision or approval needed:
```
