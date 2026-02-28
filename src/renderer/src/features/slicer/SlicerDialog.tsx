/**
 * Slicer dialog — standalone tool for slicing sprite sheets into individual sprites.
 * Ported from legacy AS3: slicer/Slicer.mxml + SlicerSettings.as
 *
 * Features:
 * - Import large images (PNG, BMP, JPG) via file dialog or drag-and-drop
 * - Configurable grid overlay (columns, rows, offset X/Y) based on sprite dimension
 * - Draggable grid on the canvas (click to center, drag to reposition)
 * - Crop/slice operation — extracts sprites from grid cells
 * - Remove magenta background (0xFF00FF -> transparent)
 * - Option to include/exclude empty sprites
 * - Subdivisions toggle for visual grid guides
 * - Rotate 90°/270°, Flip H/V of source image
 * - Zoom (0.1x-5.0x)
 * - Sprite dimension selector (32x32, 64x64, etc.)
 * - Sprites list with thumbnails and Import/Clear buttons
 * - Keyboard shortcuts: Arrow keys (move grid), Ctrl+O (open), Ctrl+/-/= (zoom)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  FieldGroup,
  NumberInputField,
  CheckboxField,
  SelectField
} from '../../components/Modal'
import {
  IconOpen,
  IconRotateRight,
  IconRotateLeft,
  IconFlipHorizontal,
  IconFlipVertical,
  IconCrop,
  IconImport,
  IconDelete
} from '../../components/Icons'
import { SPRITE_DIMENSIONS } from '../../data/sprite-dimensions'
import { useAppStore } from '../../stores'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SlicerDialogProps {
  open: boolean
  onClose: () => void
}

interface SlicedSprite {
  imageData: ImageData
  dataUrl: string
  index: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHECKERBOARD_LIGHT = '#636363'
const CHECKERBOARD_DARK = '#535353'
const CHECKERBOARD_SIZE = 8

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5.0
const ZOOM_STEP = 0.1

const MAX_COLUMNS = 20
const MAX_ROWS = 20

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number = CHECKERBOARD_SIZE
): void {
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      ctx.fillStyle =
        (x / tileSize + y / tileSize) % 2 === 0 ? CHECKERBOARD_LIGHT : CHECKERBOARD_DARK
      ctx.fillRect(x, y, tileSize, tileSize)
    }
  }
}

function imageDataToDataUrl(imageData: ImageData, size?: number): string {
  const canvas = document.createElement('canvas')
  if (size && (imageData.width !== size || imageData.height !== size)) {
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const tmp = document.createElement('canvas')
    tmp.width = imageData.width
    tmp.height = imageData.height
    tmp.getContext('2d')!.putImageData(imageData, 0, 0)
    const scale = Math.min(size / imageData.width, size / imageData.height)
    const dw = Math.round(imageData.width * scale)
    const dh = Math.round(imageData.height * scale)
    const dx = Math.round((size - dw) / 2)
    const dy = Math.round((size - dh) / 2)
    drawCheckerboard(ctx, size, size, 4)
    ctx.drawImage(tmp, dx, dy, dw, dh)
  } else {
    canvas.width = imageData.width
    canvas.height = imageData.height
    canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  }
  return canvas.toDataURL('image/png')
}

function rotateImageData90(imageData: ImageData, clockwise: boolean): ImageData {
  const { width, height, data } = imageData
  const result = new ImageData(height, width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      let dstX: number, dstY: number
      if (clockwise) {
        dstX = height - 1 - y
        dstY = x
      } else {
        dstX = y
        dstY = width - 1 - x
      }
      const dstIdx = (dstY * height + dstX) * 4
      result.data[dstIdx] = data[srcIdx]
      result.data[dstIdx + 1] = data[srcIdx + 1]
      result.data[dstIdx + 2] = data[srcIdx + 2]
      result.data[dstIdx + 3] = data[srcIdx + 3]
    }
  }
  return result
}

function flipImageDataH(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const result = new ImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      const dstIdx = (y * width + (width - 1 - x)) * 4
      result.data[dstIdx] = data[srcIdx]
      result.data[dstIdx + 1] = data[srcIdx + 1]
      result.data[dstIdx + 2] = data[srcIdx + 2]
      result.data[dstIdx + 3] = data[srcIdx + 3]
    }
  }
  return result
}

function flipImageDataV(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const result = new ImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      const dstIdx = ((height - 1 - y) * width + x) * 4
      result.data[dstIdx] = data[srcIdx]
      result.data[dstIdx + 1] = data[srcIdx + 1]
      result.data[dstIdx + 2] = data[srcIdx + 2]
      result.data[dstIdx + 3] = data[srcIdx + 3]
    }
  }
  return result
}

/** Remove magenta (0xFF00FF) pixels, replacing with transparent */
function removeMagenta(imageData: ImageData): void {
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 255) {
      d[i + 3] = 0
    }
  }
}

/** Check if an ImageData is entirely transparent */
function isEmptyImage(imageData: ImageData): boolean {
  const d = imageData.data
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] !== 0) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// SlicerToolbar
// ---------------------------------------------------------------------------

interface SlicerToolbarProps {
  hasImage: boolean
  onOpen: () => void
  onRotateRight: () => void
  onRotateLeft: () => void
  onFlipV: () => void
  onFlipH: () => void
}

function SlicerToolbar({
  hasImage,
  onOpen,
  onRotateRight,
  onRotateLeft,
  onFlipV,
  onFlipH
}: SlicerToolbarProps): React.JSX.Element {
  const { t } = useTranslation()
  const btnBase =
    'flex items-center justify-center h-7 px-2 rounded text-xs text-text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
  const btnStyle = `${btnBase} hover:bg-bg-tertiary`

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-bg-secondary px-2">
      <button
        className={`${btnStyle} gap-1`}
        onClick={onOpen}
        title={`${t('labels.open')} (Ctrl+O)`}
      >
        <IconOpen size={14} /> {t('labels.open')}
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        className={btnStyle}
        onClick={onRotateRight}
        disabled={!hasImage}
        title={t('labels.rotateRight90')}
      >
        <IconRotateRight size={14} />
      </button>
      <button
        className={btnStyle}
        onClick={onRotateLeft}
        disabled={!hasImage}
        title={t('labels.rotateLeft90')}
      >
        <IconRotateLeft size={14} />
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        className={btnStyle}
        onClick={onFlipV}
        disabled={!hasImage}
        title={t('labels.flipVertical')}
      >
        <IconFlipVertical size={14} />
      </button>
      <button
        className={btnStyle}
        onClick={onFlipH}
        disabled={!hasImage}
        title={t('labels.flipHorizontal')}
      >
        <IconFlipHorizontal size={14} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ImageCanvas with draggable grid overlay
// ---------------------------------------------------------------------------

interface ImageCanvasProps {
  imageData: ImageData | null
  zoom: number
  gridX: number
  gridY: number
  cellWidth: number
  cellHeight: number
  columns: number
  rows: number
  subdivisions: boolean
  onGridMove: (x: number, y: number) => void
  onDrop: (file: File) => void
}

function ImageCanvas({
  imageData,
  zoom,
  gridX,
  gridY,
  cellWidth,
  cellHeight,
  columns,
  rows,
  subdivisions,
  onGridMove,
  onDrop
}: ImageCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDraggingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  // Draw image and grid
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!imageData) {
      canvas.width = 400
      canvas.height = 300
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, 400, 300)
      ctx.fillStyle = '#888'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Drop an image file here or click Open', 200, 150)
      return
    }

    const w = imageData.width
    const h = imageData.height
    canvas.width = Math.round(w * zoom)
    canvas.height = Math.round(h * zoom)
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    // Checkerboard
    drawCheckerboard(
      ctx,
      canvas.width,
      canvas.height,
      Math.max(4, Math.round(CHECKERBOARD_SIZE * zoom))
    )

    // Image
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    tmp.getContext('2d')!.putImageData(imageData, 0, 0)
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)

    // Grid overlay (inverted blend mode for visibility)
    const gx = Math.round(gridX * zoom)
    const gy = Math.round(gridY * zoom)
    const cw = cellWidth * zoom
    const ch = cellHeight * zoom
    const totalW = columns * cw
    const totalH = rows * ch

    ctx.save()
    ctx.globalCompositeOperation = 'difference'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    // Outer border
    ctx.strokeRect(gx + 0.5, gy + 0.5, totalW - 1, totalH - 1)

    // Cell lines
    for (let r = 1; r < rows; r++) {
      const y = gy + r * ch
      ctx.beginPath()
      ctx.moveTo(gx, y)
      ctx.lineTo(gx + totalW, y)
      ctx.stroke()
    }
    for (let c = 1; c < columns; c++) {
      const x = gx + c * cw
      ctx.beginPath()
      ctx.moveTo(x, gy)
      ctx.lineTo(x, gy + totalH)
      ctx.stroke()
    }

    // Subdivisions (midpoint lines)
    if (subdivisions) {
      ctx.setLineDash([2, 2])
      ctx.globalAlpha = 0.5
      for (let r = 0; r < rows; r++) {
        const midY = gy + r * ch + ch / 2
        ctx.beginPath()
        ctx.moveTo(gx, midY)
        ctx.lineTo(gx + totalW, midY)
        ctx.stroke()
      }
      for (let c = 0; c < columns; c++) {
        const midX = gx + c * cw + cw / 2
        ctx.beginPath()
        ctx.moveTo(midX, gy)
        ctx.lineTo(midX, gy + totalH)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [imageData, zoom, gridX, gridY, cellWidth, cellHeight, columns, rows, subdivisions])

  // Mouse handlers for grid dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!imageData) return
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / zoom
      const my = (e.clientY - rect.top) / zoom

      const gw = cellWidth * columns
      const gh = cellHeight * rows

      // Check if click is inside grid
      if (mx >= gridX && mx <= gridX + gw && my >= gridY && my <= gridY + gh) {
        // Start dragging
        isDraggingRef.current = true
        dragOffsetRef.current = { x: mx - gridX, y: my - gridY }
        canvas.style.cursor = 'move'
      } else {
        // Click outside: center grid at click position
        const newX = Math.round(mx - gw / 2)
        const newY = Math.round(my - gh / 2)
        const maxX = imageData.width - gw
        const maxY = imageData.height - gh
        onGridMove(Math.max(0, Math.min(maxX, newX)), Math.max(0, Math.min(maxY, newY)))
      }
    },
    [imageData, zoom, gridX, gridY, cellWidth, cellHeight, columns, rows, onGridMove]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDraggingRef.current || !imageData) return
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / zoom
      const my = (e.clientY - rect.top) / zoom

      const gw = cellWidth * columns
      const gh = cellHeight * rows
      const maxX = imageData.width - gw
      const maxY = imageData.height - gh

      const newX = Math.round(mx - dragOffsetRef.current.x)
      const newY = Math.round(my - dragOffsetRef.current.y)

      onGridMove(Math.max(0, Math.min(maxX, newX)), Math.max(0, Math.min(maxY, newY)))
    },
    [imageData, zoom, cellWidth, cellHeight, columns, rows, onGridMove]
  )

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair'
    }
  }, [])

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDropEvent = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        onDrop(file)
      }
    },
    [onDrop]
  )

  return (
    <div
      className="flex-1 overflow-auto bg-bg-tertiary"
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
    >
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: 'pixelated',
          display: 'block',
          cursor: imageData ? 'crosshair' : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SpriteThumbnailList — right panel sprites list
// ---------------------------------------------------------------------------

interface SpriteThumbnailListProps {
  sprites: SlicedSprite[]
  selectedIndex: number
  onSelect: (index: number) => void
}

function SpriteThumbnailList({
  sprites,
  selectedIndex,
  onSelect
}: SpriteThumbnailListProps): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const el = listRef.current.children[selectedIndex] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (sprites.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-muted">
        No sprites
      </div>
    )
  }

  return (
    <div ref={listRef} className="h-full overflow-y-auto">
      {sprites.map((sprite, index) => (
        <div
          key={index}
          className={`flex cursor-pointer items-center gap-2 px-2 py-1 ${
            index === selectedIndex
              ? 'bg-accent text-white'
              : 'text-text-primary hover:bg-accent-subtle'
          }`}
          onClick={() => onSelect(index)}
        >
          <img
            src={sprite.dataUrl}
            alt={`Sprite ${index}`}
            width={32}
            height={32}
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
          />
          <span className="text-xs">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SlicerDialog — main component
// ---------------------------------------------------------------------------

export function SlicerDialog({ open, onClose }: SlicerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation()
  // Image state
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null)
  const [zoom, setZoom] = useState(1.0)

  // Grid state
  const [gridX, setGridX] = useState(0)
  const [gridY, setGridY] = useState(0)
  const [columns, setColumns] = useState(1)
  const [rows, setRows] = useState(1)
  const [subdivisions, setSubdivisions] = useState(false)
  const [includeEmpty, setIncludeEmpty] = useState(false)

  // Sprite dimension
  const [spriteDimIndex, setSpriteDimIndex] = useState(0)
  const cellSize = SPRITE_DIMENSIONS[spriteDimIndex]?.size ?? 32

  // Sliced sprites
  const [sprites, setSprites] = useState<SlicedSprite[]>([])
  const [selectedSpriteIndex, setSelectedSpriteIndex] = useState(-1)

  // Client info (for import availability)
  const clientInfo = useAppStore((s) => s.clientInfo)

  const hasImage = sourceImage !== null
  const hasSprites = sprites.length > 0

  // Max offset values based on image and grid
  const maxOffsetX = useMemo(() => {
    if (!sourceImage) return 0
    return Math.max(0, sourceImage.width - cellSize * columns)
  }, [sourceImage, cellSize, columns])

  const maxOffsetY = useMemo(() => {
    if (!sourceImage) return 0
    return Math.max(0, sourceImage.height - cellSize * rows)
  }, [sourceImage, cellSize, rows])

  // Sprite dimension options
  const dimensionOptions = useMemo(
    () => SPRITE_DIMENSIONS.map((d, i) => ({ value: String(i), label: d.value })),
    []
  )

  // Reset state when dialog opens (render-time state adjustment)
  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setSourceImage(null)
    setZoom(1.0)
    setGridX(0)
    setGridY(0)
    setColumns(1)
    setRows(1)
    setSubdivisions(false)
    setIncludeEmpty(false)
    setSprites([])
    setSelectedSpriteIndex(-1)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
  }

  // Clamp grid position when parameters change (render-time state adjustment)
  const [prevClampKey, setPrevClampKey] = useState('')
  const clampKey = sourceImage
    ? `${sourceImage.width}:${sourceImage.height}:${cellSize}:${columns}:${rows}`
    : ''
  if (clampKey && clampKey !== prevClampKey) {
    setPrevClampKey(clampKey)
    const maxX = Math.max(0, sourceImage!.width - cellSize * columns)
    const maxY = Math.max(0, sourceImage!.height - cellSize * rows)
    if (gridX > maxX) setGridX(maxX)
    if (gridY > maxY) setGridY(maxY)
  }
  if (!clampKey && prevClampKey) {
    setPrevClampKey('')
  }

  // -------------------------------------------------------------------------
  // Image loading
  // -------------------------------------------------------------------------

  const loadImageFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, img.width, img.height)
        setSourceImage(imgData)
        URL.revokeObjectURL(url)

        // Reset grid position and auto-fit columns/rows
        setGridX(0)
        setGridY(0)
        const dim = SPRITE_DIMENSIONS[spriteDimIndex]?.size ?? 32
        setColumns(Math.max(1, Math.min(MAX_COLUMNS, Math.floor(img.width / dim))))
        setRows(Math.max(1, Math.min(MAX_ROWS, Math.floor(img.height / dim))))
        setSprites([])
        setSelectedSpriteIndex(-1)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
      }

      img.src = url
    },
    [spriteDimIndex]
  )

  // -------------------------------------------------------------------------
  // Toolbar actions
  // -------------------------------------------------------------------------

  const handleOpen = useCallback(async () => {
    if (!window.api?.file) return

    const result = await window.api.file.showOpenDialog({
      title: 'Open Image',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const buffer = await window.api.file.readBinary(result.filePaths[0])
      const blob = new Blob([buffer])
      const file = new File([blob], result.filePaths[0].split('/').pop() ?? 'image')
      loadImageFile(file)
    }
  }, [loadImageFile])

  const handleRotateRight = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(rotateImageData90(sourceImage, true))
  }, [sourceImage])

  const handleRotateLeft = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(rotateImageData90(sourceImage, false))
  }, [sourceImage])

  const handleFlipV = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(flipImageDataV(sourceImage))
  }, [sourceImage])

  const handleFlipH = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(flipImageDataH(sourceImage))
  }, [sourceImage])

  // -------------------------------------------------------------------------
  // Grid movement
  // -------------------------------------------------------------------------

  const handleGridMove = useCallback((x: number, y: number) => {
    setGridX(Math.round(x))
    setGridY(Math.round(y))
  }, [])

  // -------------------------------------------------------------------------
  // Crop — slice image into sprites
  // -------------------------------------------------------------------------

  const handleCrop = useCallback(() => {
    if (!sourceImage) return

    const newSprites: SlicedSprite[] = []
    let idx = 0

    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = sourceImage.width
    tmpCanvas.height = sourceImage.height
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.putImageData(sourceImage, 0, 0)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const sx = gridX + c * cellSize
        const sy = gridY + r * cellSize
        const w = Math.min(cellSize, sourceImage.width - sx)
        const h = Math.min(cellSize, sourceImage.height - sy)

        if (w <= 0 || h <= 0) continue

        const cellData = tmpCtx.getImageData(sx, sy, w, h)

        // Create exact cellSize x cellSize frame
        const frameCanvas = document.createElement('canvas')
        frameCanvas.width = cellSize
        frameCanvas.height = cellSize
        const frameCtx = frameCanvas.getContext('2d')!
        frameCtx.putImageData(cellData, 0, 0)
        const frameData = frameCtx.getImageData(0, 0, cellSize, cellSize)

        // Remove magenta background
        removeMagenta(frameData)

        // Skip empty sprites unless includeEmpty is checked
        if (!includeEmpty && isEmptyImage(frameData)) continue

        newSprites.push({
          imageData: frameData,
          dataUrl: imageDataToDataUrl(frameData, 32),
          index: idx++
        })
      }
    }

    setSprites(newSprites)
    setSelectedSpriteIndex(newSprites.length > 0 ? 0 : -1)
  }, [sourceImage, gridX, gridY, columns, rows, cellSize, includeEmpty])

  // -------------------------------------------------------------------------
  // Import sprites to main application
  // -------------------------------------------------------------------------

  const handleImport = useCallback(() => {
    if (sprites.length === 0) return
    // TODO: Send sprites to main app via ImportSpritesCommand equivalent
    // For now, log the action
    const addLog = useAppStore.getState().addLog
    addLog('info', `Slicer: Imported ${sprites.length} sprites (${cellSize}x${cellSize})`)
  }, [sprites, cellSize])

  const handleClear = useCallback(() => {
    setSprites([])
    setSelectedSpriteIndex(-1)
  }, [])

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 'o') {
        e.preventDefault()
        handleOpen()
        return
      }

      // Zoom
      if (mod && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1)))
        return
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)))
        return
      }

      // Arrow keys — move grid by 1 pixel
      if (!sourceImage) return
      const gw = cellSize * columns
      const gh = cellSize * rows
      const mxX = Math.max(0, sourceImage.width - gw)
      const mxY = Math.max(0, sourceImage.height - gh)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setGridX((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setGridX((prev) => Math.min(mxX, prev + 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setGridY((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setGridY((prev) => Math.min(mxY, prev + 1))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleOpen, sourceImage, cellSize, columns, rows])

  // -------------------------------------------------------------------------
  // Image drop handler
  // -------------------------------------------------------------------------

  const handleImageDrop = useCallback(
    (file: File) => {
      loadImageFile(file)
    },
    [loadImageFile]
  )

  if (!open) return null

  return (
    <Modal
      title="Slicer"
      open={open}
      onClose={onClose}
      width={900}
      closeOnBackdrop={false}
      footer={<DialogButton label={t('labels.close')} onClick={onClose} />}
    >
      <div className="flex flex-col" style={{ height: 520 }}>
        {/* Toolbar */}
        <SlicerToolbar
          hasImage={hasImage}
          onOpen={handleOpen}
          onRotateRight={handleRotateRight}
          onRotateLeft={handleRotateLeft}
          onFlipV={handleFlipV}
          onFlipH={handleFlipH}
        />

        {/* Main content: Left controls + Center canvas + Right sprites */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — Controls */}
          <div className="flex w-[150px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-bg-primary p-2">
            {/* Sprite Dimension */}
            <FieldGroup label={t('labels.spriteDimension')}>
              <SelectField
                label="Size"
                value={String(spriteDimIndex)}
                onChange={(v) => {
                  setSpriteDimIndex(Number(v))
                  setSprites([])
                  setSelectedSpriteIndex(-1)
                }}
                options={dimensionOptions}
              />
            </FieldGroup>

            {/* Cells config */}
            <FieldGroup label={t('labels.cells')}>
              <div className="flex flex-col gap-1.5">
                <CheckboxField
                  label="Subdivisions"
                  checked={subdivisions}
                  onChange={setSubdivisions}
                />
                <CheckboxField
                  label="Empty sprites"
                  checked={includeEmpty}
                  onChange={setIncludeEmpty}
                />
                <NumberInputField
                  label="X"
                  value={gridX}
                  onChange={(v) => setGridX(Math.max(0, Math.min(maxOffsetX, v)))}
                  min={0}
                  max={maxOffsetX}
                  disabled={!hasImage}
                />
                <NumberInputField
                  label="Y"
                  value={gridY}
                  onChange={(v) => setGridY(Math.max(0, Math.min(maxOffsetY, v)))}
                  min={0}
                  max={maxOffsetY}
                  disabled={!hasImage}
                />
                <NumberInputField
                  label={t('labels.columns')}
                  value={columns}
                  onChange={(v) => setColumns(Math.max(1, Math.min(MAX_COLUMNS, v)))}
                  min={1}
                  max={MAX_COLUMNS}
                  disabled={!hasImage}
                />
                <NumberInputField
                  label={t('labels.rows')}
                  value={rows}
                  onChange={(v) => setRows(Math.max(1, Math.min(MAX_ROWS, v)))}
                  min={1}
                  max={MAX_ROWS}
                  disabled={!hasImage}
                />
              </div>
            </FieldGroup>

            {/* Zoom */}
            <FieldGroup label={t('labels.zoom')}>
              <div className="flex items-center gap-1">
                <input
                  type="range"
                  className="flex-1 accent-accent"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <span className="w-9 text-right text-[10px] text-text-secondary">
                  {zoom.toFixed(1)}x
                </span>
              </div>
            </FieldGroup>

            {/* Crop button */}
            <button
              className="flex w-full items-center justify-center gap-1 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleCrop}
              disabled={!hasImage}
            >
              <IconCrop size={14} /> {t('labels.crop')}
            </button>
          </div>

          {/* Center panel — Image canvas */}
          <ImageCanvas
            imageData={sourceImage}
            zoom={zoom}
            gridX={gridX}
            gridY={gridY}
            cellWidth={cellSize}
            cellHeight={cellSize}
            columns={columns}
            rows={rows}
            subdivisions={subdivisions}
            onGridMove={handleGridMove}
            onDrop={handleImageDrop}
          />

          {/* Right panel — Sprites list */}
          <div className="flex w-[150px] shrink-0 flex-col border-l border-border bg-bg-primary">
            <div className="border-b border-border px-2 py-1 text-xs font-semibold text-text-secondary">
              {t('labels.sprites')} ({sprites.length})
            </div>
            <div className="flex-1 overflow-hidden">
              <SpriteThumbnailList
                sprites={sprites}
                selectedIndex={selectedSpriteIndex}
                onSelect={setSelectedSpriteIndex}
              />
            </div>
            <div className="flex items-center gap-1 border-t border-border p-1">
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded bg-accent px-2 py-1 text-xs text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleImport}
                disabled={!hasSprites || !clientInfo?.loaded}
                title={!clientInfo?.loaded ? 'Load a project first' : 'Import sprites to project'}
              >
                <IconImport size={12} /> {t('labels.import')}
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-1 rounded bg-bg-tertiary px-2 py-1 text-xs text-text-primary transition-colors hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleClear}
                disabled={!hasSprites}
              >
                <IconDelete size={12} /> {t('labels.clear')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
