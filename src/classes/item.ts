/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {FuncJsonValueValidator, ItemJI, JIValue, SdjLimiter} from "../core/interfaces.js";
import {isFunction, isString} from "../util/std.funcs.js";

import {validTypeLexName} from "../core/validators.js";
import {isNull, isUndefined} from "lodash-es";
import {restrictCoreSD, restrictLimiter, restrictToAllowedKeys} from "../core/restrict.js";
import {ESDJ_CLASS, ESDJ_LIMIT} from "../core/enums.js";
import type {IDescriptionSdj, IItemSdj} from "./class-interfaces.js";

/*
  SdjItem
  sdId: Item id for Entity
  sdKey: name for data reference
  type: type


  Item Limiter Use:
  <None>Default Item is valid via type or null/undefined
    .REQ        Item is required by entity
    .REQ_HIDE   Item is required but set hidden
    .KEY_IDX    Item value is pos-int and is key index
 */

export class SdjItem implements IItemSdj {
  sdId: number;
  sdKey: string;
  type: string;
  limiter: SdjLimiter;

  private _description?: IDescriptionSdj;

  constructor(inItem: ItemJI, description: IDescriptionSdj | undefined) {
    this.description = description;
    if (this._description) {
      this._description.host.checkClassInst(inItem, ESDJ_CLASS.ENTITY, false);
    }
    SdjItem.VerifyJI(inItem);

    this.sdId = inItem.sdId;
    this.sdKey = inItem.sdKey;
    this.type = inItem.type;
    this.limiter = inItem.limiter || ESDJ_LIMIT.NONE;
  }

  get description(): IDescriptionSdj {
    if (!this._description) {
      throw new ReferenceError("[SDJ] Item has no description;");
    }
    return this._description;
  }

  set description(inDesc:IDescriptionSdj | undefined) {
    if (!isNull(inDesc) && !isUndefined(inDesc)) {
      if (!this._description) {
        if (inDesc.host?.checkClassInst && isFunction(inDesc.host.checkClassInst)) {
          inDesc.host.checkClassInst(inDesc, ESDJ_CLASS.DESCRIPTION, true);
          this._description = inDesc;
        } else {
          throw new Error("[SDJ] Incorrect or missing description/host;");
        }
      } else {
        throw new Error("[SDJ] an Item is prevented from having its description overwritten once assigned;");
      }
    }
  }

  genJI(): ItemJI {
    const rtnItemJI: ItemJI = {
      sdId: this.sdId,
      sdKey: this.sdKey,
      type: this.type
    };

    if (this.limiter !== ESDJ_LIMIT.NONE) {
      rtnItemJI.limiter = this.limiter;
    }
    
    return rtnItemJI;
  }
  
  validateValue(inVal: JIValue): boolean {
    let rtnValid = true,
      validatorFunc: FuncJsonValueValidator;
    if (!this._description) {
      rtnValid = false;
    } else {
      validatorFunc = this.description.getValidator(this.type);
      rtnValid = validatorFunc(inVal);
    }

    return rtnValid;
  }

  static VerifyJI(inItem: ItemJI) {
    restrictCoreSD(inItem);
    if (!inItem.type || !isString(inItem.type)) {
      throw new Error(`[SDJ] Item '${inItem.sdKey}' missing 'type' or invalid type;`);
    } else if (!validTypeLexName(inItem.type)) {
      throw new Error(`[SDJ] Item type:'${inItem.type}' invalid => requires (a-z0-9_-{4});`);
    }
    if ((inItem.sdId === 0 && (inItem.type !== "sdid" || inItem.sdKey !== "sdId")) ||
      (inItem.sdId === 1 && (inItem.type !== "sdkey" || inItem.sdKey !== "sdKey"))) {
      throw new Error("[SDJ] Item sdId's 0, 1 reserved for system;");
    }

    if (inItem.limiter && !restrictLimiter(inItem.limiter)) {
      throw new TypeError(`[SDJ] Provided limiter '${inItem.limiter}' is unrecognized;`);
    }
    restrictToAllowedKeys("ItemJI: " + inItem.sdKey, ["sdId", "sdKey", "type", "limiter"], inItem);
  }
}
