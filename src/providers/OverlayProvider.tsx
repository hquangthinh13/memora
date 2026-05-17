import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type OverlayContextValue = {
  openOverlay: () => void;
  closeOverlay: () => void;
  hasActiveOverlay: boolean;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlayCount, setOverlayCount] = useState(0);

  const openOverlay = useCallback(() => {
    setOverlayCount((count) => count + 1);
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlayCount((count) => (count > 0 ? count - 1 : 0));
  }, []);

  const value = useMemo(
    () => ({
      openOverlay,
      closeOverlay,
      hasActiveOverlay: overlayCount > 0,
    }),
    [closeOverlay, openOverlay, overlayCount],
  );

  return (
    <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
  );
}

export function useOverlayState() {
  const context = useContext(OverlayContext);

  if (!context) {
    throw new Error("useOverlayState must be used within an OverlayProvider");
  }

  return context;
}
