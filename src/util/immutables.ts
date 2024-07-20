/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {UUID} from "./func.std.js";
import type {
  CoreSD,
  DataJI,
  DataJIValues,
  DescriptionJI,
  EntityJI,
  Info,
  ItemJI,
  SdKeyProps
} from "../core/interfaces.js";
import {DATAJI_WORDS, DEF_DESC} from "../core/statics.js";
import {isArrayWithLen, isInfo} from "../core/validators.js";
import {ESDJ_LIMIT} from "../core/enums.js";
import {cloneDeep, each, isBoolean, isNumber, isString, isUndefined, uniq} from "lodash-es";
import {validSDKey} from "../core/sdj-types.js";


export function newInfoJI(name: string = "", compress: boolean = false): Info {
  return {
    name,
    uniqId: (!compress) ? UUID.GetNew() : UUID.GetCompress(),
    created: Date.now(),
    modified: Date.now()
  };
}

export function blankInfoJI(name: string = "", compress: boolean = false): Info {
  return {
    name,
    uniqId: UUID.GetEmpty(compress),
    created: Date.now(),
    modified: Date.now()
  };
}

export function genSdKeyProps(inObj: SdKeyProps) {
  const rtnJI: SdKeyProps = {};
  each(inObj, (value, key) => {
    if (isString(value) || isNumber(value) || isBoolean(value)) {
      rtnJI[key] = value;
    }
  });
  return rtnJI;
}

export function genEntityJI(entityJI: EntityJI): EntityJI {
  const rtnJI: EntityJI = {
    sdId: entityJI.sdId,
    sdKey: entityJI.sdKey
  };

  if (isArrayWithLen(entityJI.extendIds)) {
    rtnJI.extendIds = <number[]>uniq([...<number[]>entityJI.extendIds]);
  }

  if (isArrayWithLen(entityJI.parentIds)) {
    rtnJI.parentIds = <number[]>uniq([...<number[]>entityJI.parentIds]);
  }

  if (isArrayWithLen(entityJI.childIds)) {
    rtnJI.childIds = <number[]>uniq([...<number[]>entityJI.childIds]);
  }

  if (isArrayWithLen(entityJI.sdItems)) {
    rtnJI.sdItems = <number[]>uniq([...<number[]>entityJI.sdItems]);
  }

  if (entityJI.sdProps) {
    rtnJI.sdProps = genSdKeyProps(entityJI.sdProps);
  }

  if (entityJI.limiter && entityJI.limiter !== ESDJ_LIMIT.NONE) {
    rtnJI.limiter = entityJI.limiter;
  }
  return rtnJI;
}

export function genItemJI(itemJI: ItemJI): ItemJI {
  const rtnJI: ItemJI = {
    sdId: itemJI.sdId,
    sdKey: itemJI.sdKey,
    type: itemJI.type
  };
  if (itemJI.limiter) {
    rtnJI.limiter = itemJI.limiter;
  }

  return rtnJI;
}
export function genInfoJI(orgInfo: Info): Info {
  return {
    name: orgInfo.name,
    uniqId: orgInfo.uniqId,
    created: orgInfo.created,
    modified: orgInfo.modified
  };
}


export function genDescriptionJI(descJI: DescriptionJI) {
  const rtnJI: DescriptionJI = {
    sdInfo: genInfoJI(descJI.sdInfo),
    items: [],
    graph: [],
  };

  if (descJI.lang) {
    rtnJI.lang = descJI.lang;
  }

  if (isArrayWithLen(descJI.lexicons)) {
    rtnJI.lexicons = [...<string[]>descJI.lexicons];
  }

  each(descJI.items, (itemJI) => {
    rtnJI.items.push(genItemJI(itemJI));
  });

  each(descJI.graph, (entityJI: EntityJI) => {
    rtnJI.graph.push(genEntityJI(entityJI));
  });

  return rtnJI;
}

export function isBlankInfo(info: Info, compress: boolean = false) {
  let rtnVal = isInfo(info);
  if (rtnVal) {
    rtnVal = (info.uniqId === UUID.GetEmpty(compress));
  }
  return rtnVal;
}


export function blankDescriptionJI(descName: string): DescriptionJI {
  const newName = (validSDKey(descName)) ? descName : DEF_DESC;
  return {
    sdInfo: blankInfoJI(newName),
    items: [],
    graph: []
  };
}

export function genKeyDataJI(orgData: DataJI): DataJI {
  const nonKeys = DATAJI_WORDS,
    rtnJI: DataJI = {
      sdId: orgData.sdId,
      sdKey: orgData.sdKey,
    };
  each(orgData, (value: DataJIValues, key: string) => {
    if (nonKeys.indexOf(key) === -1 && value && !isUndefined(value)) {
      rtnJI[key] = cloneDeep(value);
    }
  });

  return rtnJI;
}

export function genDataJI(orgData: DataJI): DataJI {
  const rtnJI: DataJI = genKeyDataJI(orgData);
  if (orgData.sdInfo) {
    rtnJI.sdInfo = genInfoJI(orgData.sdInfo);
  }
  if (orgData.sdChildren) {
    each(orgData.sdChildren, (sdData: DataJI) => {
      if (!rtnJI.sdChildren) {
        rtnJI.sdChildren = [];
      }
      rtnJI.sdChildren.push(genDataJI(sdData));
    });
  }

  return rtnJI;
}

export function genIdArray(coreArray: CoreSD[]): number[] {
  const rtnArray: number[] = [];
  each(coreArray, (coreSd: CoreSD) => {
    rtnArray.push(coreSd.sdId);
  });
  return rtnArray;
}

