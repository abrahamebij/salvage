# Salvage Development Phases

This document breaks the Salvage build brief into small, approval-gated implementation phases. Each phase should produce a usable increment, end with validation, and wait for approval before the next phase begins.

## Working rules

- Do not install packages without approval. Before each install gate, list the package, version or range, and reason.
- Do not run `pnpm lint` or `pnpm build` without explicit approval.
- Do not invent Firebase configuration, App Check keys, cloud model names, sample assets, or other environment-specific values.
- Keep application state in memory. Do not add accounts, a database, or a backend.
- Keep AI estimation visibly separate from user measurement.
- End every phase with a short report containing completed work, validation results, known limitations, and the next approval request.
- Log every project change, phase transition, validation result, decision, and approval in `docs/status.md`.

## Phase 0 — Confirm the inputs and technical decisions

**Goal:** Resolve requirements that would otherwise block implementation.

### Tasks

- Confirm the repository structure and that the brief lives at `docs/salvage-project-brief.md`.
- Confirm the target browser and minimum Chrome version.
- Check the current Firebase AI Logic web documentation for:
  - Current package and import names.
  - Supported inference mode names.
  - The web equivalent of `inferenceSource`.
  - Current cloud-hosted model names.
  - App Check requirements.
- Propose the initial package list and wait for approval.
- Record user-supplied values that must not be guessed:
  - Firebase project configuration.
  - App Check reCAPTCHA site key.
  - Any approved cloud model name.
  - Demo and evaluation photos.

### Deliverables

- Confirmed technical decision list.
- Approved package list.
- List of missing user inputs and explicit placeholders for local development.

### Gate

Stop if Firebase values, the approved cloud model, or source-detection behavior are unknown.

## Phase 1 — Create the application shell

**Goal:** Establish a running React/Vite application with the product’s basic navigation.

### Tasks

- Scaffold React 19, Vite, and TypeScript using pnpm.
- Configure Tailwind CSS v4 and the approved shadcn/ui setup.
- Add the initial dark application shell.
- Add the persistent five-step navigation:
  - Capture
  - Analyse
  - Measure
  - Workbench
  - Export
- Make Capture the initial screen.
- Add placeholder favicon and the plain-text `Salvage` wordmark.
- Add `.env.example` with clearly marked placeholders only.
- Add basic shared types for application state and navigation.

### Deliverables

- The app opens to Capture.
- Navigation can move between placeholder screens.
- No product workflow is implied to be complete by placeholder screens.

### Validation

- Run the approved development command.
- Check desktop layout and a narrower viewport manually.
- Check keyboard focus reaches all navigation controls.

## Phase 2 — Build the Capture flow

**Goal:** Let a user provide valid source photos without involving AI yet.

### Tasks

- Add upload support for 3–6 PNG or JPEG files.
- Validate file type and photo count with clear user-facing errors.
- Generate local previews and allow removing or replacing photos.
- Convert unsupported image formats in the browser only if the approved implementation supports them safely.
- Add the `Load sample part` control, initially backed by a clearly marked placeholder until sample photos are supplied.
- Store capture state in memory.
- Add empty, loading, invalid-file, and too-few-photos states.

### Deliverables

- A complete Capture screen with local previews.
- A typed photo-input state that later AI calls can consume.

### Gate

Do not proceed to AI calls until the user has supplied sample photos or approved placeholder behavior.

## Phase 3 — Add Firebase and App Check wiring

**Goal:** Prove that the approved Firebase integration works before building the full AI workflow.

### Tasks

- Add the approved Firebase configuration through environment variables.
- Configure Firebase App Check using the supplied reCAPTCHA site key.
- Configure the local debug-token workflow without committing tokens.
- Add the Firebase AI Logic client using the current documented API.
- Add a minimal structured “hello hybrid” call using the approved model and `PREFER_ON_DEVICE`.
- Record requested mode, actual source if available, latency, and errors.
- Show the result in a small diagnostics view rather than hiding it in logs.

### Validation

- Test the call on the target Chrome desktop environment.
- Confirm whether on-device inference actually runs on the user’s laptop.
- Test the cloud fallback path where supported.
- Verify no credentials are committed or displayed unnecessarily.

### Stage 0 gate

If on-device inference cannot run on the user’s machine, stop here and report the limitation before building the remaining workflow.

## Phase 4 — Define the domain model and template schemas

**Goal:** Create one reliable source of truth for templates, parameters, provenance, and validation ranges.

### Tasks

- Define typed template identifiers:
  - `knob`
  - `clip`
  - `bracket`
  - `none`
- Define parameter metadata:
  - Name.
  - Unit.
  - Minimum.
  - Maximum.
  - Default.
  - Mating-critical flag.
- Define provenance values:
  - Measured.
  - Estimated.
  - Default.
- Define confidence and measurement-needed structures.
- Define analysis results and routing-ledger records.
- Define verifier result states:
  - Pass.
  - Fail.
  - Not applicable.
- Add runtime validation for AI response shapes.

### Deliverables

- Shared domain types and schemas used by the UI, geometry, AI, and verifier.
- No duplicated parameter definitions across screens.

## Phase 5 — Implement parametric geometry

**Goal:** Generate the three supported printable shapes from validated parameters.

### Package gate

Request approval for the selected WASM CSG package, with `manifold-3d` proposed only after verifying its current npm availability and browser suitability.

### Tasks

- Implement the control knob generator.
- Implement the snap clip generator.
- Implement the L-bracket generator.
- Add parameter-range guards before geometry generation.
- Keep each template generator pure and independently testable.
- Define consistent units and coordinate conventions.
- Handle invalid or incomplete parameters explicitly.

### Deliverables

- A mesh for each supported template.
- Deterministic output for the same template and parameter set.
- Visible error state when geometry cannot be generated.

## Phase 6 — Build the Three.js Workbench viewer

**Goal:** Give the user a clear, interactive view of the generated part.

### Tasks

- Add the central Three.js viewport.
- Add camera controls, sensible initial framing, grid or scale context, and reset view.
- Add a template-aware parameter panel.
- Add numeric inputs with units, ranges, and provenance chips.
- Rebuild the mesh on parameter changes.
- Preserve the selected template and parameters in memory while navigating.
- Add loading and geometry-error states.

### Deliverables

- A usable Workbench for manually selected templates.
- Live parameter edits reflected in the viewer.

## Phase 7 — Implement STL export without gating

**Goal:** Produce the required binary STL output from generated geometry.

### Tasks

- Add binary STL serialization.
- Add a download action with a deterministic, readable filename.
- Ensure exported units and orientation are consistent with the viewer.
- Add a temporary export status and error state.
- Keep final verifier gating disabled until Phase 9.

### Validation

- Open exported files in an independent STL viewer.
- Verify the file is binary STL and contains the expected geometry.
- Test each of the three templates.

## Phase 8 — Implement the deterministic verifier

**Goal:** Decide whether generated geometry is exportable without using AI.

### Tasks

- Run verification after every parameter change.
- Implement blocking checks:
  - Watertight and manifold mesh.
  - Bounding-box match against measured dimensions.
  - Mating-critical feature presence and size.
  - Minimum wall thickness.
- Implement warnings:
  - Thin features near the printable limit.
  - Simple overhang or bridge risk.
- Define configurable tolerances using brief-approved defaults.
- Show pass, fail, and not-applicable states with clear explanations.
- Add focused tests for each check and important boundary condition.

### Deliverables

- Verifier results in the right Workbench column.
- Export state derived from verifier results rather than UI guesses.

## Phase 9 — Add measurement and provenance workflows

**Goal:** Make every dimension’s origin explicit and enforce mating-critical measurements.

### Tasks

- Build the Measure screen from the AI “measurements still needed” list.
- Allow users to enter measurements with units and validation.
- Mark manually entered values as Measured.
- Preserve AI-proposed values as Estimated.
- Preserve untouched template values as Default.
- Add provenance chips beside every parameter.
- Block export when a mating-critical value is Estimated or Default.
- Make the transition to Measured explicit when a user confirms or replaces a value.

### Validation

- Confirm no AI value silently changes provenance.
- Confirm missing mating-critical measurements block export.
- Confirm non-critical estimated values remain visible and usable.

## Phase 10 — Add export gating, overrides, and honest limitations

**Goal:** Complete the safe export experience.

### Tasks

- Disable export while blocking verifier checks fail.
- Add explicit override confirmation for users who choose to export anyway.
- Record whether an override was used.
- Include the override state in the export record and STL filename.
- Always show: “Geometry checks passed. This is not a load-tested or mechanically verified part.”
- Ensure genuine errors use error styling while verifier status uses the approved semantic colors.

### Deliverables

- A complete, auditable Export screen.
- No export path that bypasses the intended confirmation flow.

## Phase 11 — Implement AI tasks and routing

**Goal:** Connect the real Capture → Analyse → Measure workflow to hybrid inference.

### Tasks

- Implement Task A: photo triage for each photo.
- Implement Task B: part identification and template selection.
- Implement Task C: parameter extraction with measurements.
- Validate every structured response at runtime.
- Apply the routing policy:
  1. Request `PREFER_ON_DEVICE`.
  2. Accept only valid, sufficiently confident, sane results.
  3. Escalate the same call with `ONLY_IN_CLOUD` when required.
  4. Show “not enough information” rather than guessing after failure.
- Record every call in the routing ledger:
  - Task.
  - Requested mode.
  - Actual source.
  - Latency.
  - Accepted or escalated state.
  - Escalation reason.
- Handle model-download, App Check, unsupported-browser, and cloud errors explicitly.

### Validation

- Test accepted on-device results.
- Test schema failure escalation.
- Test low-confidence escalation.
- Test out-of-range parameter escalation.
- Test cloud failure and insufficient-information states.

## Phase 12 — Complete the processing history and sample workflow

**Goal:** Make the hybrid behavior understandable to users and judges.

### Tasks

- Add the running Workbench ledger summary:
  - Calls kept on-device.
  - Calls escalated.
  - Total latency.
- Add the “How it was processed” screen with calls in order.
- Connect sample photos to the complete flow.
- Show photo-quality feedback before asking for measurements.
- Show the selected template, confidence, damage notes, and unknown geometry.
- Make the next action obvious after every failed or incomplete analysis.

### Deliverables

- A demonstrable end-to-end sample flow.
- A visible explanation of hybrid routing rather than hidden telemetry.

## Phase 13 — Design, accessibility, and resilience pass

**Goal:** Bring the complete workflow into the visual and usability constraints.

### Tasks

- Apply the dark charcoal, graphite, off-white, and warm amber system.
- Use a grotesque sans for UI text and monospace for measurements.
- Remove unnecessary rounded cards, gradients, blobs, and decorative imagery.
- Review all empty, loading, error, disabled, and not-enough-information states.
- Add keyboard navigation and visible focus states.
- Check semantic labels, form errors, dialog behavior, and color contrast.
- Check narrower desktop widths without changing the desktop-first layout.
- Verify the app remains understandable to home users while retaining professional detail.

### Validation

- Manual keyboard walkthrough of every step.
- Screen-reader-oriented label and error review.
- Manual review in supported Chrome desktop versions.

## Phase 14 — Evaluation and threshold tuning

**Goal:** Measure the routing behavior honestly and tune only from evidence.

### Tasks

- Gather 10–15 supplied evaluation photos or close stand-ins.
- Run Tasks A–C on each case.
- Record per call:
  - Accepted on-device.
  - Escalated to cloud.
  - Failed.
- Record representative failure examples.
- Tune confidence and sanity thresholds only from the evaluation results.
- Clearly label the results as a smoke test, not a benchmark.

### Deliverables

- Evaluation summary for the README.
- Documented threshold changes and their reasons.

## Phase 15 — Documentation, deployment, and freeze

**Goal:** Prepare the project for judging and prevent last-minute scope drift.

### Tasks

- Add an Apache 2.0 license unless another license is approved.
- Complete the README:
  - What Salvage does.
  - Hybrid routing design.
  - Chrome on-device setup and flag.
  - Local setup.
  - Third-party libraries and assets.
  - AI assistance credit.
  - What it does not do yet.
  - Evaluation results.
- Configure deployment and register the hosted domain with App Check.
- Verify no secrets are present in the repository.
- Run the approved final validation commands.
- Record a short demo path for all three templates.
- Create the submission checklist for the three hackathons.
- Freeze feature scope by Nov 28; reserve Nov 29–30 for fixes and submission work only.

### Final acceptance checklist

- Capture accepts valid photos and sample photos.
- Analyse produces validated results or an honest insufficient-information state.
- Measure distinguishes Measured, Estimated, and Default values.
- Workbench updates geometry and verifier results live.
- Export produces binary STL and respects gating or explicit override.
- Routing history shows every AI call and escalation reason.
- The limitations notice is visible wherever export occurs.
- The app works without accounts, a database, or a backend.
- The README and hosted demo accurately describe current behavior.
