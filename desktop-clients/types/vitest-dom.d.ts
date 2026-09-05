/**
 * Teaches TypeScript the jest-dom matchers.
 *
 * The tests RAN without this — vitest transpiles and does not typecheck — while
 * `tsc -p packages/ops-ui` went red on every `toBeVisible`. A suite that passes
 * while the package it lives in fails to typecheck is the "expected red" state
 * that teaches people to ignore red, and it is the same defect verify:parity was
 * repaired for. Importing the vitest entry performs the module augmentation.
 */
import "@testing-library/jest-dom/vitest";
