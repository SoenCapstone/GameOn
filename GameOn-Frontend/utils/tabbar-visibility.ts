type Listener = (hidden: boolean) => void;

let hidden = false;
const listeners = new Set<Listener>();

// base overlay height in pixels (covers typical tab bar) — safe area is added by callers
export const BASE_OVERLAY_HEIGHT = 90;

export function getOverlayHeight(safeAreaInsetBottom = 0) {
  return BASE_OVERLAY_HEIGHT + Math.max(0, safeAreaInsetBottom);
}

export function setTabBarHidden(value: boolean) {
  hidden = value;
  for (const l of Array.from(listeners)) l(hidden);
}

export function isTabBarHidden() {
  return hidden;
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
