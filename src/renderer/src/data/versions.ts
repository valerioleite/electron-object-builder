/**
 * Static list of all supported OpenTibia client versions.
 * Ported from legacy config/versions.xml (106 entries).
 *
 * Each entry includes the numeric version value, display string,
 * DAT/SPR file signatures, and OTB version number.
 */

import type { Version } from '../types/version'

/** All supported client versions, sorted ascending by value then signature. */
export const VERSIONS: readonly Version[] = [
  {
    value: 710,
    valueStr: '7.10',
    datSignature: 0x3dff4b2a,
    sprSignature: 0x3dff4aeb,
    otbVersion: 0
  },
  {
    value: 730,
    valueStr: '7.30',
    datSignature: 0x411a6233,
    sprSignature: 0x411a6279,
    otbVersion: 0
  },
  {
    value: 740,
    valueStr: '7.40',
    datSignature: 0x41bf619c,
    sprSignature: 0x41b9ea86,
    otbVersion: 1
  },
  {
    value: 750,
    valueStr: '7.50',
    datSignature: 0x42f81973,
    sprSignature: 0x42f81949,
    otbVersion: 1
  },
  {
    value: 755,
    valueStr: '7.55',
    datSignature: 0x437b2b8f,
    sprSignature: 0x434f9cde,
    otbVersion: 2
  },
  {
    value: 760,
    valueStr: '7.60',
    datSignature: 0x439d5a33,
    sprSignature: 0x439852be,
    otbVersion: 3
  },
  {
    value: 770,
    valueStr: '7.70',
    datSignature: 0x439d5a33,
    sprSignature: 0x439852be,
    otbVersion: 3
  },
  {
    value: 780,
    valueStr: '7.80',
    datSignature: 0x44ce4743,
    sprSignature: 0x44ce4206,
    otbVersion: 4
  },
  {
    value: 790,
    valueStr: '7.90',
    datSignature: 0x457d854e,
    sprSignature: 0x457957c8,
    otbVersion: 5
  },
  {
    value: 792,
    valueStr: '7.92',
    datSignature: 0x459e7b73,
    sprSignature: 0x45880fe8,
    otbVersion: 6
  },
  {
    value: 800,
    valueStr: '8.00',
    datSignature: 0x467fd7e6,
    sprSignature: 0x467f9e74,
    otbVersion: 7
  },
  {
    value: 810,
    valueStr: '8.10',
    datSignature: 0x475d3747,
    sprSignature: 0x475d0b01,
    otbVersion: 8
  },
  {
    value: 811,
    valueStr: '8.11',
    datSignature: 0x47f60e37,
    sprSignature: 0x47ebb9b2,
    otbVersion: 9
  },
  {
    value: 820,
    valueStr: '8.20',
    datSignature: 0x486905aa,
    sprSignature: 0x4868ecc9,
    otbVersion: 10
  },
  {
    value: 830,
    valueStr: '8.30',
    datSignature: 0x48da1fb6,
    sprSignature: 0x48c8e712,
    otbVersion: 11
  },
  {
    value: 840,
    valueStr: '8.40',
    datSignature: 0x493d607a,
    sprSignature: 0x493d4e7c,
    otbVersion: 12
  },
  {
    value: 841,
    valueStr: '8.41',
    datSignature: 0x49b7cc19,
    sprSignature: 0x49b140ea,
    otbVersion: 13
  },
  {
    value: 842,
    valueStr: '8.42',
    datSignature: 0x49c233c9,
    sprSignature: 0x49b140ea,
    otbVersion: 14
  },
  {
    value: 850,
    valueStr: '8.50 v1',
    datSignature: 0x4a49c5eb,
    sprSignature: 0x4a44fd4e,
    otbVersion: 15
  },
  {
    value: 850,
    valueStr: '8.50 v2',
    datSignature: 0x4a4cc0dc,
    sprSignature: 0x4a44fd4e,
    otbVersion: 15
  },
  {
    value: 850,
    valueStr: '8.50 v3',
    datSignature: 0x4ae97492,
    sprSignature: 0x4acb5230,
    otbVersion: 15
  },
  {
    value: 852,
    valueStr: '8.52',
    datSignature: 0x4a4cc0dc,
    sprSignature: 0x4a44fd4e,
    otbVersion: 0
  },
  {
    value: 853,
    valueStr: '8.53',
    datSignature: 0x4ae97492,
    sprSignature: 0x4acb5230,
    otbVersion: 0
  },
  {
    value: 854,
    valueStr: '8.54 v1',
    datSignature: 0x4b1e2caa,
    sprSignature: 0x4b1e2c87,
    otbVersion: 16
  },
  {
    value: 854,
    valueStr: '8.54 v2',
    datSignature: 0x4b0d46a9,
    sprSignature: 0x4b0d3aff,
    otbVersion: 16
  },
  {
    value: 854,
    valueStr: '8.54 v3',
    datSignature: 0x4b28b89e,
    sprSignature: 0x4b1e2c87,
    otbVersion: 17
  },
  {
    value: 855,
    valueStr: '8.55',
    datSignature: 0x4b98ff53,
    sprSignature: 0x4b913871,
    otbVersion: 18
  },
  {
    value: 860,
    valueStr: '8.60 v1',
    datSignature: 0x4c28b721,
    sprSignature: 0x4c220594,
    otbVersion: 19
  },
  {
    value: 860,
    valueStr: '8.60 v2',
    datSignature: 0x4c2c7993,
    sprSignature: 0x4c220594,
    otbVersion: 20
  },
  {
    value: 861,
    valueStr: '8.61',
    datSignature: 0x4c6a4cbc,
    sprSignature: 0x4c63f145,
    otbVersion: 21
  },
  {
    value: 862,
    valueStr: '8.62',
    datSignature: 0x4c973450,
    sprSignature: 0x4c63f145,
    otbVersion: 22
  },
  {
    value: 870,
    valueStr: '8.70',
    datSignature: 0x4cfe22c5,
    sprSignature: 0x4cfd078a,
    otbVersion: 23
  },
  {
    value: 871,
    valueStr: '8.71',
    datSignature: 0x4d41979e,
    sprSignature: 0x4d3d65d0,
    otbVersion: 24
  },
  {
    value: 872,
    valueStr: '8.72',
    datSignature: 0x4dad1a1a,
    sprSignature: 0x4dad1a32,
    otbVersion: 25
  },
  {
    value: 900,
    valueStr: '9.00',
    datSignature: 0x4dbaa20b,
    sprSignature: 0x4dad1a32,
    otbVersion: 27
  },
  {
    value: 910,
    valueStr: '9.10',
    datSignature: 0x4e12daff,
    sprSignature: 0x4e12db27,
    otbVersion: 28
  },
  {
    value: 920,
    valueStr: '9.20',
    datSignature: 0x4e807c08,
    sprSignature: 0x4e807c23,
    otbVersion: 29
  },
  {
    value: 940,
    valueStr: '9.40',
    datSignature: 0x4ee71de5,
    sprSignature: 0x4ee71e06,
    otbVersion: 30
  },
  {
    value: 944,
    valueStr: '9.44 v0',
    datSignature: 0x4f0eefbb,
    sprSignature: 0x4f0eefef,
    otbVersion: 31
  },
  {
    value: 944,
    valueStr: '9.44 v1',
    datSignature: 0x4f105168,
    sprSignature: 0x4f1051d7,
    otbVersion: 32
  },
  {
    value: 944,
    valueStr: '9.44 v2',
    datSignature: 0x4f16c0d7,
    sprSignature: 0x4f1051d7,
    otbVersion: 33
  },
  {
    value: 944,
    valueStr: '9.44 v3',
    datSignature: 0x4f3131cf,
    sprSignature: 0x4f3131f6,
    otbVersion: 34
  },
  {
    value: 946,
    valueStr: '9.46',
    datSignature: 0x4f75b7ab,
    sprSignature: 0x4f5dcef7,
    otbVersion: 35
  },
  {
    value: 950,
    valueStr: '9.50',
    datSignature: 0x4f75b7ab,
    sprSignature: 0x4f75b7cd,
    otbVersion: 36
  },
  {
    value: 952,
    valueStr: '9.52',
    datSignature: 0x4f857f6c,
    sprSignature: 0x4f857f8e,
    otbVersion: 37
  },
  {
    value: 953,
    valueStr: '9.53',
    datSignature: 0x4fa11252,
    sprSignature: 0x4fa11282,
    otbVersion: 38
  },
  {
    value: 954,
    valueStr: '9.54',
    datSignature: 0x4fd5956b,
    sprSignature: 0x4fd595b7,
    otbVersion: 39
  },
  {
    value: 960,
    valueStr: '9.60',
    datSignature: 0x4ffa74cc,
    sprSignature: 0x4ffa74f9,
    otbVersion: 40
  },
  {
    value: 961,
    valueStr: '9.61',
    datSignature: 0x50226f9d,
    sprSignature: 0x50226fbd,
    otbVersion: 41
  },
  {
    value: 963,
    valueStr: '9.63',
    datSignature: 0x503cb933,
    sprSignature: 0x503cb954,
    otbVersion: 42
  },
  {
    value: 970,
    valueStr: '9.70',
    datSignature: 0x5072a490,
    sprSignature: 0x5072a567,
    otbVersion: 43
  },
  {
    value: 980,
    valueStr: '9.80',
    datSignature: 0x50c70674,
    sprSignature: 0x50c70753,
    otbVersion: 44
  },
  {
    value: 981,
    valueStr: '9.81',
    datSignature: 0x50d1c5b6,
    sprSignature: 0x50d1c685,
    otbVersion: 45
  },
  {
    value: 982,
    valueStr: '9.82',
    datSignature: 0x512cad09,
    sprSignature: 0x512cad68,
    otbVersion: 46
  },
  {
    value: 983,
    valueStr: '9.83',
    datSignature: 0x51407b67,
    sprSignature: 0x51407bc7,
    otbVersion: 47
  },
  {
    value: 985,
    valueStr: '9.85',
    datSignature: 0x51641a1b,
    sprSignature: 0x51641a84,
    otbVersion: 48
  },
  {
    value: 986,
    valueStr: '9.86',
    datSignature: 0x5170e904,
    sprSignature: 0x5170e96f,
    otbVersion: 49
  },
  {
    value: 1010,
    valueStr: '10.10',
    datSignature: 0x51e3f8c3,
    sprSignature: 0x51e3f8e9,
    otbVersion: 50
  },
  {
    value: 1020,
    valueStr: '10.20',
    datSignature: 0x5236f129,
    sprSignature: 0x5236f14f,
    otbVersion: 51
  },
  {
    value: 1021,
    valueStr: '10.21',
    datSignature: 0x526a5068,
    sprSignature: 0x526a5090,
    otbVersion: 52
  },
  {
    value: 1030,
    valueStr: '10.30',
    datSignature: 0x52a59036,
    sprSignature: 0x52a5905f,
    otbVersion: 53
  },
  {
    value: 1031,
    valueStr: '10.31',
    datSignature: 0x52aed581,
    sprSignature: 0x52aed5a7,
    otbVersion: 54
  },
  {
    value: 1032,
    valueStr: '10.32',
    datSignature: 0x52d8d0a9,
    sprSignature: 0x52d8d0ce,
    otbVersion: 0
  },
  {
    value: 1034,
    valueStr: '10.34',
    datSignature: 0x52e74ab5,
    sprSignature: 0x52e74ada,
    otbVersion: 0
  },
  {
    value: 1035,
    valueStr: '10.35',
    datSignature: 0x52fdfc2c,
    sprSignature: 0x52fdfc54,
    otbVersion: 55
  },
  {
    value: 1036,
    valueStr: '10.36',
    datSignature: 0x53159c7e,
    sprSignature: 0x53159ca9,
    otbVersion: 0
  },
  {
    value: 1037,
    valueStr: '10.37',
    datSignature: 0x531ea82e,
    sprSignature: 0x531ea856,
    otbVersion: 0
  },
  {
    value: 1038,
    valueStr: '10.38',
    datSignature: 0x5333c199,
    sprSignature: 0x5333c1c3,
    otbVersion: 0
  },
  {
    value: 1039,
    valueStr: '10.39',
    datSignature: 0x535a50ad,
    sprSignature: 0x535a50d5,
    otbVersion: 0
  },
  {
    value: 1040,
    valueStr: '10.40',
    datSignature: 0x5379984d,
    sprSignature: 0x53799876,
    otbVersion: 0
  },
  {
    value: 1041,
    valueStr: '10.41',
    datSignature: 0x5383504e,
    sprSignature: 0x53835077,
    otbVersion: 0
  },
  {
    value: 1050,
    valueStr: '10.50',
    datSignature: 0x53b6460e,
    sprSignature: 0x53b64639,
    otbVersion: 0
  },
  {
    value: 1051,
    valueStr: '10.51',
    datSignature: 0x53c8cc17,
    sprSignature: 0x53c8cc3f,
    otbVersion: 0
  },
  {
    value: 1052,
    valueStr: '10.52',
    datSignature: 0x53e898bd,
    sprSignature: 0x53e898e5,
    otbVersion: 0
  },
  {
    value: 1053,
    valueStr: '10.53',
    datSignature: 0x53fad76e,
    sprSignature: 0x53fad799,
    otbVersion: 0
  },
  {
    value: 1054,
    valueStr: '10.54',
    datSignature: 0x540d3a47,
    sprSignature: 0x53e898e5,
    otbVersion: 0
  },
  {
    value: 1055,
    valueStr: '10.55',
    datSignature: 0x54128727,
    sprSignature: 0x54128755,
    otbVersion: 0
  },
  {
    value: 1056,
    valueStr: '10.56',
    datSignature: 0x542143b0,
    sprSignature: 0x542143de,
    otbVersion: 0
  },
  {
    value: 1057,
    valueStr: '10.57',
    datSignature: 0x542535f9,
    sprSignature: 0x54253627,
    otbVersion: 0
  },
  {
    value: 1058,
    valueStr: '10.58',
    datSignature: 0x542d12e7,
    sprSignature: 0x542d1315,
    otbVersion: 0
  },
  {
    value: 1059,
    valueStr: '10.59',
    datSignature: 0x5434084b,
    sprSignature: 0x54340879,
    otbVersion: 0
  },
  {
    value: 1060,
    valueStr: '10.60',
    datSignature: 0x5448d9c7,
    sprSignature: 0x5448da10,
    otbVersion: 0
  },
  {
    value: 1061,
    valueStr: '10.61',
    datSignature: 0x5448d9c7,
    sprSignature: 0x5448da10,
    otbVersion: 0
  },
  {
    value: 1062,
    valueStr: '10.62',
    datSignature: 0x54622638,
    sprSignature: 0x54622667,
    otbVersion: 0
  },
  {
    value: 1063,
    valueStr: '10.63',
    datSignature: 0x546b502a,
    sprSignature: 0x546b505e,
    otbVersion: 0
  },
  {
    value: 1064,
    valueStr: '10.64',
    datSignature: 0x547f05be,
    sprSignature: 0x547f0632,
    otbVersion: 0
  },
  {
    value: 1070,
    valueStr: '10.70',
    datSignature: 0x5481bb97,
    sprSignature: 0x5481bc06,
    otbVersion: 0
  },
  { value: 1071, valueStr: '10.71', datSignature: 0x334f, sprSignature: 0x548e9efe, otbVersion: 0 },
  { value: 1072, valueStr: '10.72', datSignature: 0x3729, sprSignature: 0x54b37b99, otbVersion: 0 },
  { value: 1073, valueStr: '10.73', datSignature: 0x374d, sprSignature: 0x54bc95ae, otbVersion: 0 },
  { value: 1074, valueStr: '10.74', datSignature: 0x375e, sprSignature: 0x54c5fab2, otbVersion: 0 },
  { value: 1075, valueStr: '10.75', datSignature: 0x3775, sprSignature: 0x54d85085, otbVersion: 0 },
  { value: 1076, valueStr: '10.76', datSignature: 0x37df, sprSignature: 0x54f03ce9, otbVersion: 0 },
  { value: 1077, valueStr: '10.77', datSignature: 0x38de, sprSignature: 0x5525213d, otbVersion: 0 },
  { value: 1090, valueStr: '10.90', datSignature: 0x3f26, sprSignature: 0x565ee171, otbVersion: 0 },
  { value: 1091, valueStr: '10.91', datSignature: 0x3f81, sprSignature: 0x56bc8198, otbVersion: 0 },
  { value: 1092, valueStr: '10.92', datSignature: 0x4086, sprSignature: 0x570742b8, otbVersion: 0 },
  {
    value: 1093,
    valueStr: '10.93 test',
    datSignature: 0x40ff,
    sprSignature: 0x57161dea,
    otbVersion: 0
  },
  { value: 1093, valueStr: '10.93', datSignature: 0x413f, sprSignature: 0x5726e657, otbVersion: 0 },
  { value: 1094, valueStr: '10.94', datSignature: 0x41e5, sprSignature: 0x57459d43, otbVersion: 0 },
  { value: 1095, valueStr: '10.95', datSignature: 0x41f3, sprSignature: 0x575a84bd, otbVersion: 0 },
  { value: 1098, valueStr: '10.98', datSignature: 0x42a3, sprSignature: 0x57bbd603, otbVersion: 0 },
  { value: 1099, valueStr: '10.99', datSignature: 0x4347, sprSignature: 0x57ff106b, otbVersion: 0 },
  { value: 1310, valueStr: '13.10', datSignature: 0x4a10, sprSignature: 0x59e48e02, otbVersion: 0 }
]

/** Find a version by DAT signature. */
export function findVersionByDatSignature(datSignature: number): Version | undefined {
  return VERSIONS.find((v) => v.datSignature === datSignature)
}

/** Find a version by SPR signature. */
export function findVersionBySprSignature(sprSignature: number): Version | undefined {
  return VERSIONS.find((v) => v.sprSignature === sprSignature)
}

/** Find a version by both DAT and SPR signatures. */
export function findVersionBySignatures(
  datSignature: number,
  sprSignature: number
): Version | undefined {
  return VERSIONS.find((v) => v.datSignature === datSignature && v.sprSignature === sprSignature)
}
