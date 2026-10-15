type Action = 'edit' | 'delete' | 'replace';
interface Confirmation { action: Action; item: string; resolve: (confirmed: boolean) => void }
const queue: Confirmation[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function confirmAction(action: Action, item: string): Promise<boolean> {
  return new Promise((resolve) => { queue.push({ action, item, resolve }); notify(); });
}
export const getConfirmation = () => queue[0] || null;
export const subscribeConfirmation = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function resolveConfirmation(confirmed: boolean) {
  const pending = queue.shift();
  pending?.resolve(confirmed);
  notify();
}
