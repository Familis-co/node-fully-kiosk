import { useFullyCommand } from './use-fully-command.js';

/**
 * Shared pending and error state for a group of related device actions.
 */
export interface ActionGroupState {
  /** `true` while any action of the group is in flight. */
  isPending: boolean;
  /** The error of the most recent action, cleared when the next one starts. */
  error: Error | null;
  /** Clears the error state. */
  reset: () => void;
}

/**
 * Builds one pending/error state shared by several device actions.
 *
 * The group hooks in this package use it so a panel of buttons can share a
 * single busy indicator.
 *
 * @returns A runner for actions plus the shared state.
 */
export function useActionGroup(): ActionGroupState & {
  /**
   * Runs one action of the group.
   *
   * @param action - The async action to run.
   * @returns What the action resolved with, or `undefined` when it failed.
   */
  run: <T>(action: () => Promise<T>) => Promise<T | undefined>;
} {
  const command = useFullyCommand(<T>(action: () => Promise<T>) => action());

  return {
    run: command.run as <T>(action: () => Promise<T>) => Promise<T | undefined>,
    isPending: command.isPending,
    error: command.error,
    reset: command.reset,
  };
}
