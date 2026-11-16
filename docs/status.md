# Salvage Project Status

This is the living project status and change log for Salvage. Every project change, phase transition, validation result, decision, and approval must be recorded here.

## Current position

- **Current phase:** Phase 0 — Confirm the inputs and technical decisions
- **Status:** In progress
- **Last updated:** 2026-11-16
- **Next gate:** Confirm the initial technical decisions and approve the package list before scaffolding.

## Phase progress

| Phase | Name | Status |
|---|---|---|
| 0 | Confirm the inputs and technical decisions | In progress |
| 1 | Create the application shell | Not started |
| 2 | Build the Capture flow | Not started |
| 3 | Add Firebase and App Check wiring | Not started |
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

- [ ] Confirm the current Firebase AI Logic web SDK API and supported inference mode names.
- [ ] Confirm how the web SDK exposes the actual inference source.
- [ ] Identify and approve a currently supported cloud model.
- [ ] Provide Firebase project configuration values.
- [ ] Provide the App Check reCAPTCHA site key.
- [ ] Approve the initial package list.
- [ ] Provide 3–5 demo photos.
- [ ] Provide 10–15 evaluation photos or close stand-ins.

## Change log

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
