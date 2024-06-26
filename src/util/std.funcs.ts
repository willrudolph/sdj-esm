/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, JIArray, JIValue} from "../core/interfaces.js";

import {default as isEqual} from "lodash-es/isEqual.js";
import {default as throttle} from "lodash-es/throttle.js";
import {default as debounce} from "lodash-es/debounce.js";
import {default as isNumber} from "lodash-es/isNumber.js";
import {default as find} from "lodash-es/find.js";
import {default as sortBy} from "lodash-es/sortBy.js";
import {default as has} from "lodash-es/has.js";
import {default as clone} from "lodash-es/clone.js";
import {default as cloneDeep} from "lodash-es/cloneDeep.js";
import {default as isEmpty} from "lodash-es/isEmpty.js";
import {default as get} from "lodash-es/get.js";
import {default as each} from "lodash-es/each.js";
import {default as findIndex} from "lodash-es/findIndex.js";
import {default as isArray} from "lodash-es/isArray.js";
import {default as map} from "lodash-es/map.js";
import {default as times} from "lodash-es/times.js";
import {default as constant} from "lodash-es/constant.js";
import {default as isNull} from "lodash-es/isNull.js";
import {default as isUndefined} from "lodash-es/isUndefined.js";
import {default as isString} from "lodash-es/isString.js";
import type {IntAny, IntObject} from "../core/internal.js";
import {getRegEx} from "./regex.js";


export {isEqual, throttle, debounce, isNumber, find, sortBy, has, clone, cloneDeep, isString,
  isEmpty, get, each, findIndex, isArray, map, times, constant, isNull, isUndefined};

// Limited Use of IntAny not exposed

declare type RawFunction = (...args: unknown[]) => unknown;


// Warning - this will throw errors on its own if not encapsulated
export function cloneJI<JIType>(inJson: JIType): JIType {
  return JSON.parse(JSON.stringify(inJson));
}
export const isFunction = (func: unknown) => typeof func === "function";
export const isObject = (item: unknown): boolean =>
  (typeof item === "object" || typeof item === "function") &&
  (item !== null && !Array.isArray(item) && !isFunction(item));

export const isBoolean = (item: unknown): boolean =>
  (item !== null && item !== undefined && (item === true || item === false));


export const hasChildren = (item: IntObject):boolean =>
  (has(item, "children") && Array.isArray(item["children"]) && item["children"].length > 0);


export const hasSdChildren = (item: IntObject): boolean =>
  (has(item, "sdChildren") && Array.isArray(item["sdChildren"]) && item["sdChildren"].length > 0);

export const pick = (object: IntObject, keys: string[]) => keys.reduce((obj: IntObject, key: string) => {
  if (object && Object.prototype.hasOwnProperty.call(object, key)) {
    obj[key] = object[key];
  }
  return obj;
}, {});


export function findCoreIds(sdCores: CoreSD[], sdId: number | number[]): CoreSD[] {
  const idxArray = isArray(sdId);
  let rtnArray: CoreSD[] = [];

  each(sdCores, (sdCoreObj: CoreSD) => {
    if (idxArray && ((<number[]>sdId).indexOf(sdCoreObj.sdId) !== -1) ) {
      rtnArray.push(sdCoreObj);
    } else if (!idxArray && sdCoreObj.sdId === <number>sdId) {
      rtnArray.push(sdCoreObj);
    }
  });

  return rtnArray;
}

export function uniq<Type extends Array<string | number>>(array: Type): Type {
  return <Type>[...new Set(array)];
}


export const uniqWith = (arr: JIArray, fn: RawFunction) => arr.filter((element: JIValue, index: number) =>
  arr.findIndex((step) => fn(element, step)) === index);

export const reject = (arr: unknown[], predicate: RawFunction) => {
  const complement = function (f: RawFunction) {
    return function (x: unknown) {
      return !f(x);
    };
  };

  return arr.filter(complement(predicate));
};

const cryptoRandom = () => {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return (<number>randomBuffer[0]) / (0xffffffff + 1);
  },

  makeUUID = (length: number): string => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      charactersLength = characters.length;

    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(cryptoRandom() * charactersLength));
      counter += 1;
    }
    return result;
  };

export class UUID {
  static GetNew(): string {
    const uuidRtn: string = makeUUID(25),
      splits: string [] = String(uuidRtn).split("");

    splits[6] = "-";
    splits[12] = "-";
    splits[17] = "-";
    return splits.join("");
  }

  static GetCompress(): string {
    const compactRtn: string = makeUUID(10),
      splits = String(compactRtn).split("");

    splits[5] = "-";
    return splits.join("");
  }

  static GetEmpty(compact: boolean = false): string {
    return (compact) ? "00000-0000" : "000000-00000-0000-0000000";
  }

  static Valid(checkVal: JIValue) {
    const regEx = getRegEx("uuid");
    return isString(checkVal) ? regEx.test(<string>checkVal) : false;
  }

  static ValidData(checkVal: JIValue) {
    const regEx = getRegEx("uuidData");
    return isString(checkVal) ? regEx.test(<string>checkVal) : false;
  }
}

export const copyNonObjects = (inputObj: IntObject): IntObject => {
  const rtnObj: IntObject = {};
  Object.entries(inputObj).forEach(([key,value]) => {
    if (!Array.isArray(value) && !isObject(value)) {
      rtnObj[key] = value;
    }
  });
  return rtnObj;
};

export const isInString = (searchItem: Array<string> | string | number, inputString: string): boolean => {
  let rtnVal = false;
  if (Array.isArray(searchItem)) {
    searchItem.forEach((item) => {
      if (inputString.indexOf(item) > -1) {
        rtnVal = true;
      }
    });
  } else if (inputString.indexOf(<string>searchItem) > -1) {
    rtnVal = true;
  }
  return rtnVal;
};

export const mutableObjUpdate = (mutableRef: IntObject, newObject: IntObject) => {
  for (const item in mutableRef) {
    delete mutableRef[item];
  }
  for (const newItem in newObject) {
    if (Object.prototype.hasOwnProperty.call(newObject, newItem)) {
      mutableRef[newItem] = newObject[newItem];
    }
  }
};

export const mutableArrayUpdate = (mutableArray: Array<IntAny>, newArray: Array<IntAny>) => {
  mutableArray.length = 0;
  newArray.forEach((item) => mutableArray.push(item));
};

