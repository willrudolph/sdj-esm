/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const ESDJ_CLASS = <const>{
  DATA: "SdjData",
  ENTITY: "SdjEntity",
  DESCRIPTION: "SdjDescription",
  ITEM: "SdjItem",
  JSON: "SdJson",
  HOST: "SdjHost"
};

export declare type ESDJ_CLASS = typeof ESDJ_CLASS[keyof typeof ESDJ_CLASS];

// Note this list must correspond and match with the IntSdjTypes + SdjValidTypes found in validators.ts / lexicons.ts
// Defer to NOT changing these lists, if something is needed / missing -> ADD via custom lexicon validators
export const ESDJ_TYPE = <const>{
  KEY: "sdkey",
  ID: "sdid",
  NUM: "numb",
  INT: "intg",
  FLT: "flpt",
  BOOL: "bool",
  STR: "strd",
  STRL: "strl",
  STRS: "strs",
  UTC: "date",
  ARY_BOOL: "arybool",
  ARY_NUM: "arynum",
  ARY_STR_SH: "arystrs",
  ART_STR_DF: "arystrd",
  OBJ_STR: "objstr",
  OBJ_BOOL: "objbool",
  OBJ_NUM: "objnum",
  INDEX: "sdindex"
};

export declare type ESDJ_TYPE = typeof ESDJ_TYPE[keyof typeof ESDJ_TYPE];
export const ESDJ_LOG = <const>{
  PROD: "prod", // 0:0:0
  DEV: "dev", // 5:5:0
  LIB: "lib", // 5:3:20
  RUN: "run", // 0:0:20
  TEST: "test" // ?:?:?
};

export declare type ESDJ_LOG = typeof ESDJ_LOG[keyof typeof ESDJ_LOG];

export const ESDJ_LIMIT = <const>{
  NONE: "none",
  REQ: "req",                 // Required Item or Entity
  REQ_HIDE: "req_user_hide",  // Required Item or Entity(multiple of Entity cannot be hidden), hide option
  SYS_REQ: "sdj_sys",         // Used only by sdKey, sdId // TODO: Check/confirm
  KEY_IDX: "sdj_index",       // Entity subChildren have maintained index, and named key
  ONE_NONE: "one_none",       // Entity, only one or none
  REQ_ONE: "at_least_one",    // Entity, require at least one
};

export const ESDJ_LIMIT_REQ: ESDJ_LIMIT[] = [
    ESDJ_LIMIT.REQ,
    ESDJ_LIMIT.SYS_REQ,
    ESDJ_LIMIT.REQ_HIDE
];

export declare type ESDJ_LIMIT = typeof ESDJ_LIMIT[keyof typeof ESDJ_LIMIT];


