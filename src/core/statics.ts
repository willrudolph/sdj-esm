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
  SD_IDX ="sdIndex",
  RESTRICT_WORDS = ["$id", "sdItems", SD_IDX, GRAPH_ID],
  DATAJI_WORDS = ["sdId", "sdKey", "sdChildren", "sdInfo"],
  SYS_RESERVED = [...RESTRICT_WORDS, ...DATAJI_WORDS],
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
  ],
  MIN_NAME_CHAR = 3,
  MIN_INFO_DATE = 1693709655818,
  MAX_OBJ_ARY_LEN = 200;
