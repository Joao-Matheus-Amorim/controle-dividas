"use client";

import { Toaster } from "sonner";

export function ToasterWrapper() {
  return (
    <Toaster
      position="bottom-center"
      closeButton
      duration={3000}
      toastOptions={{
        className: "border-border bg-card text-foreground shadow-ff-md",
      }}
    />
  );
}
