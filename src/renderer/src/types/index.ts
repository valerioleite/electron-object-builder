export {
  SPRITE_DEFAULT_SIZE,
  SPRITE_DEFAULT_DATA_SIZE,
  SPRITE_DEFAULT_VALUE,
  type SpriteData,
  createSpriteData,
  cloneSpriteData,
  isSpriteDataEmpty
} from './sprites'

export {
  AnimationMode,
  FrameGroupType,
  type FrameDuration,
  createFrameDuration,
  getFrameDurationValue,
  frameDurationEquals,
  cloneFrameDuration,
  type FrameGroup,
  createFrameGroup,
  cloneFrameGroup,
  getFrameGroupTotalSprites,
  getFrameGroupTotalTextures,
  getFrameGroupTotalX,
  getFrameGroupTotalY,
  getFrameGroupSpriteIndex,
  getFrameGroupTextureIndex,
  getFrameGroupSpriteSheetSize,
  makeOutfitFrameGroup
} from './animation'

export {
  ThingCategory,
  ThingCategoryValue,
  isValidThingCategory,
  getThingCategoryByValue,
  getThingCategoryValue,
  type ThingType,
  createThingType,
  getThingFrameGroup,
  setThingFrameGroup,
  copyThingProperties,
  cloneThingType,
  copyThingPatterns,
  getThingSpriteIndices,
  isThingTypeEmpty,
  createThing,
  addThingFrameGroupState,
  type ThingData,
  createThingData,
  cloneThingData
} from './things'

export {
  Direction,
  getDirectionName,
  toDirection,
  isDiagonalDirection,
  type Size,
  createSize,
  type Rect,
  createRect,
  cloneRect,
  type Position,
  createPosition,
  isPositionZero,
  positionEquals
} from './geometry'

export {
  type Version,
  createVersion,
  cloneVersion,
  versionEquals,
  type ClientFeatures,
  createClientFeatures,
  cloneClientFeatures,
  applyVersionDefaults,
  clientFeaturesDiffer
} from './version'

export {
  LAST_FLAG,
  MetadataFlags1,
  MetadataFlags2,
  MetadataFlags3,
  MetadataFlags4,
  MetadataFlags5,
  MetadataFlags6,
  type MetadataFlags,
  getMetadataFlagsForVersion
} from './metadata-flags'

export {
  ServerItemType,
  ServerItemGroup,
  TileStackOrder,
  ServerItemFlag,
  ServerItemAttribute,
  type XmlAttributeValue,
  type ServerItem,
  createServerItem,
  cloneServerItem,
  getServerItemFlags,
  setServerItemFlags,
  getServerItemGroup,
  getXmlAttribute,
  getXmlAttributeString,
  setXmlAttribute,
  hasXmlData,
  type ItemAttribute,
  createItemAttribute,
  cloneItemAttribute
} from './server-item'

export {
  OTFormat,
  OBDVersion,
  ClipboardAction,
  ProgressBarID,
  ImageFormat,
  type ThingExportFormat,
  type SpriteDimension,
  createSpriteDimension,
  type ClientInfo,
  createClientInfo,
  type CreateProjectParams,
  type OpenProjectParams,
  type CompileProjectParams,
  type MergeProjectParams,
  type ExportThingParams,
  type ExportSpriteParams,
  type ImportThingParams,
  type ProgressEvent,
  type ErrorEvent,
  type ProgressCallback,
  type ErrorCallback,
  type CompleteCallback
} from './project'

export {
  type ObjectBuilderSettings,
  createObjectBuilderSettings,
  getDefaultDuration
} from './settings'
