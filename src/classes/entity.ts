/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, DataJI, EntityJI, GenKeyStore, JIValue, NumKeyStore, SdKeyProps} from "../core/interfaces.js";
import {GRAPH_ID, SD_IDX, SYS_RESERVED} from "../core/statics.js";
import {genSdKeyProps} from "../util/immutables.js";

import {isArrayWithLen} from "../core/validators.js";
import {restrictCoreSD, restrictLimiter, restrictToAllowedKeys} from "../core/restrict.js";

import {ESDJ_CLASS, ESDJ_LIMIT} from "../core/enums.js";
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


  Introduction of "$" functions for deliberate class-only implementations which don't appear on IEntitySdj
  and should only be used by classes/files that implement "new SdjEntity" in anyway.

 */
export class SdjEntity implements CoreSD, IEntitySdj {
  sdId: number;
  sdKey: string;

  parentIds: number[];
  sdItems: number[];

  extendIds?: number[];
  childIds?: number[];
  sdProps?: SdKeyProps;
  limiter: ESDJ_LIMIT;

  private _description: IDescriptionSdj | undefined;
  private _childRefs?: NumKeyStore<IEntitySdj>;
  private _itemRefs?: GenKeyStore<IItemSdj>;

  constructor(inEnt: EntityJI, description: IDescriptionSdj | undefined) {
    this._description = this.confirmDescript(description);
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
    let rtnVal = true,
        errorResults: string[] = this.structValidate(dataSdj, parentRef),
        splits: string[];

    each(errorResults, (errSptStr) => {
      splits = errSptStr.split(",");
      this.description.log(
          `Entity '${this.sdKey}' with data '${splits[0]}' error '${splits[1]}' with data/ent '${splits[2]}'`
          , 3);
      rtnVal = false;
    });

    if (strict && errorResults?.length > 0) {
      const singleErr = errorResults.shift();
      if (singleErr) {
        splits = singleErr.split(",");
        throw new Error(
            `[SDJ] Entity '${this.sdKey}' with data '${splits[0]}' error '${splits[1]}' with data/ent '${splits[2]}'`);
      }
    }

    return rtnVal;
  }

  validData(dataSdj: DataJI, strict = false): boolean {
    let rtnVal = true,
        errorResults: string[] = this.dataValidate(dataSdj),
        splits: string[];

    each(errorResults, (errSptStr) => {
      splits = errSptStr.split(",");
      this.description.log(
          `SdjEntity '${this.sdKey}' struct '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`
          , 3);
      rtnVal = false;
    });

    if (strict && errorResults?.length > 0) {
      const singleErr = errorResults.shift();
      if (singleErr) {
        splits = singleErr.split(",");
        throw new Error(
            `SdjData key '${this.sdKey}' validate item '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`);
      }
    }

    return rtnVal;
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

  $refreshRefs() {
    if (this._description) {
      this._itemRefs = {};
      this._childRefs = {};
      each(this.childIds, (num: number) => {
        const childRef = this._description?.getEntityRefById(num);
        if (childRef) {
          this._childRefs![num] = childRef;
        } else {
          throw new Error("[SDJ] if this happens something else was missed presence of entity refs should be confirmed;");
        }
      });

      each(this._description.getItemsByEntity(this.sdId), (sdItem: IItemSdj) => {
        this._itemRefs![sdItem.sdKey] = sdItem;
      })
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

  private structValidate(dataJI: DataJI, parentData: DataJI | undefined): string[] {
    if (!this._description) return [this.sdKey + ",description,not available"];
    let rtnErrs: string[] = [],
        childPresent: NumKeyStore<number> = {},
        parentEnt: IEntitySdj | undefined = (parentData) ? this.description.getEntityRefById(parentData.sdId)
            : undefined,
        checkIndexing: boolean = (parentEnt?.limiter === ESDJ_LIMIT.KEY_IDX)

    each(this._childRefs, (childRef) => {
      childPresent[childRef.sdId] = 0;
    });

    if (!parentData && this.parentIds.indexOf(0) === -1) {
      rtnErrs.push(this.sdKey + ",requires parent,parent undefined");
    } else if (parentEnt && this.parentIds.indexOf(parentEnt.sdId) === -1) {
      rtnErrs.push(this.sdKey + ",entity does not allow parent," + parentEnt.sdKey);
    } else if (parentEnt && (!parentEnt.childIds || parentEnt.childIds.indexOf(this.sdId) === -1)) {
      rtnErrs.push(parentEnt.sdKey + ",parent does not allow child," + this.sdKey);
    }

    each(dataJI.sdChildren, (childItem: DataJI, idx: number) => {
      const entRef = this._childRefs![childItem.sdId];
      if (this.childIds?.indexOf(childItem.sdId) === -1) {
        rtnErrs.push(this.sdKey +",doesn't allow child," + childItem.sdId);
      }
      if (entRef) {
        if (entRef.limiter !== ESDJ_LIMIT.NONE) {
          childPresent[childItem.sdId] += 1;
        }
      } else {
        rtnErrs.push(this.sdKey + ",unknown child entity," + childItem.sdKey);
      }
      if (checkIndexing && childItem.sdKey !== (SD_IDX + idx)) {
        rtnErrs.push(dataJI.sdKey + ",KEY_IDX out of order or wrong," + childItem.sdKey + "!=" + SD_IDX + idx);
      }
    });

    each(childPresent, (totals, sdId) => {
      const childEnt = this._childRefs![sdId];
      switch(childEnt!.limiter) {
        case ESDJ_LIMIT.REQ:
          if (totals === 0) {
            rtnErrs.push(this.sdKey + ",missing req'd," + childEnt!.sdKey);
          }
          break
        case ESDJ_LIMIT.REQ_HIDE:
          if (totals !== 1) {
            rtnErrs.push(this.sdKey + `,single req hidden 1 != '${totals}',` + childEnt!.sdKey);
          }
          break
        case ESDJ_LIMIT.ONE_NONE:
          if (totals > 1) {
            rtnErrs.push(this.sdKey + ",can only have one or none," + childEnt!.sdKey);
          }
          break
        case ESDJ_LIMIT.REQ_ONE:
          if (totals > 1 || totals === 0) {
            rtnErrs.push(this.sdKey + ",requires one single," + childEnt!.sdKey);
          }
          break
        default:
          // default would be NONE/SD_IDX
      }
    });

    return rtnErrs;
  }
  private dataValidate(dataJI: DataJI): string[] {
    let rtnErrStrs: string[] = [];
    each(this._itemRefs, (itemRef: IItemSdj) => {
      const key = itemRef.sdKey,
          possibleValue = dataJI[key],
          isPresent: boolean = (!isNull(possibleValue) && !isUndefined(possibleValue)),
          actualValue: JIValue = isPresent ? <JIValue>possibleValue : false,
          isRequired = (itemRef.limiter === ESDJ_LIMIT.SYS_REQ
              || itemRef.limiter === ESDJ_LIMIT.REQ || itemRef.limiter === ESDJ_LIMIT.REQ_HIDE),
          isValid = (isPresent) ? itemRef.validator.valid(actualValue) : false;

      if (isRequired && !isPresent) {
        rtnErrStrs.push(key + ",required," + itemRef.type);
      } else if (isRequired && isPresent && !isValid) {
        rtnErrStrs.push(key + ",invalid," + itemRef.type);
      } else if (!isRequired && isPresent && !isValid) {
        rtnErrStrs.push(key + ",invalid," + itemRef.type);
      }
    });
    return rtnErrStrs;
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
        throw new TypeError("[SDJ] sdIndexed Entities are required to have children;")
      }
    }
    restrictToAllowedKeys("EntityJI: "+ inEnt.sdKey,
      ["sdKey", "sdId", "sdItems", "extendIds", "parentIds", "childIds", "limiter", "sdProps"], inEnt);
  }
}
