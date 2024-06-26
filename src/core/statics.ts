/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {EntityJI, ItemJI} from "./interfaces.js";
import {ESDJ_LIMIT} from "./enums.js";

export const DEF_DESC = "def_desc",
  DEF_JSON = "sdj_file",
  DEF_MAX_STR_LEN = 64,
  STR_LEN_LNG = 300,
  STR_LEN_SHRT = 32,
  SDJ_SCHEMA: string[] = ["http://willrudolph.com/schemas/sdj-schema.json",
    "../node_modules/sdj/json/sdj-schema",
    "./node_modules/sdj/json/sdj-schema",
    "../src/schemas/sdj-schema.json",
    "./src/schemas/sdj-schema.json"],
  GRAPH_ID = "sdGraphZero",
  RESERVED_WORDS = ["sdId", "sdKey", "sdChildren", "sdInfo", "$id", "sdItems"],

  GRAPH_ZERO: EntityJI = {
    sdId: 0,
    sdKey: GRAPH_ID,
    extendIds: [],
    parentIds: [-1],
    childIds: [],
    sdItems:[],
    limiter: ESDJ_LIMIT.SYS_REQ
  },
  BASE_ITEMS_JI: ItemJI[] = [
    {
      sdId: 0,
      sdKey: "sdId",
      limiter: ESDJ_LIMIT.SYS_REQ,
      type: "sdid"
    },
    {
      sdId: 1,
      sdKey: "sdKey",
      limiter: ESDJ_LIMIT.SYS_REQ,
      type: "sdkey"
    }
  ];



/*
export const SD_ITEM_TYPES = [
  ItemType.BOL, ItemType.NUM, ItemType.NUM_INT, ItemType.NUM_FLOAT,
  ItemType.STR, ItemType.STR_SHRT, ItemType.STR_LNG,
  ItemType.DATE, ItemType.ARY_STR, ItemType.ARY_NUM,
  ItemType.ARY_BOL, ItemType.OBJ_KEY_STR,
  ItemType.OBJ_KEY_NUM, ItemType.OBJ_KEY_BOL
];
*/

/*
export const ITEM_VALID_FUNC = [
  validBoolean, getValidNumberFunc(), getValidNumberFunc("int"), getValidNumberFunc("float"),
  getStrValidLenFunc(DEF_MAX_STR_LEN), getStrValidLenFunc(STR_LEN_SHRT), getStrValidLenFunc(STR_LEN_LNG),
  validUtcDate, getValidObjFunc("array", "string"), getValidObjFunc("array", "number"),
  getValidObjFunc("array", "boolean"), getValidObjFunc("object", "string"),
  getValidObjFunc("object", "number"), getValidObjFunc("object", "boolean")
];
*/


