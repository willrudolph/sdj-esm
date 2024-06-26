/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {CoreSD, DataJI, Info, JIValue} from "../core/interfaces.js";
import {genInfoJI, genKeyDataJI, newInfoJI} from "../util/immutables.js";

import {each, isArray, isFunction, isNull, isObject, isUndefined} from "../util/std.funcs.js";
import {verifyUniqKeys} from "../util/verify.js";
import {restrictCoreSD, restrictDataJIKeys} from "../core/restrict.js";
import {ESDJ_CLASS, ESDJ_LIMIT} from "../core/enums.js";
import {isInfo} from "../core/validators.js";
import type {IDataSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";

export class SdjData implements CoreSD, IDataSdj {
  // eslint-disable-next-line no-use-before-define
  sdChildren?: IDataSdj[];

  // eslint-disable-next-line no-use-before-define
  private _parentRef?: IDataSdj;
  private _data: DataJI;
  private _entity?: IEntitySdj;
  private _sdId: number;
  private _sdKey: string;
  private _depth: number = 0;
  private _sdInfo?: Info;

  constructor(inData: DataJI, entityRef: IEntitySdj | undefined, parentRef: IDataSdj | undefined) {
    this.entity = entityRef;
    if (entityRef && entityRef?.description?.host?.checkClassInst) {
      entityRef.description.host.checkClassInst(inData, ESDJ_CLASS.DATA, false);
    }
    SdjData.VerifyJI(inData);
    if (inData.sdInfo && isInfo(inData.sdInfo, true)) {
      this._sdInfo = genInfoJI(inData.sdInfo);
    } else if ((!inData.sdInfo || !isInfo(inData.sdInfo, true)) && this._entity?.description.dataInfo) {
      this._sdInfo = newInfoJI(inData.sdKey, true);
    }
    this._data = genKeyDataJI(inData);
    this._sdId = this._data.sdId;
    this._sdKey = this._data.sdKey;
    this.parentRef = parentRef;
  }

  get sdKey() {
    return this._sdKey;
  }

  get sdId() {
    return this._sdId;
  }

  get depth() {
    return this._depth;
  }

  set entity(inEnt: IEntitySdj | undefined) {
    if (!isNull(inEnt) && !isUndefined(inEnt)) {
      if (!this._entity) {
        if (inEnt.description?.host?.checkClassInst && isFunction(inEnt.description.host.checkClassInst)) {
          inEnt.description.host.checkClassInst(inEnt, ESDJ_CLASS.ENTITY, true);
          this._entity = inEnt;
        }
      } else {
        throw new Error("[SDJ] a Data item is prevented from having its entity ref overwritten;");
      }
    }
  }
  get entity(): IEntitySdj | undefined {
    return this._entity;
  }

  get path(): string {
    let rtnStr = this._sdKey,
      parentRef = this.parentRef;
    if (parentRef) {
      while(parentRef) {
        rtnStr = parentRef.sdKey + "/" + rtnStr;
        parentRef = parentRef.parentRef;
      }
    }
    return rtnStr;
  }

  get parentRef(): IDataSdj | undefined {
    return this._parentRef;
  }
  set parentRef(inParent: IDataSdj | undefined) {
    if (this._entity && inParent) {
      // TODO: verify that data parent can attach to SdjData
      this._entity.description.host.checkClassInst(inParent, ESDJ_CLASS.DATA, true);
      if (!this._parentRef) {
        this._parentRef = inParent;
        this._depth = inParent.depth + 1;
      } else {
        // TODO: DEAL WITH REPLACEMENT OF EXISTING PARENT
        throw new Error("[SDJ] Currently unable to replace parent...");
      }
    }
  }

  getItemRefs(): IItemSdj[] {
    return (this._entity) ? this._entity.getItemRefs() : [];
  }

  genJI(withChildren: boolean = true): DataJI {
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
    return rtnDataJI;
  }

  validateData(strict: boolean = false): boolean {
    let rtnVal = true,
      errorResult: string,
      splits: string[];
    if (!this._entity) {
      if (strict) {
        throw new Error("[SDJ] SdjData Unable to validate without entity;");
      } else {
        rtnVal = false;
      }
    } else {
      errorResult = this.dataValidate(this._data);
      if (errorResult !== "") {
        splits = errorResult.split(",");
        if (strict) {
          throw new Error(
            `SdjData key '${this.sdKey}' validate item '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`);
        } else {
          this._entity.description.log(
            `SdjData key '${this.sdKey}' validate item '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`
            , 3);
        }
        rtnVal = false;
      }
    }

    return rtnVal;
  }
  // Internal function reports on which first errors and simple/pseudo why
  // will throw errors on undefined entity
  // stops on first issue
  // empty string is no issues
  private dataValidate(dataJI: DataJI): string {
    const entityItems: IItemSdj[] = (this._entity) ? this._entity.getItemRefs() : [];
    let rtnStrErr = "";
    each(entityItems, (itemRef: IItemSdj): boolean => {
      const key = itemRef.sdKey,
        possibleValue = dataJI[key],
        isPresent: boolean = (possibleValue !== null && possibleValue !== undefined),
        actualValue: JIValue = isPresent ? <JIValue>possibleValue : false,
        isRequired = (itemRef.limiter === ESDJ_LIMIT.SYS_REQ
          || itemRef.limiter === ESDJ_LIMIT.REQ || itemRef.limiter === ESDJ_LIMIT.REQ_HIDE),
        isValid = (isPresent) ? itemRef.validateValue(actualValue) : false;

      if (isRequired && !isPresent) {
        rtnStrErr = key + ",required," + itemRef.type;
        return false;
      } else if (isRequired && isPresent && !isValid) {
        rtnStrErr = key + ",invalid," + itemRef.type;
        return false;
      } else if (!isRequired && isPresent && !isValid) {
        rtnStrErr = key + ",invalid," + itemRef.type;
        return false;
      } else {
        return true;
      }
    });
    return rtnStrErr;
  }

  static VerifyJI(inData: DataJI) {
    restrictCoreSD(inData);
    if (inData.sdInfo && !isInfo(inData.sdInfo, true)) {
      throw new Error(`[SDJ] Data: sdKey '${inData.sdKey}' has malformed sdInfo;`);
    } else if (!isObject(inData)) {
      throw new Error("[SDJ] DataJI is required to be an object;");
    }

    if (inData.sdChildren) {
      if (isArray(inData.sdChildren)) {
        if (inData.sdChildren.length > 1 && !verifyUniqKeys(inData.sdChildren, true)) {
          throw new Error(`[SDJ] Data: sdKey '${inData.sdKey}' has duplicate child sdKeys;`);
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
