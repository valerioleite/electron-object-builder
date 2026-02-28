import {
  LAST_FLAG,
  MetadataFlags1,
  MetadataFlags2,
  MetadataFlags3,
  MetadataFlags4,
  MetadataFlags5,
  MetadataFlags6,
  getMetadataFlagsForVersion
} from '../metadata-flags'

// ---------------------------------------------------------------------------
// LAST_FLAG
// ---------------------------------------------------------------------------

describe('LAST_FLAG', () => {
  it('equals 0xFF (255)', () => {
    expect(LAST_FLAG).toBe(0xff)
    expect(LAST_FLAG).toBe(255)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags1 (Client versions 7.10 - 7.30)
// ---------------------------------------------------------------------------

describe('MetadataFlags1', () => {
  it('has GROUND as 0x00', () => {
    expect(MetadataFlags1.GROUND).toBe(0x00)
  })

  it('has ON_BOTTOM as 0x01', () => {
    expect(MetadataFlags1.ON_BOTTOM).toBe(0x01)
  })

  it('has ON_TOP as 0x02', () => {
    expect(MetadataFlags1.ON_TOP).toBe(0x02)
  })

  it('has CONTAINER as 0x03', () => {
    expect(MetadataFlags1.CONTAINER).toBe(0x03)
  })

  it('has HAS_LIGHT as 0x10', () => {
    expect(MetadataFlags1.HAS_LIGHT).toBe(0x10)
  })

  it('has MINI_MAP as 0x16', () => {
    expect(MetadataFlags1.MINI_MAP).toBe(0x16)
  })

  it('has WRAPPABLE as 0x24', () => {
    expect(MetadataFlags1.WRAPPABLE).toBe(0x24)
  })

  it('has UNWRAPPABLE as 0x25', () => {
    expect(MetadataFlags1.UNWRAPPABLE).toBe(0x25)
  })

  it('has TOP_EFFECT as 0x26', () => {
    expect(MetadataFlags1.TOP_EFFECT).toBe(0x26)
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags1.LAST_FLAG).toBe(0xff)
  })

  it('does not have HANGABLE (added in Flags2)', () => {
    expect('HANGABLE' in MetadataFlags1).toBe(false)
  })

  it('does not have GROUND_BORDER (added in Flags3)', () => {
    expect('GROUND_BORDER' in MetadataFlags1).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags2 (Client versions 7.40 - 7.50)
// ---------------------------------------------------------------------------

describe('MetadataFlags2', () => {
  it('has GROUND as 0x00', () => {
    expect(MetadataFlags2.GROUND).toBe(0x00)
  })

  it('has HANGABLE as 0x19', () => {
    expect(MetadataFlags2.HANGABLE).toBe(0x19)
  })

  it('has VERTICAL as 0x1A', () => {
    expect(MetadataFlags2.VERTICAL).toBe(0x1a)
  })

  it('has HORIZONTAL as 0x1B', () => {
    expect(MetadataFlags2.HORIZONTAL).toBe(0x1b)
  })

  it('has ANIMATE_ALWAYS as 0x1C', () => {
    expect(MetadataFlags2.ANIMATE_ALWAYS).toBe(0x1c)
  })

  it('has LENS_HELP as 0x1D', () => {
    expect(MetadataFlags2.LENS_HELP).toBe(0x1d)
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags2.LAST_FLAG).toBe(0xff)
  })

  it('does not have GROUND_BORDER (added in Flags3)', () => {
    expect('GROUND_BORDER' in MetadataFlags2).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags3 (Client versions 7.55 - 7.72)
// ---------------------------------------------------------------------------

describe('MetadataFlags3', () => {
  it('has GROUND_BORDER as 0x01', () => {
    expect(MetadataFlags3.GROUND_BORDER).toBe(0x01)
  })

  it('has ON_BOTTOM as 0x02 (different from Flags1/2 where it is 0x01)', () => {
    expect(MetadataFlags3.ON_BOTTOM).toBe(0x02)
  })

  it('has FULL_GROUND as 0x1E', () => {
    expect(MetadataFlags3.FULL_GROUND).toBe(0x1e)
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags3.LAST_FLAG).toBe(0xff)
  })

  it('does not have HAS_CHARGES (added in Flags4)', () => {
    expect('HAS_CHARGES' in MetadataFlags3).toBe(false)
  })

  it('does not have DONT_HIDE (added in Flags4)', () => {
    expect('DONT_HIDE' in MetadataFlags3).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags4 (Client versions 7.80 - 8.54)
// ---------------------------------------------------------------------------

describe('MetadataFlags4', () => {
  it('has HAS_CHARGES as 0x08', () => {
    expect(MetadataFlags4.HAS_CHARGES).toBe(0x08)
  })

  it('has DONT_HIDE as 0x17', () => {
    expect(MetadataFlags4.DONT_HIDE).toBe(0x17)
  })

  it('has IGNORE_LOOK as 0x20', () => {
    expect(MetadataFlags4.IGNORE_LOOK).toBe(0x20)
  })

  it('has BLOCK_PATHFIND as 0x10 (different name from Flags1-3: BLOCK_PATHFINDER)', () => {
    expect(MetadataFlags4.BLOCK_PATHFIND).toBe(0x10)
  })

  it('has WRAPPABLE as 0x24', () => {
    expect(MetadataFlags4.WRAPPABLE).toBe(0x24)
  })

  it('has HAS_BONES as 0x27', () => {
    expect(MetadataFlags4.HAS_BONES).toBe(0x27)
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags4.LAST_FLAG).toBe(0xff)
  })

  it('does not have TRANSLUCENT (added in Flags5)', () => {
    expect('TRANSLUCENT' in MetadataFlags4).toBe(false)
  })

  it('does not have CLOTH (added in Flags5)', () => {
    expect('CLOTH' in MetadataFlags4).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags5 (Client versions 8.60 - 9.86)
// ---------------------------------------------------------------------------

describe('MetadataFlags5', () => {
  it('has TRANSLUCENT as 0x17', () => {
    expect(MetadataFlags5.TRANSLUCENT).toBe(0x17)
  })

  it('has CLOTH as 0x20', () => {
    expect(MetadataFlags5.CLOTH).toBe(0x20)
  })

  it('has MARKET_ITEM as 0x21', () => {
    expect(MetadataFlags5.MARKET_ITEM).toBe(0x21)
  })

  it('has HAS_BONES as 0x27', () => {
    expect(MetadataFlags5.HAS_BONES).toBe(0x27)
  })

  it('has STRING_CHARSET as "iso-8859-1"', () => {
    expect(MetadataFlags5.STRING_CHARSET).toBe('iso-8859-1')
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags5.LAST_FLAG).toBe(0xff)
  })

  it('does not have NO_MOVE_ANIMATION (added in Flags6)', () => {
    expect('NO_MOVE_ANIMATION' in MetadataFlags5).toBe(false)
  })

  it('does not have DEFAULT_ACTION (added in Flags6)', () => {
    expect('DEFAULT_ACTION' in MetadataFlags5).toBe(false)
  })

  it('does not have HAS_CHARGES (present in Flags4 but removed in Flags5)', () => {
    expect('HAS_CHARGES' in MetadataFlags5).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MetadataFlags6 (Client versions 10.10 - 10.56+)
// ---------------------------------------------------------------------------

describe('MetadataFlags6', () => {
  it('has NO_MOVE_ANIMATION as 0x10', () => {
    expect(MetadataFlags6.NO_MOVE_ANIMATION).toBe(0x10)
  })

  it('has PICKUPABLE as 0x11 (shifted by NO_MOVE_ANIMATION)', () => {
    expect(MetadataFlags6.PICKUPABLE).toBe(0x11)
  })

  it('has DEFAULT_ACTION as 0x23', () => {
    expect(MetadataFlags6.DEFAULT_ACTION).toBe(0x23)
  })

  it('has WRAPPABLE as 0x24', () => {
    expect(MetadataFlags6.WRAPPABLE).toBe(0x24)
  })

  it('has UNWRAPPABLE as 0x25', () => {
    expect(MetadataFlags6.UNWRAPPABLE).toBe(0x25)
  })

  it('has TOP_EFFECT as 0x26', () => {
    expect(MetadataFlags6.TOP_EFFECT).toBe(0x26)
  })

  it('has HAS_BONES as 0x27', () => {
    expect(MetadataFlags6.HAS_BONES).toBe(0x27)
  })

  it('has USABLE as 0xFE', () => {
    expect(MetadataFlags6.USABLE).toBe(0xfe)
  })

  it('has STRING_CHARSET as "iso-8859-1"', () => {
    expect(MetadataFlags6.STRING_CHARSET).toBe('iso-8859-1')
  })

  it('has LAST_FLAG equal to 0xFF', () => {
    expect(MetadataFlags6.LAST_FLAG).toBe(0xff)
  })

  it('has CLOTH as 0x21', () => {
    expect(MetadataFlags6.CLOTH).toBe(0x21)
  })

  it('has MARKET_ITEM as 0x22', () => {
    expect(MetadataFlags6.MARKET_ITEM).toBe(0x22)
  })

  it('has TRANSLUCENT as 0x18', () => {
    expect(MetadataFlags6.TRANSLUCENT).toBe(0x18)
  })

  it('has DONT_HIDE as 0x17', () => {
    expect(MetadataFlags6.DONT_HIDE).toBe(0x17)
  })
})

// ---------------------------------------------------------------------------
// Cross-version flag consistency
// ---------------------------------------------------------------------------

describe('Cross-version flag consistency', () => {
  it('all flag sets share GROUND as 0x00', () => {
    expect(MetadataFlags1.GROUND).toBe(0x00)
    expect(MetadataFlags2.GROUND).toBe(0x00)
    expect(MetadataFlags3.GROUND).toBe(0x00)
    expect(MetadataFlags4.GROUND).toBe(0x00)
    expect(MetadataFlags5.GROUND).toBe(0x00)
    expect(MetadataFlags6.GROUND).toBe(0x00)
  })

  it('all flag sets have LAST_FLAG as 0xFF', () => {
    expect(MetadataFlags1.LAST_FLAG).toBe(0xff)
    expect(MetadataFlags2.LAST_FLAG).toBe(0xff)
    expect(MetadataFlags3.LAST_FLAG).toBe(0xff)
    expect(MetadataFlags4.LAST_FLAG).toBe(0xff)
    expect(MetadataFlags5.LAST_FLAG).toBe(0xff)
    expect(MetadataFlags6.LAST_FLAG).toBe(0xff)
  })

  it('GROUND_BORDER exists from Flags3 onward', () => {
    expect('GROUND_BORDER' in MetadataFlags1).toBe(false)
    expect('GROUND_BORDER' in MetadataFlags2).toBe(false)
    expect(MetadataFlags3.GROUND_BORDER).toBe(0x01)
    expect(MetadataFlags4.GROUND_BORDER).toBe(0x01)
    expect(MetadataFlags5.GROUND_BORDER).toBe(0x01)
    expect(MetadataFlags6.GROUND_BORDER).toBe(0x01)
  })

  it('HANGABLE exists from Flags2 onward', () => {
    expect('HANGABLE' in MetadataFlags1).toBe(false)
    expect(MetadataFlags2.HANGABLE).toBe(0x19)
    expect(MetadataFlags3.HANGABLE).toBe(0x11)
    expect(MetadataFlags4.HANGABLE).toBe(0x12)
    expect(MetadataFlags5.HANGABLE).toBe(0x11)
    expect(MetadataFlags6.HANGABLE).toBe(0x12)
  })

  it('STRING_CHARSET exists only in Flags5 and Flags6', () => {
    expect('STRING_CHARSET' in MetadataFlags1).toBe(false)
    expect('STRING_CHARSET' in MetadataFlags2).toBe(false)
    expect('STRING_CHARSET' in MetadataFlags3).toBe(false)
    expect('STRING_CHARSET' in MetadataFlags4).toBe(false)
    expect(MetadataFlags5.STRING_CHARSET).toBe('iso-8859-1')
    expect(MetadataFlags6.STRING_CHARSET).toBe('iso-8859-1')
  })

  it('USABLE exists only in Flags6', () => {
    expect('USABLE' in MetadataFlags1).toBe(false)
    expect('USABLE' in MetadataFlags2).toBe(false)
    expect('USABLE' in MetadataFlags3).toBe(false)
    expect('USABLE' in MetadataFlags4).toBe(false)
    expect('USABLE' in MetadataFlags5).toBe(false)
    expect(MetadataFlags6.USABLE).toBe(0xfe)
  })

  it('NO_MOVE_ANIMATION exists only in Flags6', () => {
    expect('NO_MOVE_ANIMATION' in MetadataFlags1).toBe(false)
    expect('NO_MOVE_ANIMATION' in MetadataFlags2).toBe(false)
    expect('NO_MOVE_ANIMATION' in MetadataFlags3).toBe(false)
    expect('NO_MOVE_ANIMATION' in MetadataFlags4).toBe(false)
    expect('NO_MOVE_ANIMATION' in MetadataFlags5).toBe(false)
    expect(MetadataFlags6.NO_MOVE_ANIMATION).toBe(0x10)
  })

  it('DEFAULT_ACTION exists only in Flags6', () => {
    expect('DEFAULT_ACTION' in MetadataFlags1).toBe(false)
    expect('DEFAULT_ACTION' in MetadataFlags2).toBe(false)
    expect('DEFAULT_ACTION' in MetadataFlags3).toBe(false)
    expect('DEFAULT_ACTION' in MetadataFlags4).toBe(false)
    expect('DEFAULT_ACTION' in MetadataFlags5).toBe(false)
    expect(MetadataFlags6.DEFAULT_ACTION).toBe(0x23)
  })
})

// ---------------------------------------------------------------------------
// getMetadataFlagsForVersion
// ---------------------------------------------------------------------------

describe('getMetadataFlagsForVersion', () => {
  it('returns MetadataFlags1 for version 710', () => {
    expect(getMetadataFlagsForVersion(710)).toBe(MetadataFlags1)
  })

  it('returns MetadataFlags1 for version 720', () => {
    expect(getMetadataFlagsForVersion(720)).toBe(MetadataFlags1)
  })

  it('returns MetadataFlags1 for version 730', () => {
    expect(getMetadataFlagsForVersion(730)).toBe(MetadataFlags1)
  })

  it('returns MetadataFlags1 for version 739 (just below 740)', () => {
    expect(getMetadataFlagsForVersion(739)).toBe(MetadataFlags1)
  })

  it('returns MetadataFlags2 for version 740', () => {
    expect(getMetadataFlagsForVersion(740)).toBe(MetadataFlags2)
  })

  it('returns MetadataFlags2 for version 750', () => {
    expect(getMetadataFlagsForVersion(750)).toBe(MetadataFlags2)
  })

  it('returns MetadataFlags2 for version 754 (just below 755)', () => {
    expect(getMetadataFlagsForVersion(754)).toBe(MetadataFlags2)
  })

  it('returns MetadataFlags3 for version 755', () => {
    expect(getMetadataFlagsForVersion(755)).toBe(MetadataFlags3)
  })

  it('returns MetadataFlags3 for version 760', () => {
    expect(getMetadataFlagsForVersion(760)).toBe(MetadataFlags3)
  })

  it('returns MetadataFlags3 for version 772', () => {
    expect(getMetadataFlagsForVersion(772)).toBe(MetadataFlags3)
  })

  it('returns MetadataFlags3 for version 779 (just below 780)', () => {
    expect(getMetadataFlagsForVersion(779)).toBe(MetadataFlags3)
  })

  it('returns MetadataFlags4 for version 780', () => {
    expect(getMetadataFlagsForVersion(780)).toBe(MetadataFlags4)
  })

  it('returns MetadataFlags4 for version 800', () => {
    expect(getMetadataFlagsForVersion(800)).toBe(MetadataFlags4)
  })

  it('returns MetadataFlags4 for version 854', () => {
    expect(getMetadataFlagsForVersion(854)).toBe(MetadataFlags4)
  })

  it('returns MetadataFlags4 for version 859 (just below 860)', () => {
    expect(getMetadataFlagsForVersion(859)).toBe(MetadataFlags4)
  })

  it('returns MetadataFlags5 for version 860', () => {
    expect(getMetadataFlagsForVersion(860)).toBe(MetadataFlags5)
  })

  it('returns MetadataFlags5 for version 900', () => {
    expect(getMetadataFlagsForVersion(900)).toBe(MetadataFlags5)
  })

  it('returns MetadataFlags5 for version 960', () => {
    expect(getMetadataFlagsForVersion(960)).toBe(MetadataFlags5)
  })

  it('returns MetadataFlags5 for version 986', () => {
    expect(getMetadataFlagsForVersion(986)).toBe(MetadataFlags5)
  })

  it('returns MetadataFlags5 for version 1009 (just below 1010)', () => {
    expect(getMetadataFlagsForVersion(1009)).toBe(MetadataFlags5)
  })

  it('returns MetadataFlags6 for version 1010', () => {
    expect(getMetadataFlagsForVersion(1010)).toBe(MetadataFlags6)
  })

  it('returns MetadataFlags6 for version 1050', () => {
    expect(getMetadataFlagsForVersion(1050)).toBe(MetadataFlags6)
  })

  it('returns MetadataFlags6 for version 1056', () => {
    expect(getMetadataFlagsForVersion(1056)).toBe(MetadataFlags6)
  })

  it('returns MetadataFlags6 for version 1100 (high version)', () => {
    expect(getMetadataFlagsForVersion(1100)).toBe(MetadataFlags6)
  })

  it('returns MetadataFlags6 for version 1310 (very high version)', () => {
    expect(getMetadataFlagsForVersion(1310)).toBe(MetadataFlags6)
  })

  it('returns MetadataFlags1 for very low version (below 710)', () => {
    expect(getMetadataFlagsForVersion(100)).toBe(MetadataFlags1)
  })

  it('returns MetadataFlags1 for version 0', () => {
    expect(getMetadataFlagsForVersion(0)).toBe(MetadataFlags1)
  })

  it('returns consistent results for each version boundary', () => {
    // Test each boundary precisely
    const boundaries = [
      { version: 739, expected: MetadataFlags1 },
      { version: 740, expected: MetadataFlags2 },
      { version: 754, expected: MetadataFlags2 },
      { version: 755, expected: MetadataFlags3 },
      { version: 779, expected: MetadataFlags3 },
      { version: 780, expected: MetadataFlags4 },
      { version: 859, expected: MetadataFlags4 },
      { version: 860, expected: MetadataFlags5 },
      { version: 1009, expected: MetadataFlags5 },
      { version: 1010, expected: MetadataFlags6 }
    ]
    for (const { version, expected } of boundaries) {
      expect(getMetadataFlagsForVersion(version)).toBe(expected)
    }
  })

  it('returns a flags object that includes LAST_FLAG', () => {
    const flags = getMetadataFlagsForVersion(1056)
    expect(flags.LAST_FLAG).toBe(0xff)
  })

  it('returns a flags object that includes GROUND', () => {
    const flags = getMetadataFlagsForVersion(710)
    expect(flags.GROUND).toBe(0x00)
  })
})
