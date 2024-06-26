/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, EntityJI, JIValue, SdjLimiter, SdKeyProps} from "../core/interfaces.js";
import {GRAPH_ID, RESERVED_WORDS} from "../core/statics.js";
import {genSdKeyProps} from "../util/immutables.js";

import {isArrayWithLen, validIntArray, validSDKey} from "../core/validators.js";
import {restrictCoreSD, restrictLimiter, restrictToAllowedKeys} from "../core/restrict.js";
import {
    clone,
    cloneDeep,
    each,
    isBoolean,
    isEmpty,
    isFunction,
    isNull,
    isNumber,
    isObject,
    isString,
    isUndefined,
    uniq
} from "../util/std.funcs.js";

import {ESDJ_CLASS, ESDJ_LIMIT} from "../core/enums.js";
import type {IDescriptionSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";

/*
  Entities provide the connective information between the data represented
  in the SDJ.

  sdItems*    Items that are assigned to entity, unique pos-int values only
  extendIds*  Entities extended by current entity
  parentIds*  Entities that are allowed to contain current entity
  childIds*   Entities that are allowed to be children of current entity
  limiter     4 Avail: (ESDJ_LIMIT)
                .REQ      Entity is required by parent
                .REQ_HIDE Entity is required by parent hidden from user (for only one entity)
                .ONE_NONE Entity is singular on parent or not-present
                .REQ_ONE  At least one Entity is required by parent
                .KEY_IDX  Child Entities of singular type
  sdProps     Optional properties for entities and used by lexicons or manually

  *All pos-int number[] are uniq'd and sorted before operations

  Extending Rules -
  - sdProps/limiter and all number[] are considered static during runtime and should be re-validated if changed
  - auto-inherent all sdItems from lower entities, auto-remove duplicate items
  - Does not affect childIds or parentIds, which are unique per Entity
  - sdProps are chained assigned based on entity/order - genJI sdProps will show final values
  - limiter value matches last extended item if not provided

 */
export class SdjEntity implements CoreSD, IEntitySdj {
  sdId: number;
  sdKey: string;

  parentIds: number[];
  sdItems: number[];

  extendIds?: number[];
  childIds?: number[];
  sdProps?: SdKeyProps;
  limiter: SdjLimiter;

  private _description?: IDescriptionSdj;

  constructor(inEnt: EntityJI, description: IDescriptionSdj | undefined) {
    this.description = description;
    if (this._description) {
      this._description.host.checkClassInst(inEnt, ESDJ_CLASS.ENTITY, false);
    }
    SdjEntity.VerifyJI(inEnt);
    this.graphZeroLockout(inEnt);
    this.sdId = inEnt.sdId;
    this.sdKey = inEnt.sdKey;
    if (isArrayWithLen(inEnt.extendIds)) {
      this.extendIds = uniq([...<number[]>inEnt.extendIds]);
    }
    if (isArrayWithLen(inEnt.parentIds)) {
      this.parentIds = uniq([...<number[]>inEnt.parentIds]);
    } else {
      this.parentIds = [0];
    }
    if (isArrayWithLen(inEnt.childIds)) {
      this.childIds = uniq([...<number[]>inEnt.childIds]);
    }
    if (isArrayWithLen(inEnt.sdItems)) {
      const inEntItems =[...<number[]>inEnt.sdItems];
      this.sdItems = uniq([0, 1].concat(inEntItems));
    } else {
      this.sdItems = [0, 1];
    }

    if (inEnt.sdProps) {
      this.sdProps = genSdKeyProps(inEnt.sdProps);
    }
    this.limiter = inEnt.limiter || ESDJ_LIMIT.NONE;
  }

  get description(): IDescriptionSdj {
    if (!this._description) {
      throw new ReferenceError("[SDJ] Entity has no description;");
    }
    return this._description;
  }

  set description(inDesc: IDescriptionSdj | undefined) {
    if (!isNull(inDesc) && !isUndefined(inDesc)) {
      if (!this._description) {
        if (inDesc.host?.checkClassInst && isFunction(inDesc.host.checkClassInst)) {
          inDesc.host.checkClassInst(inDesc, ESDJ_CLASS.DESCRIPTION, true);
          this._description = inDesc;
        } else {
          throw new Error("[SDJ] Incorrect or missing description/host;");
        }
      } else {
        throw new Error("[SDJ] an Entity item is prevented from having its description overwritten");
      }
    }
  }

  getItemRefs(): IItemSdj[] {
    let extendsList = (this.extendIds) ? clone(this.extendIds) : [],
      fullItemList: number[] = cloneDeep(this.sdItems),
      getEnts = (entRef: IEntitySdj) => {
        let rtnSdItems = cloneDeep(entRef.sdItems);
        if (entRef.extendIds && isArrayWithLen(entRef.extendIds)) {
          if (entRef.extendIds.indexOf(this.sdId) !== -1) {
            throw new Error(`[SDJ] Entity '${this.sdId}' can't extend itself via other entity;`);
          }
          each(entRef.extendIds, (num: number) => {
            const subEntRef = this.description.getEntityRefs([num])[0];
            if (subEntRef) {
              rtnSdItems = rtnSdItems.concat(getEnts(subEntRef));
            }
          });
        }
        return rtnSdItems;
      };

    each(extendsList, (entNum: number) => {
      const topExtendRef = this.description.getEntityRefs([entNum])[0];
      if (topExtendRef) {
        fullItemList = fullItemList.concat(getEnts(topExtendRef));
      }
    });

    fullItemList = uniq(fullItemList.sort());
    return this.description.getItemRefs(fullItemList);
  }

  genJI(): EntityJI {
    const rtnEntJI: EntityJI = {
      sdId: this.sdId,
      sdKey: this.sdKey,
    };

    // parents will always be at least [0] and should only be eliminated when === [0]
    if (this.parentIds.length > 1 || this.parentIds[0] !== 0) {
      rtnEntJI.parentIds = [...this.parentIds];
    }
    each(this.sdItems, (itemId: number) => {
      if (itemId !== 0 && itemId !== 1) {
        if (!rtnEntJI.sdItems) {
          rtnEntJI.sdItems = [];
        }
        rtnEntJI.sdItems.push(itemId);
      }
    });

    if (isArrayWithLen(this.extendIds)) {
      rtnEntJI.extendIds = [...<number[]>this.extendIds];
    }
    if (isArrayWithLen(this.childIds)) {
      rtnEntJI.childIds = [...<number[]>this.childIds];
    }

    if (this.sdProps) {
      const rtnProps: SdKeyProps | undefined = this.description.getEntityProps(this);

      if (!isEmpty(rtnProps)) {
        rtnEntJI.sdProps = <SdKeyProps>rtnProps;
      }
    }

    if (this.limiter !== ESDJ_LIMIT.NONE) {
      rtnEntJI.limiter = this.limiter;
    }

    return rtnEntJI;
  }

  private graphZeroLockout(inEnt: EntityJI) {
    if (inEnt.sdId === 0 || inEnt.sdKey === GRAPH_ID) {
      if (this._description) {
        // throw nothing for now
      } else {
        throw new Error("[SDJ] Entity 0 is reserved for system requires SdjDescription to build;");
      }
    }
  }

  static VerifyJI(inEnt: EntityJI) {
    restrictCoreSD(inEnt);
    if ((inEnt.sdId === 0 && inEnt?.sdKey !== GRAPH_ID) || inEnt.sdId < 0) {
      throw new Error(`[SDJ] Entity: '${inEnt.sdKey}' jixId: ${inEnt.sdId} <= 0;`);
    } else if (inEnt.sdId === 0 && inEnt.sdKey === GRAPH_ID) {
      return;
    }

    if (isArrayWithLen(inEnt.childIds)) {
      if (!validIntArray(inEnt.childIds)) {
        throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid childIds array;`);
      } else if (inEnt.childIds && inEnt.childIds.indexOf(0) !== -1) {
        throw new Error(`[SDJ] Entity: '${inEnt.sdKey}' GraphZero[0] is not allowed to be a child of an entity;`);
      }
    }
    if (isArrayWithLen(inEnt.extendIds)) {
      if (!validIntArray(inEnt.extendIds)) {
        throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid extendIds array;`);
      } else if (inEnt.extendIds && inEnt.extendIds.indexOf(0) !== -1) {
        throw new Error(`[SDJ] Entity '${inEnt.sdKey}' cannot extend graphZero [0];`);
      } else if (inEnt.extendIds && inEnt.extendIds.indexOf(inEnt.sdId) !== -1) {
        throw new Error(`[SDJ] Entity: '${inEnt.sdKey}' cannot extend itself;`);
      }
    }

    if (isArrayWithLen(inEnt.parentIds) && !validIntArray(inEnt.parentIds)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid parentIds array;`);
    }

    if (isArrayWithLen(inEnt.sdItems) && !validIntArray(inEnt.sdItems)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid itemIds array;`);
    } else if (!inEnt.sdItems && !inEnt.extendIds && !inEnt.childIds) {
      throw new Error(`[SDJ] Entity '${inEnt.sdKey}' has no items, does not extend, & has no children;`);
    }

    if (inEnt.sdProps && !isObject(inEnt.sdProps)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid keyValues;`);
    } else if (inEnt.sdProps) {
      each(inEnt.sdProps, (jValue: JIValue, key: string) => {
        if (RESERVED_WORDS.indexOf(key) !== -1 || !validSDKey(key)) {
          throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' has an illegal keyName: ${key};`);
        } else if (!(isString(jValue) || isNumber(jValue) || isBoolean(jValue))) {
          throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' key '${key}' has illegal value, not string|number|boolean;`);
        }
      });
    }
    if (inEnt.limiter && !restrictLimiter(inEnt.limiter)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' has unrecognized limiter;`);
    }
    restrictToAllowedKeys("EntityJI: "+ inEnt.sdKey,
      ["sdKey", "sdId", "sdItems", "extendIds", "parentIds", "childIds", "limiter", "sdProps"], inEnt);
  }
}
