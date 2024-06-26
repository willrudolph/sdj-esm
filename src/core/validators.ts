/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {FuncJsonValueValidator, Info, JIValue} from "./interfaces.js";
import {each, isArray, isBoolean, isNumber, isObject, isString, isUndefined, uniq, UUID} from "../util/std.funcs.js";
import {getRegEx} from "../util/regex.js";

import {DEF_MAX_STR_LEN} from "./statics.js";
import {ESDJ_VALID} from "./enums.js";
import type {__ANY, IntAny} from "./internal.js";


const MIN_NAME_CHAR = 3,
  MIN_INFO_DATE = 1693709655818,
  MAX_OBJ_ARY_LEN = 200;

// Fixed name of Std SDJ Items; with all common "alternate spellings" referenced that will be checked and forced
// to common/standardized (first value)
// This is to prevent libraries and individual files from ever close (or near) default SDJ Item validation/confirmation
// also checks "-" -> "_"
// This check occurs after the standard regex for validator values (regEx "typeLexName"),

export type ValidatorKey = ESDJ_VALID | string;
interface KeyRefList {
  [key: ValidatorKey]: string[];
}

// Note this list must correspond and match with the ESDJ_VALID constants + SdjValidTypes found in enums.ts / lexicons.ts
// Defer to NOT changing these lists, if something is needed / missing -> ADD via custom lexicon validators
const IntSdjTypes: KeyRefList = {
  // sdKey; force close 'name' type to use sdKey
  "sdkey": ["sd-k", "sd--key", "sd_-key", "sd-_key", "s-d-k", "s-d-key", "sd-ke"],
  // sdId; force close 'name' type to use sdId
  "sdid": ["sd-id", "sd--id", "sd-_id", "sd_-id", "sd-i", "s-d-id", "s-d_id", "s_d-id"],
  // standard JS number
  "numb": ["number"],
  // number forced/confirmed to integer
  "intg": ["intr", "integr", "integ", "integer", "num-int", "int-num", "intnum", "numint"],
  // number parsed for floating point
  "flpt": ["flop", "float", "fltpt", "num-flt", "num-float", "floatnum", "fltnum"],
  // true/false
  "bool": ["boolean", "bolean", "boolea", "boole"],
  // string default - max length 64 characters
  "strd": ["string", "stringdef", "str-def", "string-def"],
  // string large - max 1000 characters
  "strl": ["str-lg", "st-lg", "str-l", "string-lg", "string-l"],
  // string short - max length 16 characters
  "strs": ["str-sh", "st-sm", "str-sm", "str-s", "string-sm", "string-s", "string-sh"],
  // UTC date format - throws out old/bad dates
  "date": ["date-utc", "dateutc", "utcdate", "utc-date", "u-date", "date-u"],
  // Array string Short - ["alpha", "beta", "gamma",...] - each entry max string length of 16 characters
  "arystrs": ["arystrsht", "arraystr", "array-str", "ary-str-s","array-str-s"],
  // Array string Default - ["alpha..", "beta..", "gamma...", ...] - each entry max string length of 64 characters
  "arystrd": ["arystr", "ary-str", "array-def", "arystrdef", "array-str-d"],
  // Array Booleans - [true, false, true, false]
  "arybol": ["ary-bol", "arraybol", "array-bol"],
  // Array Number(JS) - [2,2,1,3,4,1...]
  "arynum": ["ary-num", "arraynum", "array-num"],
  // Obj:key Strings - {"alpha": "text1", "beta": "text2", ...}  each entry max string length of 64 characters
  "objstr": ["obj-str", "object-str", "objectstr"],
  // Obj:key Booleans - {"alpha": true, "beta": false, ...}
  "objbool": ["obj-bool", "object-bool", "objectbool", "obj-bool"],
  // Obj:key Number(JS)s - {"alpha": 1, "beta": 2, ..}
  "objnum": ["obj-num", "object-num", "objectnum", "obj-number"],
};


export interface SdjValidators {
  [key: ValidatorKey]: FuncJsonValueValidator
}

export function isJsonValue(value: IntAny): boolean {
  let rtnBool = false;
  if (isNumber(value) || isBoolean(value) || isString(rtnBool)) {
    rtnBool = true;
  } else if (isObject(value) || isArray(value)) {
    rtnBool = true;
  }
  return rtnBool;
}

export const validStrMin4: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
  Boolean(isString(checkVal) && (<string>checkVal).length > MIN_NAME_CHAR);


export const validTypeLexName = (checkVal: JIValue) => {
  const regEx = getRegEx("typeLexName");
  return isString(checkVal) ? regEx.test(<string>checkVal) : false;
};

export const validSDKey = (checkVal: JIValue) => {
  const regEx = getRegEx("sdKey");
  return isString(checkVal) ? regEx.test(<string>checkVal) : false;
};

export const validBoolean: FuncJsonValueValidator = (checkVal: JIValue): boolean => {
  let rtnValid = false;
  if (isString(checkVal)) {
    // No allowed "true"/"FALSE" as strings for uniformity and by spec.
    rtnValid = false;
  } else if (isBoolean(checkVal)) {
    rtnValid = true;
  }
  return rtnValid;
};

export const getValidNumberFunc = (preciseType: string, posOnly: boolean = false): FuncJsonValueValidator =>
  (checkVal: JIValue): boolean => {
    let rtnValid = false;
    if (isNumber(checkVal)) {
      rtnValid = true;
      switch (preciseType) {
      case "float":
        rtnValid = Number.isFinite(checkVal);
        break;
      case "int":
        rtnValid = Number.isFinite(checkVal) && Math.floor(checkVal) === checkVal;
        break;
      default:
        // 'none' is also default
      }
    }
    if (rtnValid && posOnly) {
      rtnValid = (<number>checkVal >= 0);
    }
    return rtnValid;
  };

export const getStrValidLenFunc = (maxLength: number): FuncJsonValueValidator =>
  (checkVal: JIValue): boolean => Boolean(isString(checkVal) && (<string>checkVal).length < maxLength);

export const getValidObjFunc = (objType: string, itemType: string): FuncJsonValueValidator =>
  (checkVal: JIValue): boolean => {
    let rtnValid = false,
      typeArray = ["string", "boolean", "number", "integer", "int-pos"],
      validFuncArray= [getStrValidLenFunc(DEF_MAX_STR_LEN), validBoolean, getValidNumberFunc("none"),
        getValidNumberFunc("int"), getValidNumberFunc("int", true)],
      funcIdx = typeArray.indexOf(itemType),
      activeFunc: FuncJsonValueValidator | undefined =
        (funcIdx !== -1) ? validFuncArray[typeArray.indexOf(itemType)] : undefined;

    if (typeArray.indexOf(itemType) === -1 || !activeFunc) {
      throw new Error("--- Internal Dev error resolve missing:" + itemType);
    }

    // Yes, for now we will verify each array value
    if (objType === "array" && isArray(checkVal)) {
      // Yes, for now we will verify each key value
      const len = (<IntAny[]>checkVal).length;
      if (len && len < MAX_OBJ_ARY_LEN) {
        rtnValid = true;
        each(<IntAny[]>checkVal, (idxValue: IntAny) => {
          if (activeFunc) {
            if (!activeFunc(<JIValue>idxValue)) {
              rtnValid = false;
              return false;
            }
          }
          return true;
        });
      }
    } else if (objType === "object" && isObject(checkVal)) {
      const len = Object.keys(<object>checkVal).length;
      // stupid long key names are not allowed either
      if (len && len < MAX_OBJ_ARY_LEN) {
        rtnValid = true;
        each(<object>checkVal, (value: JIValue, key: string) => {
          if (activeFunc) {
            if ((!isString(key) || (<string>key).length > DEF_MAX_STR_LEN) || !activeFunc(value)) {
              rtnValid = false;
              return false;
            }
          }
          return true;
        });
      }
    }

    return rtnValid;
  };


/*
  Description arrays [extendIds, sdItems, parentIds, childIds]
  are all limited to unique positive number arrays

  validIntArray only confirms positive integer array is present, not uniqueness
 */
export const validIntArray = (checkValue: number[] | undefined): boolean => {
  const rtnBool = (checkValue && isArray(checkValue) && checkValue.length > 0);
  return (rtnBool) ? getValidObjFunc("array", "int-pos")(<number[]>checkValue) : false;
};



// Manual validation of any JavaScript array, confirms just isArray and length
export function isArrayWithLen<Type extends Array<__ANY>>(arrayLike: Type | undefined): boolean {
  const rtnBool = (arrayLike && isArray(arrayLike));
  return (rtnBool) ? arrayLike.length > 0 : false;
}

export const validLexiconArray = (checkValue: JIValue): boolean => {
  const rtnVal = true;
  if (!getValidObjFunc("array", "string")(checkValue)) {
    return false;
  }
  const uniqArray = uniq(<[]>checkValue);
  if ((<[]>checkValue).length !== uniqArray.length) {
    return false;
  }
  return rtnVal;
};

export const validInfoDate: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
  Boolean(isNumber(checkVal) && (<number>checkVal) > MIN_INFO_DATE);

export const validUtcDate: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
  Boolean(isNumber(checkVal));

export const rtnSdjItemName = (nameStr: string): string | undefined => {
  let rtnName: string | undefined = undefined;

  each(IntSdjTypes, (keyArray: string[], keySetName: string) => {
    if (keySetName === nameStr) {
      return false;
    } else {
      each (keyArray, (strVal: string ) => {
        const underScoreCheck = strVal.replace("-", "_");
        if (strVal === nameStr || nameStr === underScoreCheck) {
          rtnName = keySetName;
          return false;
        } else {
          return true;
        }
      });
      return !!isUndefined(rtnName);
    }
  });

  return rtnName;
};

export const isInfo = (inSet: Info, compress: boolean = false): boolean => {
  const keys: string[] = ["name", "uniqId", "created", "modified"],
    verifyActs: FuncJsonValueValidator[] = [validStrMin4, UUID.Valid, validInfoDate, validInfoDate];

  if (!inSet || Object.keys(inSet).length !== keys.length) {
    return false;
  }
  if (compress) {
    verifyActs[1] = UUID.ValidData;
  }
  each(inSet, (value: JIValue | undefined, key: string) => {
    const keyIdx = keys.indexOf(key),
      verType = (keyIdx !== -1) ? verifyActs[keyIdx] : () => false,
      isValid = (verType && keyIdx !== -1 && !isUndefined(value)) ? verType(value) : false;

    if (isValid) {
      keys.splice(keyIdx, 1);
      verifyActs.splice(keyIdx, 1);
    }
  });
  return (keys.length === 0);
};

