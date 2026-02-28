/**
 * Binary stream utilities for reading/writing little-endian binary data.
 * Replaces AS3 FileStream + Endian.LITTLE_ENDIAN.
 */

// ---------------------------------------------------------------------------
// BinaryReader
// ---------------------------------------------------------------------------

export class BinaryReader {
  private view: DataView
  private _position: number

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer)
    this._position = 0
  }

  get position(): number {
    return this._position
  }

  set position(value: number) {
    this._position = value
  }

  get length(): number {
    return this.view.byteLength
  }

  get bytesAvailable(): number {
    return this.view.byteLength - this._position
  }

  readUint8(): number {
    const value = this.view.getUint8(this._position)
    this._position += 1
    return value
  }

  readInt8(): number {
    const value = this.view.getInt8(this._position)
    this._position += 1
    return value
  }

  readUint16(): number {
    const value = this.view.getUint16(this._position, true)
    this._position += 2
    return value
  }

  readInt16(): number {
    const value = this.view.getInt16(this._position, true)
    this._position += 2
    return value
  }

  readUint32(): number {
    const value = this.view.getUint32(this._position, true)
    this._position += 4
    return value
  }

  readInt32(): number {
    const value = this.view.getInt32(this._position, true)
    this._position += 4
    return value
  }

  readMultiByte(length: number, _charset: string): string {
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this._position, length)
    this._position += length
    // iso-8859-1 / latin1: each byte maps directly to its Unicode code point
    let result = ''
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(bytes[i])
    }
    return result
  }

  readBytes(length: number): Uint8Array {
    const result = new Uint8Array(length)
    result.set(new Uint8Array(this.view.buffer, this.view.byteOffset + this._position, length))
    this._position += length
    return result
  }

  readUTF(): string {
    const length = this.readUint16()
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this._position, length)
    this._position += length
    return new TextDecoder('utf-8').decode(bytes)
  }
}

// ---------------------------------------------------------------------------
// BinaryWriter
// ---------------------------------------------------------------------------

export class BinaryWriter {
  private buffer: ArrayBuffer
  private view: DataView
  private _position: number

  constructor(initialSize = 4096) {
    this.buffer = new ArrayBuffer(initialSize)
    this.view = new DataView(this.buffer)
    this._position = 0
  }

  get position(): number {
    return this._position
  }

  set position(value: number) {
    this._position = value
  }

  private ensureCapacity(additionalBytes: number): void {
    const needed = this._position + additionalBytes
    if (needed <= this.buffer.byteLength) return
    const newSize = Math.max(needed, this.buffer.byteLength * 2)
    const newBuffer = new ArrayBuffer(newSize)
    new Uint8Array(newBuffer).set(new Uint8Array(this.buffer))
    this.buffer = newBuffer
    this.view = new DataView(this.buffer)
  }

  writeUint8(value: number): void {
    this.ensureCapacity(1)
    this.view.setUint8(this._position, value)
    this._position += 1
  }

  writeInt8(value: number): void {
    this.ensureCapacity(1)
    this.view.setInt8(this._position, value)
    this._position += 1
  }

  writeUint16(value: number): void {
    this.ensureCapacity(2)
    this.view.setUint16(this._position, value, true)
    this._position += 2
  }

  writeInt16(value: number): void {
    this.ensureCapacity(2)
    this.view.setInt16(this._position, value, true)
    this._position += 2
  }

  writeUint32(value: number): void {
    this.ensureCapacity(4)
    this.view.setUint32(this._position, value, true)
    this._position += 4
  }

  writeInt32(value: number): void {
    this.ensureCapacity(4)
    this.view.setInt32(this._position, value, true)
    this._position += 4
  }

  writeMultiByte(str: string, _charset: string): void {
    // iso-8859-1 / latin1: each char code maps directly to a byte
    const length = str.length
    this.ensureCapacity(length)
    for (let i = 0; i < length; i++) {
      this.view.setUint8(this._position + i, str.charCodeAt(i) & 0xff)
    }
    this._position += length
  }

  writeBytes(data: Uint8Array): void {
    this.ensureCapacity(data.length)
    new Uint8Array(this.buffer, this._position, data.length).set(data)
    this._position += data.length
  }

  writeUTF(str: string): void {
    const encoded = new TextEncoder().encode(str)
    this.writeUint16(encoded.length)
    this.writeBytes(encoded)
  }

  toArrayBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this._position)
  }
}
