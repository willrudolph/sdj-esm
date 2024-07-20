/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {each, has, isArray, isObject, isString} from "lodash-es";
import type {CoreSD, JIArray, JIValue} from "../core/interfaces.js";
import type {IntAny, IntObject, RawFunction} from "../core/internal.js";
import {getRegEx} from "./regex.js";


// Warning - this will throw errors on its own if not encapsulated
export function cloneJI<JIType>(inJson: JIType): JIType {
  return JSON.parse(JSON.stringify(inJson));
}

export const hasSdChildren = (item: IntObject): boolean =>
  (has(item, "sdChildren") && Array.isArray(item["sdChildren"]) && item["sdChildren"].length > 0);



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


export const getFromCoreArray = (idOrKey: number | string, coreArray: CoreSD[]): CoreSD | undefined => {
  let entId = isString(idOrKey) ? getIdFromKey(<string>idOrKey, coreArray) : idOrKey;
  return (entId) ? coreArray[entId] : undefined;
};

export const getKeyFromId = (sdId: number, coreArray: CoreSD[]): string | undefined => {
  let rtnVal: string | undefined;
  for (let i = 0; i < coreArray.length; i += 1) {
    if (coreArray[i]!.sdId === sdId) {
      rtnVal = coreArray[i]!.sdKey;
      break;
    }
  }
  return rtnVal;
};


export const getIdFromKey = (sdKey: string, coreArray: CoreSD[]): number | undefined => {
  let rtnVal: number | undefined;
  for (let i = 0; i < coreArray.length; i += 1) {
    if (coreArray[i]!.sdKey === sdKey) {
      rtnVal = coreArray[i]!.sdId;
      break;
    }
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

export const validTypeLexName = (checkVal: JIValue) => {
  const regEx = getRegEx("typeLexName");
  return isString(checkVal) ? regEx.test(<string>checkVal) : false;
};
