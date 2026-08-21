import type { FullyKioskTransport } from '../http.js';

/**
 * Shared base for the command groups exposed on {@link FullyKioskClient}.
 *
 * Each group is a thin, typed facade over a set of related Remote Admin
 * commands; the transport does the actual work.
 */
export abstract class CommandGroup {
  /**
   * @param transport - Transport used to execute the commands of this group.
   */
  constructor(protected readonly transport: FullyKioskTransport) {}
}
