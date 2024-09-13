/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, DataJI, DataKeyValue, ExtAllowedValue, Info} from "../core/interfaces.js";
import {genInfoJI, genKeyDataJI, newInfoJI} from "../util/immutables.js";

import {verifyUniqKeys} from "../util/verify.js";
import {restrictCoreSD, restrictDataJIKeys} from "../core/restrict.js";
import {ESDJ_CLASS, ESDJ_LIMIT, ESDJ_LIMIT_REQ} from "../core/statics.js";
import {isInfo} from "../core/validators.js";
import type {IDataSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";
import {each, find, isArray, isFunction, isNull, isNumber, isObject, isString, isUndefined} from "lodash-es";
import {cloneJI, getFromCoreArray} from "../util/func.std.js";
import {validSDKey} from "../core/sdj-types.js";

/*
  SdjData / DataJI

  Via an entity object; data objects are the primary malleable data node of the SdJson structure.
  It is a combination of a node-tree structure and simple data/entity store validation



 */

export class SdjData implements CoreSD, IDataSdj {
  $sdIndex = 0;
  private _sdId: number; // corresponds to assigned entityRef sdId
  private _sdKey: string; // data path id
  private _depth: number = 0;
  private _sdInfo?: Info;

  // eslint-disable-next-line no-use-before-define
  private _parentRef: SdjData | undefined;
  // eslint-disable-next-line no-use-before-define
  private _sdChildren: SdjData[] | undefined;

  private _data: DataJI; // internal mutable central reference
  private _entity: IEntitySdj;

  constructor(inData: DataJI, entityRef: IEntitySdj, parentRef?: SdjData | undefined) {
    this._entity = this.confirmEntity(entityRef, inData);
    this._entity.description.host.checkClassInst(inData, ESDJ_CLASS.DATA, false);
    const workData = cloneJI(inData);
    SdjData.VerifyJI(workData);
    if (workData.sdInfo && isInfo(workData.sdInfo, true)) {
      this._sdInfo = genInfoJI(workData.sdInfo);
    } else if ((!workData.sdInfo || !isInfo(workData.sdInfo, true)) && this._entity.dataInfo) {
      this._sdInfo = newInfoJI(workData.sdKey, true);
    }
    this._data = genKeyDataJI(workData);
    this._entity.validData(this._data, true);
    this._sdId = this._data.sdId;
    this._sdKey = this._data.sdKey;
    this.$parentRef = parentRef;
  }

  get sdKey() {
    return this._sdKey;
  }

  get sdId() {
    return this._sdId;
  }
  get data() {
    return this._data;
  }

  get entity(): IEntitySdj {
    return this._entity;
  }

  get path(): string {
    let rtnStr = this._sdKey,
      parentRef: SdjData | undefined = <SdjData>this._parentRef;
    if (parentRef) {
      while(parentRef) {
        rtnStr = parentRef.sdKey + "/" + rtnStr;
        parentRef = parentRef.$parentRef;
      }
    }
    return rtnStr;
  }
  get depth() {
    return this._depth;
  }
  set $depth(value: number) {
    this._depth = value;
  }

  get $depth() {
    return this._depth;
  }
  get parentRef(): IDataSdj | undefined {
    return (this._parentRef) ? <IDataSdj>this._parentRef : undefined;
  }
  get $parentRef(): SdjData | undefined {
    return (this._parentRef) ? <SdjData>this._parentRef : undefined;
  }
  set $parentRef(inParent: SdjData | undefined) {
    if (this._entity) {
      if (inParent) {
        // allows reassignment for now?
        this._entity.description.host.checkClassInst(<IDataSdj>inParent, ESDJ_CLASS.DATA, true);
        this._parentRef = inParent;
        this._depth = inParent.depth + 1;
      } else {
        // allows assignment with entity but no parent
      }
    } else {
      throw new Error("[SDJ] Cannot assign a data parent without an entity;");
    }
  }

  get sdChildren(): IDataSdj[] | undefined {
    return this._sdChildren;
  }

  get $sdChildren(): SdjData[] | undefined {
    return this._sdChildren;
  }

  get hasChildren(): boolean {
    return Boolean(this._sdChildren && this._sdChildren?.length > 0);
  }

  // Update validates data on input and if in-valid the whole update
  // fails and reports false for update
  update(dataJI: DataJI): boolean {
    let rtnVal = false;
    // TODO update function
    each(dataJI, (value, key) => {
      // eslint-disable-next-line no-console
      console.log(`${key}:${value}`);
    });
    return rtnVal;
  }
  setDataKey(dataKey: string, value: ExtAllowedValue) {
    let itemRef: IItemSdj | undefined = this._entity.itemRefs[dataKey],
      changed = false,
      inValue: DataKeyValue;
    if (itemRef) {
      inValue = itemRef.validator.input(value);
      if (isUndefined(inValue)) {
        if (ESDJ_LIMIT_REQ.indexOf(<ESDJ_LIMIT>itemRef.limiter) !== -1) {
          throw new Error(`[SDJ] item '${itemRef.sdKey}' is required cannot be set to undefined;`);
        }
        delete this._data[dataKey];
        changed = true;
      } else if (itemRef.validator.valid(inValue)){
        this._data[dataKey] = inValue;
        changed = true;
      } else {
        throw new Error(`[SDJ] item '${itemRef.sdKey}' does not validate on input;`);
      }
      if (changed && this._parentRef && !this._entity.dataInfo) {
        this._parentRef.$modifySdInfo();
      }
    }
  }

  getDataKey(dataKey: string): ExtAllowedValue {
    const itemRef: IItemSdj | undefined = this._entity.itemRefs[dataKey];
    if (itemRef?.validator.output) {
      return itemRef.validator.output(this._data[dataKey]);
    } else {
      return this._data[dataKey];
    }
  }

  $addChild(sdData: SdjData) {
    let curIdx = -1;
    if (this._entity.childIds?.indexOf(sdData.sdId) !== -1) {
      if (find(this._sdChildren, {sdKey: sdData.sdKey})) {
        throw new Error(`[SDJ} Unable to add child with identical sdKey:'${sdData.sdKey}'`);
      }
      if (!this._sdChildren) {
        this._sdChildren = [];
        curIdx = 0;
      } else {
        curIdx = this._sdChildren.length + 1;
      }
      sdData.$parentRef = this;
      (<SdjData>sdData).$sdIndex = curIdx;
      this._sdChildren.push(sdData);
    }
  }

  $removeChild(childRef: string | number): IDataSdj | undefined {
    return (!this._sdChildren) ? undefined : this.getChild(childRef);
    // TODO: Remove child routines?
  }

  $modifySdInfo() {
    if (this._entity.dataInfo && this._sdInfo) {
      this._sdInfo.modified = Date.now();
    }
    if (this._parentRef) {
      this._parentRef.$modifySdInfo();
    }
  }

  getChild(optChildRef: string | number): IDataSdj | undefined {
    if (!this._sdChildren) {
      return undefined; 
    }
    let rtnIData: IDataSdj | undefined;

    if (isNumber(optChildRef) && optChildRef !== -1) {
      rtnIData = <IDataSdj | undefined>find(this._sdChildren, {sdIndex: <number>optChildRef});
    } else if (isString(optChildRef)) {
      rtnIData = <IDataSdj>getFromCoreArray(optChildRef, this._sdChildren);
    }

    return rtnIData;
  }

  isValid(): boolean {
    let rtnVal = (this._entity) ? this._entity.validData(this._data) : false,
      curJIStruct: DataJI,
      overparentJI: DataJI | undefined;
    const checkChildJI = (childJI: DataJI, parentJI: DataJI | undefined) => {
      const entRef = this._entity.description.getEntity(childJI.sdId);
      rtnVal = (entRef) ? entRef.validData(childJI) : false;
      if (entRef && rtnVal) {
        rtnVal = entRef.validStruct(childJI, parentJI);
        if (rtnVal && childJI.sdChildren && childJI.sdChildren.length > 0) {
          each(childJI.sdChildren, (subChild: DataJI): boolean => {
            checkChildJI(subChild, childJI);
            return rtnVal;
          });
        }
      }
    };
    if (rtnVal) {
      curJIStruct = this.genJI(true);
      overparentJI = (this._parentRef) ? this._parentRef.data : undefined;
      rtnVal = this._entity.validStruct(curJIStruct, overparentJI);
      if (rtnVal && curJIStruct.sdChildren && curJIStruct.sdChildren.length > 0) {
        each(curJIStruct.sdChildren, (dataChildJI: DataJI): boolean => {
          checkChildJI(dataChildJI, curJIStruct);
          return rtnVal;
        });
      }
    }
    return rtnVal;
  }

  genJI(withChildren: boolean = false): DataJI {
    const rtnDataJI: DataJI = genKeyDataJI(this._data);
    rtnDataJI.sdId = this.sdId;
    rtnDataJI.sdKey = this.sdKey;
    if (this._sdInfo) {
      rtnDataJI.sdInfo = genInfoJI(this._sdInfo);
    }
    if (this.sdChildren && withChildren) {
      each(this.sdChildren, (sdjData: IDataSdj) => {
        if (!rtnDataJI.sdChildren) {
          rtnDataJI.sdChildren = [];
        }
        rtnDataJI.sdChildren.push(sdjData.genJI(withChildren));
      });
    }
    // rtnDataJI["$$depth"] = this._depth;
    return rtnDataJI;
  }
  private confirmEntity(inEnt: IEntitySdj, inData: DataJI): IEntitySdj {
    let throwErr = true;
    if (!isNull(inEnt) && !isUndefined(inEnt)) {
      if (inEnt.description?.host?.checkClassInst && isFunction(inEnt.description.host.checkClassInst)) {
        inEnt.description.host.checkClassInst(inEnt, ESDJ_CLASS.ENTITY, true);
        throwErr = false;
      }
      if (inData.sdId !== inEnt.sdId) {
        throw new Error(`[SDJ] Mismatch - entity sdId '${inEnt.sdId}' != '${inData.sdId}' data sdId;`);
      }
    }
    if (throwErr) {
      throw new Error("[SDJ] Entity missing, incorrect, or malformed;");
    }

    return inEnt;
  }
  static VerifyJI(inData: DataJI) {
    if (!isObject(inData)) {
      throw new Error("[SDJ] DataJI is required to be an object;");
    } else {
      restrictCoreSD(inData);
    }

    if (inData.sdInfo && !isInfo(inData.sdInfo, true)) {
      throw new Error(`[SDJ] Data: sdKey '${inData.sdKey}' has malformed sdInfo;`);
    } else if (inData.sdInfo && isInfo(inData.sdInfo, true)) {
      if (!validSDKey(inData.sdInfo.name)) {
        throw new Error(`[SDJ] Data: sdInfo.name '${inData.sdInfo.name}' required to be sdKey format;`);
      } else if (inData.sdInfo.name !== inData.sdKey) {
        throw new Error("[SDJ] Data: sdKey !== sdInfo.name;");
      }
    }

    if (inData.sdChildren) {
      if (isArray(inData.sdChildren)) {
        if (inData.sdChildren.length > 1 && !verifyUniqKeys(inData.sdChildren, true)) {
          throw new Error(`[SDJ] Data: sdKey '${inData.sdKey}' has duplicate child sdKeys;`);
        } else {
          each(inData.sdChildren, (subDataJI: DataJI) => {
            SdjData.VerifyJI(subDataJI);
          });
        }
      } else {
        throw new Error("[SDJ] Data sdChildren is required to be an array;");
      }
    }

    if (!restrictDataJIKeys(inData)) {
      throw new Error ("[SDJ] Unknown error has occurred with key name validation;");
    }
  }
}
