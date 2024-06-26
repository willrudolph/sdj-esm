/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, DataJI, DataJIValues, FuncJsonValueValidator, Info} from "../core/interfaces.js";
import {each, find, isUndefined, uniq, UUID} from "./std.funcs.js";

export const validObjKeys = (inArray: string[], chkObj: DataJI,
  validateFuncs: FuncJsonValueValidator[] = []): string[] | boolean => {
  let rtnErrArray: string[] = [],
    rtnBol = false;

  if (validateFuncs.length !== inArray.length && validateFuncs.length !== 0) {
    throw new Error("validObjKeys Error: invalid use, matching validate array or nothing;");
  }
  each(chkObj, (value: DataJIValues, key: string) => {
    const idx = inArray.indexOf(key),
      validate = (validateFuncs.length !== 0 && idx !== -1) ? validateFuncs[idx] : () => true,
      isValid = (validate && idx !== -1 && !isUndefined(value)) ? validate(value) : false;

    if (value && idx !== -1 && isValid) {
      inArray.splice(idx, 1);
    } else if (!value && idx === -1) {
      rtnErrArray.push(`Unknown key: ${key} with no value`);
    } else if (!value && idx !== -1) {
      rtnErrArray.push(`Found expected key: '${key}' but has no value`);
    } else if (value && idx === -1) {
      rtnErrArray.push(`Unknown key: ${key} that has unexpected value`);
    } else if (value && idx !== -1 && !isValid) {
      rtnErrArray.push(`Found Key/value but is not invalid: found ${typeof value}`);
    }
  });
  if (inArray.length === 0) {
    rtnBol = true;
  }
  return (rtnBol) ? rtnBol : rtnErrArray;
};


// For default templates, this resets the key if set to the default value above.
// The maker will create default values for "default descriptions"; which can
// be modified in the maker but unique keys will be created from anything default.
// Any saved json out of a live JS or application should attach uniq key + date values.
// Default values should only be used for default unmodified descriptions/data.

export const checkResetInfo = (inSet: Info, data: boolean = false): Info => {
  const emptyUUID = UUID.GetEmpty(data);

  if (inSet.uniqId === emptyUUID) {
    inSet.uniqId = UUID.GetNew();
    inSet.modified = Date.now();
    inSet.created = Date.now();
  }
  return inSet;
};


export const verifySequenceKeys = (coreItems: CoreSD[], isItems = false): boolean => {
  let rtnBool = true,
    checkItems = coreItems.length,
    length = coreItems.length,
    startIdx = (isItems) ? 2 : 1;

  for (let d = startIdx; d <= length; d += 1) {
    const chItem = find(coreItems, {sdId: d});
    if (!chItem) {
      rtnBool = false;
      break;
    } else {
      checkItems -= 1;
    }
  }

  if (checkItems > 0) {
    rtnBool = false;
  }

  return rtnBool;
};


export const verifyUniqKeys = (coreItems: CoreSD[] | undefined, keysOnly = false): boolean => {
  let len = (coreItems && coreItems.length > 1) ? coreItems.length : 0,
    justIds: number[] = [],
    justKeys: string[] = [],
    rtnVal = true;

  if (len > 1 && coreItems) {
    justKeys = coreItems.map((core) => core.sdKey);
    justKeys = <string[]>uniq(justKeys);
    rtnVal = (justKeys.length === coreItems.length);
    if (!keysOnly && rtnVal) {
      justIds = coreItems.map((core) => core.sdId);
      justIds = <number[]>uniq(justIds);
      rtnVal = (justIds.length === coreItems.length);
    }
  } else if (!coreItems) {
    return false;// ?
  }
  return rtnVal;
};
