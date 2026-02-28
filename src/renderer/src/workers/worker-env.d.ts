/**
 * Minimal type declarations for DedicatedWorkerGlobalScope.
 *
 * We can't add "WebWorker" to tsconfig lib because it conflicts with "DOM".
 * Instead, we declare just the subset needed by our worker files.
 */

interface DedicatedWorkerGlobalScope {
  onmessage: ((event: MessageEvent) => void) | null
  postMessage(message: unknown, transfer: Transferable[]): void
  postMessage(message: unknown, options?: StructuredSerializeOptions): void
}
