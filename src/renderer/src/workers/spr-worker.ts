/**
 * Web Worker for SPR file reading/writing and batch sprite operations.
 *
 * Offloads the heavy parsing of large SPR files and batch sprite
 * decompression from the main thread.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  ReadSprPayload,
  WriteSprPayload,
  BatchDecompressPayload,
  BatchDecompressResult
} from './types'
import { readSpr } from '../services/spr/spr-reader'
import { writeSpr } from '../services/spr/spr-writer'
import { uncompressPixels } from '../services/spr/sprite-pixels'
import { SPR_WORKER_READ, SPR_WORKER_WRITE, SPR_WORKER_BATCH_DECOMPRESS } from './types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data

  try {
    switch (type) {
      case SPR_WORKER_READ: {
        const p = payload as ReadSprPayload
        const result = readSpr(p.buffer, p.extended)

        const response: WorkerResponse = {
          id,
          type,
          success: true,
          result
        }
        ctx.postMessage(response)
        break
      }

      case SPR_WORKER_WRITE: {
        const p = payload as WriteSprPayload
        const result = writeSpr(p.data, p.extended)

        const response: WorkerResponse = {
          id,
          type,
          success: true,
          result
        }
        // Transfer the ArrayBuffer back to the main thread (zero-copy)
        ctx.postMessage(response, [result])
        break
      }

      case SPR_WORKER_BATCH_DECOMPRESS: {
        const p = payload as BatchDecompressPayload
        const entries: Array<[number, Uint8Array]> = []

        for (const [spriteId, compressed] of p.entries) {
          const decompressed = uncompressPixels(compressed, p.transparent)
          entries.push([spriteId, decompressed])
        }

        const result: BatchDecompressResult = { entries }
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
          error: `Unknown SPR worker message type: ${type}`
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
