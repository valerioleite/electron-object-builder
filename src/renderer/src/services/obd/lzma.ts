/**
 * LZMA compression/decompression wrapper.
 * Uses the `lzma` npm package (LZMA-JS by Nathan Rugg).
 *
 * The OBD format compresses the entire file content with LZMA.
 *
 * Note: The `lzma` package's main entry uses `require("path")` and `__dirname`
 * which are not available in the Electron renderer (browser context).
 * We import the self-contained worker source via Vite's `?raw` import
 * and evaluate it to extract the LZMA object.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import of LZMA worker JS source (no type definitions)
import lzmaWorkerSource from 'lzma/src/lzma_worker-min.js?raw'

// Execute the worker source in a fresh scope to extract the LZMA local variable.
// The source defines `var LZMA=(function(){...})()` as a local variable.
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const lzmaLib = new Function(lzmaWorkerSource + ';\nreturn LZMA;')() as {
  compress(
    input: number[] | string,
    mode: number,
    on_finish: (result: number[], error?: string) => void,
    on_progress?: (percent: number) => void
  ): void
  decompress(
    input: number[],
    on_finish: (result: number[] | string, error?: string) => void,
    on_progress?: (percent: number) => void
  ): void
}

/**
 * Compress data using LZMA algorithm.
 * @param data - Raw bytes to compress
 * @param level - Compression level (1-9, default 1 for fastest)
 * @returns Compressed bytes in standard LZMA format
 */
export function lzmaCompress(data: Uint8Array, level = 1): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      lzmaLib.compress(Array.from(data), level, (result, error) => {
        if (error) reject(new Error(String(error)))
        else resolve(new Uint8Array(result.map((b) => b & 0xff)))
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Decompress LZMA-compressed data.
 * @param data - LZMA-compressed bytes
 * @returns Decompressed raw bytes
 */
export function lzmaDecompress(data: Uint8Array): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      lzmaLib.decompress(Array.from(data), (result, error) => {
        if (error) reject(new Error(String(error)))
        else if (result === null || result === undefined)
          reject(new Error('LZMA decompression returned null'))
        else if (typeof result === 'string') {
          // Text data returned as string - convert to bytes
          const bytes = new Uint8Array(result.length)
          for (let i = 0; i < result.length; i++) {
            bytes[i] = result.charCodeAt(i) & 0xff
          }
          resolve(bytes)
        } else {
          // Signed byte array - convert to unsigned
          resolve(new Uint8Array(result.map((b) => b & 0xff)))
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
