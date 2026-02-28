/**
 * Animation Editor dialog — a standalone sprite animation authoring tool.
 * Ported from legacy AS3: com/mignari/animator/AnimationEditor.mxml
 *
 * Features:
 * - Load images (PNG, BMP, JPG, GIF) or OBD files
 * - Display on canvas with checkerboard background and grid overlay
 * - Configure grid (columns, rows, cell width/height, offset)
 * - Crop image into animation frames
 * - Frame timeline with thumbnails, reorder, duplicate, delete
 * - Playback controls (first/prev/play-pause/next/last)
 * - Animated preview via canvas
 * - Image manipulation (rotate 90°, flip H/V)
 * - Save/export as OBD
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  DialogButton,
  FieldGroup,
  NumberInputField,
  SelectField
} from '../../components/Modal'
import {
  IconOpen,
  IconSave,
  IconPaste,
  IconRotateRight,
  IconRotateLeft,
  IconFlipHorizontal,
  IconFlipVertical,
  IconFirst,
  IconPrevious,
  IconPlay,
  IconPause,
  IconNext,
  IconLast,
  IconDuplicateFrames,
  IconDelete,
  IconCrop
} from '../../components/Icons'
import { ThingCategory, type ThingCategory as ThingCategoryType } from '../../types/things'
import { createFrameDuration, type FrameDuration } from '../../types/animation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnimationFrame {
  /** Frame image as ImageData (RGBA) */
  imageData: ImageData
  /** Rendered data URL for thumbnail */
  dataUrl: string
  /** Optional duration (from GIF import) */
  duration: FrameDuration | null
}

interface GridSettings {
  cellWidth: number
  cellHeight: number
  columns: number
  rows: number
  offsetX: number
  offsetY: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_KEYS = [
  { value: ThingCategory.ITEM, labelKey: 'labels.item' },
  { value: ThingCategory.OUTFIT, labelKey: 'labels.outfit' },
  { value: ThingCategory.EFFECT, labelKey: 'labels.effect' },
  { value: ThingCategory.MISSILE, labelKey: 'labels.missile' }
]

const DEFAULT_GRID: GridSettings = {
  cellWidth: 32,
  cellHeight: 32,
  columns: 1,
  rows: 1,
  offsetX: 0,
  offsetY: 0
}

const CHECKERBOARD_LIGHT = '#555555'
const CHECKERBOARD_DARK = '#444444'
const CHECKERBOARD_SIZE = 8

const FRAME_THUMB_SIZE = 50
const FRAME_STRIP_HEIGHT = 130

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

function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
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
// AnimationEditorToolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  hasImage: boolean
  hasFrames: boolean
  onOpen: () => void
  onSave: () => void
  onPaste: () => void
  onRotateRight: () => void
  onRotateLeft: () => void
  onFlipH: () => void
  onFlipV: () => void
}

function AnimationEditorToolbar({
  hasImage,
  hasFrames,
  onOpen,
  onSave,
  onPaste,
  onRotateRight,
  onRotateLeft,
  onFlipH,
  onFlipV
}: ToolbarProps): React.JSX.Element {
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
      <button
        className={`${btnStyle} gap-1`}
        onClick={onSave}
        disabled={!hasFrames}
        title={`${t('labels.save')} (Ctrl+S)`}
      >
        <IconSave size={14} /> {t('labels.save')}
      </button>
      <div className="mx-1 h-4 w-px bg-border" />
      <button
        className={`${btnStyle} gap-1`}
        onClick={onPaste}
        title={`${t('labels.paste')} (Ctrl+V)`}
      >
        <IconPaste size={14} /> {t('labels.paste')}
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
        onClick={onFlipH}
        disabled={!hasImage}
        title={t('labels.flipHorizontal')}
      >
        <IconFlipHorizontal size={14} />
      </button>
      <button
        className={btnStyle}
        onClick={onFlipV}
        disabled={!hasImage}
        title={t('labels.flipVertical')}
      >
        <IconFlipVertical size={14} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ImageCanvas — displays loaded image with checkerboard and grid overlay
// ---------------------------------------------------------------------------

interface ImageCanvasProps {
  imageData: ImageData | null
  grid: GridSettings
  zoom: number
  onDrop: (file: File) => void
}

function ImageCanvas({ imageData, grid, zoom, onDrop }: ImageCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Draw image and grid overlay
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (!imageData) {
      canvas.width = 300
      canvas.height = 200
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, 300, 200)
      ctx.fillStyle = '#888'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Drop an image file here or click Open', 150, 100)
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

    // Grid overlay
    const { cellWidth, cellHeight, columns, rows, offsetX, offsetY } = grid
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])

    const ox = offsetX * zoom
    const oy = offsetY * zoom
    const cw = cellWidth * zoom
    const ch = cellHeight * zoom

    for (let r = 0; r <= rows; r++) {
      const y = oy + r * ch
      ctx.beginPath()
      ctx.moveTo(ox, y)
      ctx.lineTo(ox + columns * cw, y)
      ctx.stroke()
    }

    for (let c = 0; c <= columns; c++) {
      const x = ox + c * cw
      ctx.beginPath()
      ctx.moveTo(x, oy)
      ctx.lineTo(x, oy + rows * ch)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // Grid bounding box highlight
    ctx.strokeStyle = 'rgba(0, 220, 100, 0.7)'
    ctx.lineWidth = 2
    ctx.strokeRect(ox, oy, columns * cw, rows * ch)
  }, [imageData, grid, zoom])

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) onDrop(file)
    },
    [onDrop]
  )

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-bg-primary"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// FrameTimeline — horizontal scrolling frame strip
// ---------------------------------------------------------------------------

interface FrameTimelineProps {
  frames: AnimationFrame[]
  selectedIndices: Set<number>
  onSelect: (index: number, multi: boolean) => void
  playbackFrame: number
}

function FrameTimeline({
  frames,
  selectedIndices,
  onSelect,
  playbackFrame
}: FrameTimelineProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to keep the playback frame visible
  useEffect(() => {
    if (scrollRef.current && frames.length > 0) {
      const container = scrollRef.current
      const itemWidth = FRAME_THUMB_SIZE + 16 // thumbnail + padding
      const scrollTarget = playbackFrame * itemWidth
      const { scrollLeft, clientWidth } = container
      if (scrollTarget < scrollLeft || scrollTarget > scrollLeft + clientWidth - itemWidth) {
        container.scrollTo({
          left: Math.max(0, scrollTarget - clientWidth / 2),
          behavior: 'smooth'
        })
      }
    }
  }, [playbackFrame, frames.length])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault()
      if (!selectedIndices.has(index)) {
        onSelect(index, false)
      }
    },
    [selectedIndices, onSelect]
  )

  if (frames.length === 0) {
    return (
      <div
        className="flex items-center justify-center border-t border-border bg-bg-secondary text-xs text-text-secondary"
        style={{ height: FRAME_STRIP_HEIGHT }}
      >
        No frames — load an image and crop to create frames
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto border-t border-border bg-bg-secondary p-2"
      style={{ height: FRAME_STRIP_HEIGHT, minHeight: FRAME_STRIP_HEIGHT }}
    >
      {frames.map((frame, i) => {
        const isSelected = selectedIndices.has(i)
        const isPlayback = playbackFrame === i

        return (
          <div
            key={i}
            className={`flex shrink-0 cursor-pointer flex-col items-center rounded p-1 transition-colors ${
              isSelected
                ? 'bg-accent/30 ring-1 ring-accent'
                : isPlayback
                  ? 'bg-accent-subtle'
                  : 'hover:bg-bg-tertiary'
            }`}
            onClick={(e) => onSelect(i, e.ctrlKey || e.metaKey)}
            onContextMenu={(e) => handleContextMenu(e, i)}
          >
            <div className="relative rounded border border-border bg-bg-primary">
              <img
                src={frame.dataUrl}
                alt={`Frame ${i}`}
                width={FRAME_THUMB_SIZE}
                height={FRAME_THUMB_SIZE}
                style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                draggable={false}
              />
            </div>
            <span className="mt-0.5 text-[10px] text-text-secondary">{i + 1}</span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PlaybackControls
// ---------------------------------------------------------------------------

interface PlaybackControlsProps {
  hasFrames: boolean
  isPlaying: boolean
  onFirstFrame: () => void
  onPrevFrame: () => void
  onTogglePlay: () => void
  onNextFrame: () => void
  onLastFrame: () => void
  onDuplicate: () => void
  onDelete: () => void
  canDuplicate: boolean
  canDelete: boolean
}

function PlaybackControls({
  hasFrames,
  isPlaying,
  onFirstFrame,
  onPrevFrame,
  onTogglePlay,
  onNextFrame,
  onLastFrame,
  onDuplicate,
  onDelete,
  canDuplicate,
  canDelete
}: PlaybackControlsProps): React.JSX.Element {
  const { t } = useTranslation()
  const btnBase =
    'flex items-center justify-center h-6 w-7 rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
  const btn = `${btnBase} text-text-primary hover:bg-bg-tertiary`

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 border-t border-border bg-bg-secondary px-2">
      <button
        className={btn}
        onClick={onFirstFrame}
        disabled={!hasFrames}
        title={t('labels.firstFrame')}
      >
        <IconFirst size={14} />
      </button>
      <button
        className={btn}
        onClick={onPrevFrame}
        disabled={!hasFrames}
        title={t('labels.previousFrame')}
      >
        <IconPrevious size={14} />
      </button>
      <button
        className={`${btn} ${isPlaying ? 'bg-accent/30' : ''}`}
        onClick={onTogglePlay}
        disabled={!hasFrames}
        title={isPlaying ? t('labels.pause') : t('labels.play')}
      >
        {isPlaying ? <IconPause size={14} /> : <IconPlay size={14} />}
      </button>
      <button
        className={btn}
        onClick={onNextFrame}
        disabled={!hasFrames}
        title={t('labels.nextFrame')}
      >
        <IconNext size={14} />
      </button>
      <button
        className={btn}
        onClick={onLastFrame}
        disabled={!hasFrames}
        title={t('labels.lastFrame')}
      >
        <IconLast size={14} />
      </button>

      <div className="mx-2 h-4 w-px bg-border" />

      <button
        className={btn}
        onClick={onDuplicate}
        disabled={!canDuplicate}
        title={t('labels.duplicateFrame')}
      >
        <IconDuplicateFrames size={14} />
      </button>
      <button
        className={btn}
        onClick={onDelete}
        disabled={!canDelete}
        title={t('labels.deleteFrame')}
      >
        <IconDelete size={14} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AnimationPreview — animated preview canvas
// ---------------------------------------------------------------------------

interface AnimationPreviewProps {
  frames: AnimationFrame[]
  currentFrame: number
  cellWidth: number
  cellHeight: number
}

function AnimationPreview({
  frames,
  currentFrame,
  cellWidth,
  cellHeight
}: AnimationPreviewProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const displaySize = 96

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = displaySize
    canvas.height = displaySize
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    // Checkerboard
    drawCheckerboard(ctx, displaySize, displaySize, 6)

    if (frames.length === 0 || currentFrame >= frames.length) return

    const frame = frames[currentFrame]
    const { imageData } = frame

    // Scale to fit
    const scale = Math.min(displaySize / imageData.width, displaySize / imageData.height)
    const dw = Math.round(imageData.width * scale)
    const dh = Math.round(imageData.height * scale)
    const dx = Math.round((displaySize - dw) / 2)
    const dy = Math.round((displaySize - dh) / 2)

    const tmp = document.createElement('canvas')
    tmp.width = imageData.width
    tmp.height = imageData.height
    tmp.getContext('2d')!.putImageData(imageData, 0, 0)

    ctx.drawImage(tmp, dx, dy, dw, dh)
  }, [frames, currentFrame, cellWidth, cellHeight])

  return (
    <canvas
      ref={canvasRef}
      width={displaySize}
      height={displaySize}
      className="rounded border border-border"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

// ---------------------------------------------------------------------------
// PropertiesPanel — left side controls
// ---------------------------------------------------------------------------

interface PropertiesPanelProps {
  category: ThingCategoryType
  onCategoryChange: (cat: ThingCategoryType) => void
  grid: GridSettings
  onGridChange: (grid: GridSettings) => void
  zoom: number
  onZoomChange: (z: number) => void
  onCrop: () => void
  hasImage: boolean
  frames: AnimationFrame[]
  currentFrame: number
}

function PropertiesPanel({
  category,
  onCategoryChange,
  grid,
  onGridChange,
  zoom,
  onZoomChange,
  onCrop,
  hasImage,
  frames,
  currentFrame
}: PropertiesPanelProps): React.JSX.Element {
  const { t } = useTranslation()
  const updateGrid = useCallback(
    (partial: Partial<GridSettings>) => {
      onGridChange({ ...grid, ...partial })
    },
    [grid, onGridChange]
  )

  const categoryOptions = CATEGORY_KEYS.map((c) => ({ value: c.value, label: t(c.labelKey) }))

  return (
    <div className="flex w-[230px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-border bg-bg-primary p-2">
      {/* Preview */}
      <FieldGroup label={t('labels.preview')}>
        <div className="flex justify-center">
          <AnimationPreview
            frames={frames}
            currentFrame={currentFrame}
            cellWidth={grid.cellWidth}
            cellHeight={grid.cellHeight}
          />
        </div>
      </FieldGroup>

      {/* Properties */}
      <FieldGroup label={t('labels.properties')}>
        <div className="flex flex-col gap-1.5">
          <SelectField
            label={t('labels.category')}
            value={category}
            onChange={(v) => onCategoryChange(v as ThingCategoryType)}
            options={categoryOptions}
          />
          <NumberInputField
            label="X Offset"
            value={grid.offsetX}
            onChange={(v) => updateGrid({ offsetX: Math.max(0, v) })}
            min={0}
            max={608}
          />
          <NumberInputField
            label="Y Offset"
            value={grid.offsetY}
            onChange={(v) => updateGrid({ offsetY: Math.max(0, v) })}
            min={0}
            max={608}
          />
          <NumberInputField
            label="Width"
            value={grid.cellWidth}
            onChange={(v) => updateGrid({ cellWidth: Math.max(32, Math.round(v / 32) * 32) })}
            min={32}
            max={1024}
            step={32}
          />
          <NumberInputField
            label="Height"
            value={grid.cellHeight}
            onChange={(v) => updateGrid({ cellHeight: Math.max(32, Math.round(v / 32) * 32) })}
            min={32}
            max={1024}
            step={32}
          />
          <NumberInputField
            label={t('labels.columns')}
            value={grid.columns}
            onChange={(v) => updateGrid({ columns: Math.max(1, Math.min(20, v)) })}
            min={1}
            max={20}
          />
          <NumberInputField
            label={t('labels.rows')}
            value={grid.rows}
            onChange={(v) => updateGrid({ rows: Math.max(1, Math.min(20, v)) })}
            min={1}
            max={20}
          />
        </div>
      </FieldGroup>

      {/* Zoom */}
      <FieldGroup label={t('labels.zoom')}>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="flex-1 accent-accent"
            min={0.5}
            max={5}
            step={0.1}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
          />
          <span className="w-10 text-right text-xs text-text-secondary">{zoom.toFixed(1)}x</span>
        </div>
      </FieldGroup>

      {/* Crop button */}
      <button
        className="flex w-full items-center justify-center gap-1 rounded bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onCrop}
        disabled={!hasImage}
      >
        <IconCrop size={14} /> {t('labels.crop')}
      </button>

      {/* Frame info */}
      {frames.length > 0 && (
        <div className="text-center text-xs text-text-secondary">
          Frame {currentFrame + 1} / {frames.length}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AnimationEditorDialog — main component
// ---------------------------------------------------------------------------

export interface AnimationEditorDialogProps {
  open: boolean
  onClose: () => void
}

export function AnimationEditorDialog({
  open,
  onClose
}: AnimationEditorDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  // Image state
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null)
  const [category, setCategory] = useState<ThingCategoryType>(ThingCategory.ITEM)
  const [grid, setGrid] = useState<GridSettings>({ ...DEFAULT_GRID })
  const [zoom, setZoom] = useState(1)

  // Frames
  const [frames, setFrames] = useState<AnimationFrame[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  // Playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const remainingRef = useRef<number>(0)

  const hasImage = sourceImage !== null
  const hasFrames = frames.length > 0
  const hasSelection = selectedIndices.size > 0

  // Reset state when dialog opens (render-time state adjustment)
  const [prevOpen, setPrevOpen] = useState(false)
  if (open && !prevOpen) {
    setSourceImage(null)
    setCategory(ThingCategory.ITEM)
    setGrid({ ...DEFAULT_GRID })
    setZoom(1)
    setFrames([])
    setSelectedIndices(new Set())
    setIsPlaying(false)
    setCurrentFrame(0)
  }
  if (open !== prevOpen) {
    setPrevOpen(open)
  }

  // -------------------------------------------------------------------------
  // Image loading
  // -------------------------------------------------------------------------

  const loadImageFile = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    const url = URL.createObjectURL(blob)
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

      // Auto-detect grid: try to fit cells
      const cellW = 32
      const cellH = 32
      const cols = Math.max(1, Math.floor(img.width / cellW))
      const rows = Math.max(1, Math.floor(img.height / cellH))
      setGrid((prev) => ({
        ...prev,
        columns: Math.min(cols, 20),
        rows: Math.min(rows, 20),
        offsetX: 0,
        offsetY: 0
      }))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
    }

    img.src = url
  }, [])

  const loadImageFromPath = useCallback(
    async (filePath: string) => {
      if (!window.api?.file) return

      const buffer = await window.api.file.readBinary(filePath)
      const blob = new Blob([buffer])
      const file = new File([blob], filePath.split('/').pop() ?? 'image')
      await loadImageFile(file)
    },
    [loadImageFile]
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
      await loadImageFromPath(result.filePaths[0])
    }
  }, [loadImageFromPath])

  const handleSave = useCallback(async () => {
    if (frames.length === 0 || !window.api?.file) return

    // Build a sprite sheet from all frames
    const cellW = grid.cellWidth
    const cellH = grid.cellHeight
    const cols = Math.ceil(Math.sqrt(frames.length))
    const rows = Math.ceil(frames.length / cols)
    const sheetW = cols * cellW
    const sheetH = rows * cellH

    const canvas = document.createElement('canvas')
    canvas.width = sheetW
    canvas.height = sheetH
    const ctx = canvas.getContext('2d')!

    for (let i = 0; i < frames.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const tmp = document.createElement('canvas')
      tmp.width = frames[i].imageData.width
      tmp.height = frames[i].imageData.height
      tmp.getContext('2d')!.putImageData(frames[i].imageData, 0, 0)
      ctx.drawImage(tmp, col * cellW, row * cellH)
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return

    const result = await window.api.file.showSaveDialog({
      title: 'Save Animation Sprite Sheet',
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
      defaultPath: 'animation.png'
    })

    if (!result.canceled && result.filePath) {
      const buffer = await blob.arrayBuffer()
      await window.api.file.writeBinary(result.filePath, buffer)
    }
  }, [frames, grid.cellWidth, grid.cellHeight])

  const handlePaste = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const url = URL.createObjectURL(blob)
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
            }
            img.onerror = () => URL.revokeObjectURL(url)
            img.src = url
            return
          }
        }
      }
    } catch {
      // Clipboard API not available or no image
    }
  }, [])

  const handleRotateRight = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(rotateImageData90(sourceImage, true))
  }, [sourceImage])

  const handleRotateLeft = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(rotateImageData90(sourceImage, false))
  }, [sourceImage])

  const handleFlipH = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(flipImageDataH(sourceImage))
  }, [sourceImage])

  const handleFlipV = useCallback(() => {
    if (!sourceImage) return
    setSourceImage(flipImageDataV(sourceImage))
  }, [sourceImage])

  // -------------------------------------------------------------------------
  // Crop — cut image into frames
  // -------------------------------------------------------------------------

  const handleCrop = useCallback(() => {
    if (!sourceImage) return

    const { cellWidth, cellHeight, columns, rows, offsetX, offsetY } = grid
    const newFrames: AnimationFrame[] = []

    // Create a temp canvas from the source image
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = sourceImage.width
    tmpCanvas.height = sourceImage.height
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.putImageData(sourceImage, 0, 0)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const sx = offsetX + c * cellWidth
        const sy = offsetY + r * cellHeight
        const w = Math.min(cellWidth, sourceImage.width - sx)
        const h = Math.min(cellHeight, sourceImage.height - sy)

        if (w <= 0 || h <= 0) continue

        const cellData = tmpCtx.getImageData(sx, sy, w, h)

        // Create a cell of exact cellWidth x cellHeight
        const frameCanvas = document.createElement('canvas')
        frameCanvas.width = cellWidth
        frameCanvas.height = cellHeight
        const frameCtx = frameCanvas.getContext('2d')!
        frameCtx.putImageData(cellData, 0, 0)

        const frameData = frameCtx.getImageData(0, 0, cellWidth, cellHeight)
        removeMagenta(frameData)

        // Skip empty frames
        if (isEmptyImage(frameData)) continue

        newFrames.push({
          imageData: frameData,
          dataUrl: imageDataToDataUrl(frameData),
          duration: null
        })
      }
    }

    setFrames(newFrames)
    setSelectedIndices(new Set())
    setCurrentFrame(0)
    setIsPlaying(false)
  }, [sourceImage, grid])

  // -------------------------------------------------------------------------
  // Frame selection
  // -------------------------------------------------------------------------

  const handleSelectFrame = useCallback(
    (index: number, multi: boolean) => {
      setSelectedIndices((prev) => {
        if (multi) {
          const next = new Set(prev)
          if (next.has(index)) {
            next.delete(index)
          } else {
            next.add(index)
          }
          return next
        }
        return new Set([index])
      })
      if (!isPlaying) {
        setCurrentFrame(index)
      }
    },
    [isPlaying]
  )

  // -------------------------------------------------------------------------
  // Frame management
  // -------------------------------------------------------------------------

  const handleDuplicateSelected = useCallback(() => {
    if (selectedIndices.size === 0) return

    const sorted = Array.from(selectedIndices).sort((a, b) => a - b)
    const newFrames = [...frames]
    const duplicated: AnimationFrame[] = sorted.map((i) => ({
      imageData: new ImageData(
        new Uint8ClampedArray(frames[i].imageData.data),
        frames[i].imageData.width,
        frames[i].imageData.height
      ),
      dataUrl: frames[i].dataUrl,
      duration: frames[i].duration
        ? createFrameDuration(frames[i].duration!.minimum, frames[i].duration!.maximum)
        : null
    }))

    newFrames.push(...duplicated)
    setFrames(newFrames)
  }, [frames, selectedIndices])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIndices.size === 0) return

    const newFrames = frames.filter((_, i) => !selectedIndices.has(i))
    setFrames(newFrames)
    setSelectedIndices(new Set())
    setCurrentFrame((prev) => Math.min(prev, Math.max(0, newFrames.length - 1)))

    if (newFrames.length === 0) {
      setIsPlaying(false)
    }
  }, [frames, selectedIndices])

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------

  const getFrameDurationMs = useCallback(
    (index: number): number => {
      if (index < 0 || index >= frames.length) return 300
      const dur = frames[index].duration
      if (dur) {
        if (dur.minimum === dur.maximum) return dur.minimum
        return dur.minimum + Math.round(Math.random() * (dur.maximum - dur.minimum))
      }
      return 300 // default 300ms per frame
    },
    [frames]
  )

  const handleTogglePlay = useCallback(() => {
    if (frames.length <= 1) return
    setIsPlaying((prev) => !prev)
  }, [frames.length])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return

    remainingRef.current = getFrameDurationMs(currentFrame)
    lastTimeRef.current = 0

    const tick = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time
        animRef.current = requestAnimationFrame(tick)
        return
      }

      const elapsed = time - lastTimeRef.current
      lastTimeRef.current = time
      remainingRef.current -= elapsed

      if (remainingRef.current <= 0) {
        setCurrentFrame((prev) => {
          const next = (prev + 1) % frames.length
          remainingRef.current = getFrameDurationMs(next)
          return next
        })
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying, frames.length, getFrameDurationMs, currentFrame])

  const handleFirstFrame = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame(0)
  }, [])

  const handlePrevFrame = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame((prev) => Math.max(0, prev - 1))
  }, [])

  const handleNextFrame = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame((prev) => Math.min(frames.length - 1, prev + 1))
  }, [frames.length])

  const handleLastFrame = useCallback(() => {
    setIsPlaying(false)
    setCurrentFrame(Math.max(0, frames.length - 1))
  }, [frames.length])

  // -------------------------------------------------------------------------
  // Drag-and-drop on image canvas
  // -------------------------------------------------------------------------

  const handleImageDrop = useCallback(
    (file: File) => {
      loadImageFile(file)
    },
    [loadImageFile]
  )

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 'o') {
        e.preventDefault()
        handleOpen()
      } else if (mod && e.key === 's') {
        e.preventDefault()
        handleSave()
      } else if (mod && e.key === 'v') {
        e.preventDefault()
        handlePaste()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom((z) => Math.max(0.5, z - 0.1))
      } else if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom((z) => Math.min(5, z + 0.1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handleOpen, handleSave, handlePaste])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <Modal
      title={t('labels.animationEditor')}
      open={open}
      onClose={onClose}
      width={900}
      closeOnBackdrop={false}
      footer={<DialogButton label={t('labels.close')} onClick={onClose} />}
    >
      <div className="flex flex-col" style={{ height: 560 }}>
        {/* Toolbar */}
        <AnimationEditorToolbar
          hasImage={hasImage}
          hasFrames={hasFrames}
          onOpen={handleOpen}
          onSave={handleSave}
          onPaste={handlePaste}
          onRotateRight={handleRotateRight}
          onRotateLeft={handleRotateLeft}
          onFlipH={handleFlipH}
          onFlipV={handleFlipV}
        />

        {/* Main content: Properties panel + Image canvas / Frame timeline */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Properties panel */}
          <PropertiesPanel
            category={category}
            onCategoryChange={setCategory}
            grid={grid}
            onGridChange={setGrid}
            zoom={zoom}
            onZoomChange={setZoom}
            onCrop={handleCrop}
            hasImage={hasImage}
            frames={frames}
            currentFrame={currentFrame}
          />

          {/* Right: Canvas + Frame strip + Playback controls */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Image canvas */}
            <ImageCanvas imageData={sourceImage} grid={grid} zoom={zoom} onDrop={handleImageDrop} />

            {/* Frame timeline */}
            <FrameTimeline
              frames={frames}
              selectedIndices={selectedIndices}
              onSelect={handleSelectFrame}
              playbackFrame={currentFrame}
            />

            {/* Playback controls */}
            <PlaybackControls
              hasFrames={hasFrames}
              isPlaying={isPlaying}
              onFirstFrame={handleFirstFrame}
              onPrevFrame={handlePrevFrame}
              onTogglePlay={handleTogglePlay}
              onNextFrame={handleNextFrame}
              onLastFrame={handleLastFrame}
              onDuplicate={handleDuplicateSelected}
              onDelete={handleDeleteSelected}
              canDuplicate={hasSelection}
              canDelete={hasSelection}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
