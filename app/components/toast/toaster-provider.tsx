"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      toastOptions={{
        duration: 2600,
      }}
    />
  );
}
