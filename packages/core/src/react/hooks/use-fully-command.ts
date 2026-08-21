import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State and trigger returned by {@link useFullyCommand}.
 *
 * @typeParam TArgs - Tuple of arguments the command takes.
 * @typeParam TResult - What the command resolves with.
 */
export interface UseFullyCommandResult<TArgs extends unknown[], TResult> {
  /** Runs the command. Rejections are captured in `error` rather than thrown. */
  run: (...args: TArgs) => Promise<TResult | undefined>;
  /** `true` while the command is in flight. */
  isPending: boolean;
  /** The error of the most recent run, cleared when a new run starts. */
  error: Error | null;
  /** The result of the most recent successful run. */
  data: TResult | undefined;
  /** Clears `error` and `data`. */
  reset: () => void;
}

/**
 * Wraps a one-shot device command with pending and error state, so a button can
 * render its own progress without a `try`/`catch` in the component.
 *
 * @typeParam TArgs - Tuple of arguments the command takes.
 * @typeParam TResult - What the command resolves with.
 * @param command - The async action to run.
 * @returns The trigger plus its state.
 *
 * @example
 * ```tsx
 * const client = useFullyKioskClient();
 * const speak = useFullyCommand((text: string) => client.speech.say(text));
 *
 * <button onClick={() => speak.run('Hello')} disabled={speak.isPending}>Speak</button>
 * ```
 */
export function useFullyCommand<TArgs extends unknown[], TResult>(
  command: (...args: TArgs) => Promise<TResult>,
): UseFullyCommandResult<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResult | undefined>(undefined);

  const commandRef = useRef(command);
  commandRef.current = command;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args: TArgs): Promise<TResult | undefined> => {
    setIsPending(true);
    setError(null);
    try {
      const result = await commandRef.current(...args);
      if (mountedRef.current) setData(result);
      return result;
    } catch (caught) {
      if (mountedRef.current) {
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      }
      return undefined;
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setData(undefined);
  }, []);

  return { run, isPending, error, data, reset };
}
