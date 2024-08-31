/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, DataJI, EntityJI, GenKeyStore, JIValue, NumKeyStore, SdKeyProps} from "../core/interfaces.js";
import {ESDJ_CLASS, ESDJ_LIMIT, GRAPH_ID, SYS_RESERVED} from "../core/statics.js";
import {genSdKeyProps} from "../util/immutables.js";

import {isArrayWithLen} from "../core/validators.js";
import {restrictCoreSD, restrictLimiter, restrictToAllowedKeys} from "../core/restrict.js";
import type {IDescriptionSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";
import {
  each,
  isBoolean,
  isEmpty,
  isEqual,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isString,
  isUndefined,
  uniq
} from "lodash-es";
import {validIntArray, validSDKey} from "../core/sdj-types.js";
import type {numArrayOrUnDef} from "../core/internal.js";


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
  dataInfo    Boolean switch for if Entity stores creation/modification information (sdInfo object)

  *All pos-int number[] are uniq'd and sorted before operations

  Extending Rules -
  - sdProps/limiter and all number[] are considered static during runtime and should be re-validated if changed
  - auto-inherent all sdItems from lower entities, auto-remove duplicate items
  - Does not affect childIds or parentIds, which are unique per Entity
  - sdProps are chained assigned based on entity/order - genJI sdProps will show final values
  - limiter value matches last extended item if not provided

  Note: in Sdj "$" functions for deliberate class-only implementations which don't appear on IEntitySdj
  and should only be used by classes/files that implement "new SdjEntity" in any way.

 */
export class SdjEntity implements CoreSD, IEntitySdj {
  private _sdId: number;
  private _sdKey: string;

  private _parentIds: number[];
  private _sdItems: number[];

  private _extendIds: number[] | undefined;
  private _childIds: number[] | undefined;
  private _dataInfo: boolean | undefined;

  private _limiter: ESDJ_LIMIT;

  private _sdProps: SdKeyProps | undefined;

  private _description: IDescriptionSdj | undefined;
  private _childRefs?: NumKeyStore<IEntitySdj>;
  private _itemRefs?: GenKeyStore<IItemSdj>;

  constructor(inEnt: EntityJI, description?: IDescriptionSdj | undefined) {
    this._description = this.confirmDescript(description);
    if (this._description) {
      this._description.host.checkClassInst(inEnt, ESDJ_CLASS.ENTITY, false);
    }
    SdjEntity.VerifyJI(inEnt);
    this.graphZeroLockout(inEnt);
    this._sdId = inEnt.sdId;
    this._sdKey = inEnt.sdKey;
    if (isArrayWithLen(inEnt.extendIds)) {
      this._extendIds = uniq([...<number[]>inEnt.extendIds]);
    }
    if (isArrayWithLen(inEnt.parentIds)) {
      this._parentIds = uniq([...<number[]>inEnt.parentIds]);
    } else {
      this._parentIds = [0];
    }
    if (isArrayWithLen(inEnt.childIds)) {
      this._childIds = uniq([...<number[]>inEnt.childIds]);
    }
    if (isArrayWithLen(inEnt.sdItems)) {
      const inEntItems =[...<number[]>inEnt.sdItems];
      this._sdItems = uniq([0, 1].concat(inEntItems));
    } else {
      this._sdItems = [0, 1];
    }
    if (inEnt.dataInfo) {
      this._dataInfo = inEnt.dataInfo;
    }

    if (inEnt.sdProps) {
      this._sdProps = genSdKeyProps(inEnt.sdProps);
    }
    this._limiter = inEnt.limiter || ESDJ_LIMIT.NONE;
  }

  get sdKey() {
    return this._sdKey;
  }
  get sdId() {
    return this._sdId;
  }
  get parentIds(): number[] {
    return this._parentIds;
  }

  get sdItems(): number[] {
    return this._sdItems;
  }

  get extendIds(): number[] | undefined {
    return this._extendIds;
  }

  get childIds(): number[] | undefined {
    return this._childIds;
  }
  get childRefs(): NumKeyStore<IEntitySdj> {
    return (this._childRefs) ? this._childRefs : {};
  }

  get itemRefs(): GenKeyStore<IItemSdj> {
    return (this._itemRefs) ? this._itemRefs : {};
  }

  get description(): IDescriptionSdj {
    if (!this._description) {
      throw new ReferenceError("[SDJ] Entity has no description;");
    }
    return this._description;
  }

  get sdProps(): SdKeyProps | undefined {
    return this._sdProps;
  }

  get limiter(): ESDJ_LIMIT {
    return this._limiter;
  }

  get dataInfo(): boolean | undefined{
    return this._dataInfo;
  }

  set description(inDesc: IDescriptionSdj | undefined) {
    if (!this._description) {
      this._description = this.confirmDescript(inDesc);
      if (this._description) {
        this.$refreshRefs();
      } else {
        throw new Error("[SDJ] Incorrect or missing description/host;");
      }
    } else {
      throw new Error("[SDJ] an Entity item is prevented from having its description overwritten;");
    }
  }
  validStruct(dataSdj: DataJI, parentRef: DataJI | undefined, strict = false): boolean {
    if (!this._description) {
      return false; 
    }
    return this._description.host.searchMgr.validStruct(this, dataSdj, parentRef, strict);
  }

  validData(dataSdj: DataJI, strict = false): boolean {
    if (!this._description) {
      return false; 
    }
    return this._description.host.searchMgr.validData(this, dataSdj, strict);
  }

  genJI(): EntityJI {
    const rtnEntJI: EntityJI = {
      sdId: this._sdId,
      sdKey: this._sdKey,
    };

    // parents will always be at least [0] and should only be eliminated when === [0]
    if (this._parentIds.length > 1 || this._parentIds[0] !== 0) {
      rtnEntJI.parentIds = [...this._parentIds];
    }
    each(this._sdItems, (itemId: number) => {
      if (itemId !== 0 && itemId !== 1) {
        if (!rtnEntJI.sdItems) {
          rtnEntJI.sdItems = [];
        }
        rtnEntJI.sdItems.push(itemId);
      }
    });

    if (isArrayWithLen(this._extendIds)) {
      rtnEntJI.extendIds = [...<number[]>this._extendIds];
    }
    if (isArrayWithLen(this._childIds)) {
      rtnEntJI.childIds = [...<number[]>this._childIds];
    }

    if (this.sdProps) {
      let rtnProps: SdKeyProps | undefined;
      if (this._description) {
        rtnProps = this._description.calcSdKeyProps(this);
        if (!isEmpty(rtnProps)) {
          rtnEntJI.sdProps = <SdKeyProps>rtnProps;
        }
      } else {
        rtnEntJI.sdProps = genSdKeyProps(this.sdProps);
      }
    }

    if (this._limiter !== ESDJ_LIMIT.NONE) {
      rtnEntJI.limiter = this._limiter;
    }

    return rtnEntJI;
  }

  $refreshRefs() {
    if (this._description) {
      this._itemRefs = {};
      this._childRefs = {};
      each(this._childIds, (num: number) => {
        const childRef = this._description?.getEntity(num);
        if (childRef) {
          this.childRefs[num] = childRef;
        } else {
          throw new Error("[SDJ] if this happens something else was missed presence of entity refs should be confirmed;");
        }
      });

      each(this._description.getItemsByEntity(this._sdId), (sdItem: IItemSdj) => {
        this.itemRefs[sdItem.sdKey] = sdItem;
      });
    }
  }

  private confirmDescript(inDesc: IDescriptionSdj | undefined): IDescriptionSdj | undefined {
    let rtnVal = false;
    if (!isNull(inDesc) && !isUndefined(inDesc)) {
      if (inDesc.host?.checkClassInst && isFunction(inDesc.host.checkClassInst)) {
        inDesc.host.checkClassInst(inDesc, ESDJ_CLASS.DESCRIPTION, true);
        rtnVal = true;
      } else if (!inDesc.host && isObject(inDesc)) {
        throw new Error("[SDJ] Improper Entity init attempt use IDescriptionSdj;");
      }
    }
    return (rtnVal) ? inDesc : undefined;
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
    SdjEntity.checkArrays(inEnt);

    if (inEnt.sdProps && !isObject(inEnt.sdProps)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid keyValues;`);
    } else if (inEnt.sdProps) {
      each(inEnt.sdProps, (jValue: JIValue, key: string) => {
        if (SYS_RESERVED.indexOf(key) !== -1 || !validSDKey(key)) {
          throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' has an illegal keyName: ${key};`);
        } else if (!(isString(jValue) || isNumber(jValue) || isBoolean(jValue))) {
          throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' key '${key}' has illegal value, not string|number|boolean;`);
        }
      });
    }
    if (inEnt.limiter && !restrictLimiter(inEnt.limiter)) {
      throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' has unrecognized limiter;`);
    } else if (inEnt.limiter && inEnt.limiter === ESDJ_LIMIT.KEY_IDX) {
      if (inEnt.parentIds && !isEqual(inEnt.parentIds, [0])) {
        throw new TypeError("[SDJ] sdIndexed Entities can only exist on root;");
      }
      if (!inEnt.childIds) {
        throw new TypeError("[SDJ] sdIndexed Entities are required to have children;");
      }
    }
    if (inEnt.dataInfo && !isBoolean(inEnt.dataInfo)) {
      throw new TypeError("[SDJ] Entity dataInfo value boolean only if present;");
    }

    restrictToAllowedKeys("EntityJI: "+ inEnt.sdKey,
      ["sdKey", "sdId", "sdItems", "extendIds", "parentIds", "childIds", "limiter", "sdProps", "dataInfo"], inEnt);
  }
  
  private static checkArrays(inEnt: EntityJI) {
    const nameRefs = ["childIds", "parentIds", "extendIds", "childIds", "sdItems"],
      valueRefArray: numArrayOrUnDef[] = [inEnt.childIds, inEnt.parentIds, inEnt.extendIds, inEnt.childIds, inEnt.sdItems];

    each(nameRefs, (keyId, idx) => {
      const valueRef = valueRefArray[idx];
      if (isArrayWithLen(valueRef)) {
        if (!validIntArray(valueRef)) {
          throw new TypeError(`[SDJ] Entity '${inEnt.sdKey}' invalid '${keyId}' array;`);
        } else {
          switch(keyId) {
          case "childIds":
            if (valueRef && valueRef.indexOf(0) !== -1) {
              throw new Error(`[SDJ] Entity: '${inEnt.sdKey}' GraphZero[0] is not allowed to be a child of an entity;`);
            }
            break;
          case "extendIds":
            if (valueRef && valueRef.indexOf(0) !== -1) {
              throw new Error(`[SDJ] Entity '${inEnt.sdKey}' cannot extend graphZero [0];`);
            } else if (valueRef && valueRef.indexOf(inEnt.sdId) !== -1) {
              throw new Error(`[SDJ] Entity: '${inEnt.sdKey}' cannot extend itself;`);
            }
            break;
          default:
              // no default;
          }
        }
      }
      if (keyId === "sdItems" && !inEnt.sdItems && !inEnt.extendIds && !inEnt.childIds) {
        throw new Error(`[SDJ] Entity '${inEnt.sdKey}' has no items, does not extend, & has no children;`);
      }
    });
  }
}
