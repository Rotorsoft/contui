declare module "ink-testing-library" {
  import type { ReactElement } from "react";

  export interface RenderResult {
    lastFrame: () => string | undefined;
    rerender: (element: ReactElement) => void;
    unmount: () => void;
  }

  export function render(element: ReactElement): RenderResult;
}
