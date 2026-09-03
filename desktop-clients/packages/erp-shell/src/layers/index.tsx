"use client";

import React from "react";
import { CommandPalette } from "./command-palette";
import { ToastViewport } from "./toast-viewport";
import { HelpAssistant } from "./help-assistant";
export { TOUR_REVEAL_EVENT } from "./help-assistant";
import { DocumentationDrawer } from "./documentation-drawer";

/** Every always-mounted overlay, in the order EnterpriseApp mounted them. */
export function GlobalLayers() {
  return (
    <>
      <CommandPalette />
      <ToastViewport />
      <HelpAssistant />
      <DocumentationDrawer />
    </>
  );
}

export { CommandPalette, ToastViewport, HelpAssistant, DocumentationDrawer };
