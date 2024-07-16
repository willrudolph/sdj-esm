/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {type CoreSD, type DataJI, type DataJIValues, SdjLimiterGroup} from "./interfaces.js";
import {DATAJI_WORDS, RESTRICT_WORDS} from "./statics.js";
import type {ESDJ_LIMIT} from "./enums.js";
import {each, has, isNull, isNumber, isString, isUndefined} from "lodash-es";
import {getValidNumberFunc, validSDKey} from "./sdj-types.js";

export const restrictDataJIKeys = (dataJI: DataJI) => {
  let rtnVal = true;

  each(dataJI, (value: DataJIValues, key: string) => {
    if (RESTRICT_WORDS.indexOf(key) !== -1) {
      throw new Error(`[SDJ] key: '${key}' in dataJI '${dataJI.sdKey}' is restricted for system use;`);
    }
    if (DATAJI_WORDS.indexOf(key) === -1) {
      if (!validSDKey(key) || isUndefined(value) || isNull(value)) {
        throw new Error(`[SDJ] key: '${key}' in dataJI '${dataJI.sdKey}' contains bad characters/value;`);
      }
    }
  });

  return rtnVal;
};



export const restrictToAllowedKeys = (verifyId: string, goodKeys: string[], jsObj: {}) => {
  let otherKeys: string[] = [];
  each(jsObj, (_value, key) => {
    if (goodKeys.indexOf(key) === -1) {
      otherKeys.push(key);
    }
  });
  if (otherKeys.length > 0) {
    throw new Error(`[SDJ] '${verifyId}' has unknown keys:'${otherKeys.join(",")}';`);
  }
};

export const restrictCoreSD = (dataJI: CoreSD): boolean => {
  const hasKey = has(dataJI, "sdKey") && isString(dataJI.sdKey),
    hasId = has(dataJI, "sdId") && isNumber(dataJI.sdId),
    keyValid = (hasKey) ? validSDKey(dataJI.sdKey) : false,
    entityValid: boolean = (hasId) ? <boolean>(getValidNumberFunc("int", true)(dataJI.sdId)) : false;
  if (!hasKey) {
    throw new Error("[SDJ] CoreSD: missing/incorrect sdKey;");
  }
  if (!hasId) {
    throw new Error("[SDJ] CoreSD: missing/incorrect sdId;");
  }

  if (hasKey && !keyValid) {
    throw new Error(`[SDJ] sdKey invalid string regex '${dataJI.sdKey}';`);
  }

  if (hasId && !entityValid) {
    throw new Error(`[SDJ]: sdId @ '${dataJI.sdKey}' is not integer: but is ${typeof dataJI.sdId};`);
  }

  return hasKey && keyValid && hasId && entityValid;
};

export const restrictLimiter = (inLimStr: ESDJ_LIMIT): boolean => SdjLimiterGroup.indexOf(inLimStr) !== -1;
