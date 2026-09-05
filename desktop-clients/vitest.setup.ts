import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/* Without this a component from one test is still mounted during the next, and
   getByText finds the previous test's element — a false pass that looks like a
   working test. */
afterEach(cleanup);
