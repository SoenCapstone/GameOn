const tabs = new Set(["(home)", "(explore)", "(messages)", "(spaces)"]);

const fallback = "GameOn";

let title = fallback;

const subscribers = new Set<() => void>();

function formatTabTitle(segment: string) {
  const name = segment.slice(1, -1);
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : fallback;
}

export function getTabsTitle() {
  return title;
}

export function updateTabsTitle(segments: string[]) {
  const tab = segments.find((segment) => tabs.has(segment));
  if (!tab) return;
  const name = formatTabTitle(tab);
  if (name === title) return;
  title = name;
  queueMicrotask(() => {
    subscribers.forEach((notify) => notify());
  });
}

export function subscribeTabsTitle(onStoreChange: () => void) {
  subscribers.add(onStoreChange);
  return () => subscribers.delete(onStoreChange);
}
