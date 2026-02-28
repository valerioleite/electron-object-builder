/**
 * Collection of ServerItems with OTB version metadata.
 * Provides lookup by both Server ID and Client ID.
 *
 * Ported from legacy AS3: otlib/items/ServerItemList.as
 */

import { type ServerItem, createServerItem } from '../../types'

export class ServerItemList {
  majorVersion = 0
  minorVersion = 0
  buildNumber = 0
  clientVersion = 0

  private _items = new Map<number, ServerItem>()
  private _itemsByClientId = new Map<number, ServerItem[]>()
  private _minId = Number.MAX_SAFE_INTEGER
  private _maxId = 0

  get count(): number {
    return this._items.size
  }

  get minId(): number {
    return this._minId === Number.MAX_SAFE_INTEGER ? 100 : this._minId
  }

  get maxId(): number {
    return this._maxId === 0 ? 100 : this._maxId
  }

  add(item: ServerItem): void {
    this._items.set(item.id, item)

    // Track by client ID
    const existing = this._itemsByClientId.get(item.clientId)
    if (existing) {
      existing.push(item)
    } else {
      this._itemsByClientId.set(item.clientId, [item])
    }

    // Update min/max
    if (item.id < this._minId) this._minId = item.id
    if (item.id > this._maxId) this._maxId = item.id
  }

  getItemById(serverId: number): ServerItem | undefined {
    return this._items.get(serverId)
  }

  getByServerId(serverId: number): ServerItem | undefined {
    return this.getItemById(serverId)
  }

  getItemsByClientId(clientId: number): ServerItem[] {
    return this._itemsByClientId.get(clientId) ?? []
  }

  getFirstItemByClientId(clientId: number): ServerItem | undefined {
    const items = this.getItemsByClientId(clientId)
    return items.length > 0 ? items[0] : undefined
  }

  hasItem(serverId: number): boolean {
    return this._items.has(serverId)
  }

  hasClientId(clientId: number): boolean {
    return this._itemsByClientId.has(clientId)
  }

  toArray(): ServerItem[] {
    const result = Array.from(this._items.values())
    result.sort((a, b) => a.id - b.id)
    return result
  }

  clear(): void {
    this._items.clear()
    this._itemsByClientId.clear()
    this._minId = Number.MAX_SAFE_INTEGER
    this._maxId = 0
  }

  removeItem(serverId: number): boolean {
    const item = this._items.get(serverId)
    if (!item) return false

    this._items.delete(serverId)

    // Remove from client ID lookup
    const clientItems = this._itemsByClientId.get(item.clientId)
    if (clientItems) {
      const idx = clientItems.indexOf(item)
      if (idx >= 0) clientItems.splice(idx, 1)
      if (clientItems.length === 0) {
        this._itemsByClientId.delete(item.clientId)
      }
    }

    // Recalculate min/max if necessary
    if (serverId === this._minId || serverId === this._maxId) {
      this._minId = Number.MAX_SAFE_INTEGER
      this._maxId = 0
      for (const id of this._items.keys()) {
        if (id < this._minId) this._minId = id
        if (id > this._maxId) this._maxId = id
      }
    }

    return true
  }

  /**
   * Creates missing items for Client IDs that don't have server items.
   * Used to sync OTB with dat when dat has more items.
   * @returns Number of items created
   */
  createMissingItems(maxClientId: number): number {
    let lastClientId = 0
    for (const item of this._items.values()) {
      if (item.clientId > lastClientId) lastClientId = item.clientId
    }

    let created = 0
    if (lastClientId < maxClientId) {
      for (let cid = lastClientId + 1; cid <= maxClientId; cid++) {
        const newItem = createServerItem()
        newItem.id = this._maxId + 1
        newItem.clientId = cid
        newItem.spriteHash = new Uint8Array(16)
        this.add(newItem)
        created++
      }
    }

    return created
  }

  getMaxClientId(): number {
    let maxCid = 0
    for (const item of this._items.values()) {
      if (item.clientId > maxCid) maxCid = item.clientId
    }
    return maxCid
  }
}
