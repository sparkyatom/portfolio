import "@testing-library/jest-dom/vitest";
class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
(globalThis as any).IntersectionObserver = IO; window.scrollTo = (() => {}) as any;
import { afterEach } from "vitest"; import { cleanup } from "@testing-library/react";
afterEach(() => cleanup());
