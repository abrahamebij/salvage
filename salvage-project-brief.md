# Salvage: Build Brief

**One line:** Photos of a broken part in, a verified, printable replacement out. A small on-device model does the quick work offline, the cloud model only steps in when it is not sure, and deterministic geometry checks decide what can be exported.

**Platform:** Web only, Chrome desktop (on-device inference is Chrome desktop only).
**Stack:** React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui, Framer Motion, three.js. Not Next.js. pnpm.
**Targets (same build, three Devpost submissions):**
| Hackathon | Deadline | Angle |
|---|---|---|
| #BuildHybridAI 2026 (Firebase AI Logic, $30K) | Nov 30 2026, 11:00pm GMT+1 | Hybrid inference is the core of the product |
| Code for Change | Dec 2 2026, 2:00am GMT+1 | Repair over replace, less waste, affordable fixes for repair shops |
| LaunchPad Hacks | Dec 4 2026, 11:00pm GMT+1 | Real problem, working prototype, honest limits |

**Internal freeze target: Nov 28.** The BuildHybridAI deadline is the binding one.

---

## 0. Standing rules (apply to every stage)

- No `pnpm lint` or `pnpm build` without explicit sign-off.
- No package installs without asking. At each stage, list the packages you want, why, and wait for approval.
- No invented values. Firebase config, reCAPTCHA site key, cloud model names and any other constants must come from the user or from the official docs, checked at build time. If unknown, stop and ask. Use clearly marked placeholders in `.env.example`.
- Do not let AI-estimated numbers present themselves as measured. See section 5.
- Every stage ends with a short report and waits for approval before the next stage starts.

## 1. Product

**User:** a technician or repair shop owner who regularly meets small broken parts that are discontinued or too expensive to import.

**Scope (small non-electrical mechanical and plastic parts):** three parametric templates only.
1. **Control knob** (appliance knob with shaft bore)
2. **Snap clip**
3. **L-bracket**

No free-form image-to-3D. The AI picks the template and fills its parameters. The browser builds the model and checks it.

**Output:** binary STL only. No STEP.

**What it must be honest about:** geometry-valid is not load-tested. The UI says so wherever export happens.

## 2. User flow

1. **Capture:** upload 3 to 6 photos (PNG or JPEG). A "Load sample part" button loads bundled demo photos so judges can try without their own.
2. **Analyse:** AI checks photo quality, identifies the part class, picks a template, proposes parameters, lists what it cannot know.
3. **Measure:** user enters caliper measurements for every field the AI flagged as needed. Each value shows where it came from (see section 5).
4. **Workbench:** 3D viewer in the center, parameters on the left, verifier results on the right, routing ledger at the bottom. Edits re-run the checks live.
5. **Export:** STL download, gated by the verifier (section 6), with the limitations notice.
6. **How it was processed:** a screen listing every AI call in order: task, on-device or cloud, latency, whether it was escalated and why.

No accounts, no database, no backend. State lives in memory. Firebase is used only for AI Logic and App Check.

## 3. Hybrid AI architecture (the heart of the BuildHybridAI entry)

**SDK:** Firebase AI Logic web SDK (`firebase/ai`): `getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode`. Cloud backend: Gemini Developer API.

**Inference modes** (check current names in the docs before using): `PREFER_ON_DEVICE`, `PREFER_IN_CLOUD`, `ONLY_ON_DEVICE`, `ONLY_IN_CLOUD`.

**Known constraints of on-device inference on web (from the Firebase docs):**
- Chrome on desktop only, Chrome 139 or newer.
- Multimodal input needs the flag `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` enabled, then a Chrome restart.
- Image inputs on-device: PNG and JPEG only. Convert anything else (HEIC, WebP) in the browser before sending.
- Single-turn text generation only. No chat sessions. Structured output is supported.
- The model may need to download on first use.
- App Check is required. Debug tokens are accepted for the hackathon submission.
- To let end users try on-device without the flag, a Prompt API Chrome origin trial token exists. Optional. The cloud fallback means judges without it still get a working app.

**Cloud model name:** do not assume one. Look up the currently supported cloud-hosted model names in the Firebase AI Logic docs, propose one, and wait for approval.

**Three single-turn structured calls** (each returns JSON validated against a schema):

| Task | Input | Output |
|---|---|---|
| A. Photo triage | one photo | usable yes/no, blur, framing, whether a scale reference is visible, which angle it covers |
| B. Part identification | the usable photos | part class, chosen template (knob, clip, bracket, or none), confidence, damage notes |
| C. Parameter extraction | photos + chosen template + any user measurements | template parameters, each with a source tag, confidence, and a list of measurements still needed |

**Routing policy (initial defaults, tune against the eval):**
1. Call with `PREFER_ON_DEVICE`.
2. Accept the on-device result only if: the JSON passes schema validation, the self-reported confidence is at least 0.7, and every numeric parameter is inside the template's sane range.
3. Otherwise escalate: repeat the same call with `ONLY_IN_CLOUD` and record the reason.
4. If the cloud call also fails or the result is below threshold, do not guess. Show the "not enough information" state and ask the user for more photos or measurements.

**Routing ledger (must be visible in the UI, not only in logs):** for each call, store task, mode requested, source that actually ran it, latency, accepted or escalated, escalation reason. Show a running summary in the Workbench: calls kept on-device, calls escalated, total latency. On Android the SDK exposes which source answered (`inferenceSource`); confirm the web SDK exposes the equivalent. If it does not, detect the source another way and tell the user before building around it.

## 4. Parametric templates

Each template is a pure function from parameters to geometry, built with a WASM CSG kernel in the browser. Candidate: `manifold-3d`. Verify it on npm and propose it at the install gate. Parameters below are a starting point. Adjust after review.

- **Knob:** outer diameter, height, shaft bore diameter, shaft bore depth, D-flat width, D-flat depth, pointer notch on/off, grip style (smooth or knurled).
- **Snap clip:** width, thickness, arm length, hook depth, hook angle, gap.
- **L-bracket:** leg A length, leg B length, width, thickness, hole diameter, hole count and spacing, fillet radius.

Each parameter has: unit (mm), min, max, default, and a flag for whether it is mating-critical (a bore, a hole, a snap fit). Mating-critical parameters must be user-measured before export.

## 5. Measurement and provenance

Every dimension carries a source tag shown as a small chip next to the value:
- **Measured:** typed in by the user.
- **Estimated:** proposed by the AI from photos.
- **Default:** template default.

Rules:
- An AI-estimated value never silently becomes Measured.
- Mating-critical parameters left as Estimated or Default block export until the user confirms or changes them.
- The AI's "what I still need" list drives the Measure screen.

## 6. Verifier (deterministic code, no AI)

Runs on every parameter change. Results are listed with pass, fail, or not applicable.

Blocking checks (export disabled until they pass):
- Mesh is watertight and manifold.
- Bounding box matches the user-measured overall dimensions within a tolerance (default 0.5 mm, configurable).
- Mating-critical features exist and match their measured values (bore, holes, hooks).
- Minimum wall thickness at least 1.2 mm (default, configurable).

Warning checks (shown, do not block):
- Thin features near the printable limit.
- Overhang or bridge risk flagged by simple geometry rules.

**Override:** a user may export past a failing blocking check only after an explicit confirmation, and the STL filename and the export record note the override.

**Export notice (always shown):** "Geometry checks passed. This is not a load-tested or mechanically verified part."

## 7. Design constraints (frontend)

- Dark mode, one primary color only (a warm amber). Everything else is neutral (charcoal, graphite, off-white).
- No secondary or tertiary brand colors. Danger, warning and success colors appear only inside verifier results and genuine error states, and nowhere else.
- Desktop-first (Chrome desktop), sensible at narrower widths.
- Measurements and parameter values in a monospace face. UI text in a grotesque sans. Not Inter.
- No purple gradients, no generic 3D blobs, no stock imagery, no excessive rounded cards, no unnecessary glassmorphism.
- No external design tool output and no logo asset are supplied. Design the UI directly from these constraints. Use the plain text name "Salvage" in the header and a simple placeholder favicon until a logo is provided.
- Layout: a persistent top bar with the five steps (Capture, Analyse, Measure, Workbench, Export). The Workbench is a three-column tool layout (parameters, 3D viewport, verifier) with the routing ledger as a bottom strip. Avoid a marketing-style landing page. The app opens straight into Capture.

## 8. Staged plan (approve each stage before the next)

| Stage | Target | Contents |
|---|---|---|
| 0 | Nov 16 to 17 | Vite + React + Tailwind scaffold. Firebase project wiring with App Check (debug token locally). One hello-hybrid call using `PREFER_ON_DEVICE`, showing which source answered. Report whether on-device actually runs on the user's laptop. |
| 1 | Nov 18 to 20 | Three.js viewer, the three templates, parameter panel, STL export (no gating yet). |
| 2 | Nov 21 to 22 | Verifier, provenance chips, export gating, override flow, limitations notice. |
| 3 | Nov 23 to 25 | AI tasks A, B, C with schemas, the routing policy, the routing ledger and the "How it was processed" screen. Sample part loader. |
| 4 | Nov 26 to 27 | Design pass against section 7: spacing, type hierarchy, empty and error states. Accessibility pass (contrast, focus states, keyboard). |
| 5 | Nov 28 | Freeze. README, license, deploy, a small recorded eval, submission checklist. Nov 29 to 30 is buffer only. |

**Stage 0 is a gate.** If on-device inference cannot run on the user's machine, stop and report before building anything else.

## 9. Small eval (feeds the README and the routing thresholds)

The user supplies 10 to 15 photos of real broken parts (or close stand-ins). Run tasks A to C on each and record, per call: on-device accepted, escalated to cloud, failed. Report the percentages and a few failure examples in the README. Treat it as a smoke test, not a benchmark, and say so.

## 10. Repository requirements (BuildHybridAI)

- Public GitHub repo under @abrahamebij with an open source license file visible in the About section (Apache 2.0 preferred).
- Firebase AI Logic must be imported and actually called at runtime in the code, not only named in the README.
- README sections: what it does, the hybrid routing design, how to enable on-device inference in Chrome (version, flag, restart), how to run locally, "Built during the hackathon" (everything is new; list third-party libraries and assets), "What it does not do yet" (see below), the eval results.
- Credit AI assistance in the README (LaunchPad asks for it).
- A hosted URL for judging. Register the deployed domain with App Check.
- No private credentials in the repo.

**"What it does not do yet" must say at least:**
- Three templates only, no free-form reconstruction.
- Photos cannot reveal hidden geometry, exact dimensions or material, so mating-critical sizes need caliper input.
- Passing geometry checks does not mean a part is safe under load.
- On-device inference works in Chrome desktop with specific setup. Otherwise everything runs in the cloud.

## 11. Items the user must supply

- Firebase project config values and the App Check reCAPTCHA site key.
- 3 to 5 sample photos for the demo part, and 10 to 15 for the eval.
