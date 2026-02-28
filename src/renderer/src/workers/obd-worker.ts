/**
 * Web Worker for OBD encoding/decoding.
 *
 * Offloads LZMA compression/decompression from the main thread.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  EncodeObdPayload,
  DecodeObdPayload
} from './types'
import { encodeObd, decodeObd } from '../services/obd/obd-encoder'
import { OBD_WORKER_ENCODE, OBD_WORKER_DECODE } from './types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data

  try {
    switch (type) {
      case OBD_WORKER_ENCODE: {
        const p = payload as EncodeObdPayload
        const result = await encodeObd(p.data)

        const response: WorkerResponse = {
          id,
          type,
          success: true,
          result
        }
        // Transfer the ArrayBuffer back (zero-copy)
        ctx.postMessage(response, [result])
        break
      }

      case OBD_WORKER_DECODE: {
        const p = payload as DecodeObdPayload
        let defaultDurationFn: ((category: string) => number) | undefined
        if (p.defaultDurations) {
          defaultDurationFn = (category: string): number => {
            return p.defaultDurations![category] ?? 0
          }
        }
        const result = await decodeObd(p.buffer, defaultDurationFn)

        const response: WorkerResponse = {
          id,
          type,
          success: true,
          result
        }
        ctx.postMessage(response)
        break
      }

      default: {
        const response: WorkerResponse = {
          id,
          type,
          success: false,
          error: `Unknown OBD worker message type: ${type}`
        }
        ctx.postMessage(response)
      }
    }
  } catch (err) {
    const response: WorkerResponse = {
      id,
      type,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    }
    ctx.postMessage(response)
  }
}
