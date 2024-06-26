/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
    DataJI,
    DescriptionJI,
    DescriptionSearch,
    EntityJI,
    FuncStrNumVoid,
    ItemJI,
    SdJsonJI
} from "../core/interfaces.js";
import {type DescriptSearchResult, SdjDescription} from "../classes/description.js";
import {find, isEqual, isString} from "../util/std.funcs.js";
import {ESDJ_CLASS, ESDJ_LOG} from "../core/enums.js";
import {isInfo} from "../core/validators.js";
import type {IDescriptionSdj, IJsonSdj} from "../classes/class-interfaces.js";
import type {AllSdjTypes, ISdjHost, ISdjLexicons, ISdjSettings, SdjJITypes, Settings} from "./global-interfaces.js";
import {SdjSettings} from "./settings.js";
import {SdjLexicons} from "./lexicons.js";
import {SdjEntity} from "../classes/entity.js";
import {SdjItem} from "../classes/item.js";
import {SdjData} from "../classes/data.js";

class IntSingletonLock {
  constructor() {
    // console.log("IntSingletonLock");
  }
}

export class SdjHost implements ISdjHost {
  private static _instance?: SdjHost;

  gLog: FuncStrNumVoid;

  private _settings: SdjSettings;
  private _lexicons: SdjLexicons;
  private _descriptions: IDescriptionSdj[] = [];
  constructor(lockCon: IntSingletonLock, initialSet?: Settings | undefined | null) {
    if (!(lockCon instanceof IntSingletonLock)) {
      throw new Error("[SDJ] Illegal attempt create SdjHost");
    }
    this._settings = new SdjSettings(this, initialSet?.options);
    this._lexicons = new SdjLexicons(this, initialSet?.lexicons);
    this.gLog = this.settings.logs.getLogFunc("ISdjHost");
    if (initialSet?.options?.logMode && initialSet.options.logMode !== ESDJ_LOG.PROD) {
      this.gLog("Set logMode:" + initialSet.options.logMode);
    }
  }

  get descriptions(): IDescriptionSdj[] {
    return this._descriptions;
  }

  get settings(): ISdjSettings {
    return this._settings;
  }

  get lexiconMgr(): ISdjLexicons {
    return <ISdjLexicons>this._lexicons;
  }

  descriptByName(name: string): IDescriptionSdj | undefined {
    const foundDesc = find(this._descriptions, {name});
    if (!foundDesc) {
      this.gLog(`SdjDescription ${name} not found.`, 1);
      return undefined;
    }
    return foundDesc;
  }

  addDescription(addDesc: IDescriptionSdj) {
    const existingDesc: IDescriptionSdj | undefined = find(this._descriptions, {name: addDesc.name});
    if (existingDesc) {
      throw new Error(`[SDJ] Identical named description '${addDesc.name}' exists;`);
    } else {
      this.checkClassInst(addDesc, ESDJ_CLASS.DESCRIPTION, true);
    }
    this._descriptions.push(addDesc);
  }

  makeDescript(inDesc: DescriptionJI): IDescriptionSdj {
    let foundDesc = find(this._descriptions, {name: inDesc?.sdInfo?.name}),
      newDesc: IDescriptionSdj;
    if (foundDesc && isEqual(inDesc.sdInfo, foundDesc.sdInfo)) {
      return foundDesc;
    } else {
      const thisHost = SdjHost.getHost();
      newDesc = new SdjDescription(inDesc, thisHost);
      return newDesc;
    }
  }

  validateGraph(inDescJI: DescriptionJI): DescriptionJI {
    if (inDescJI.lexicons && this.lexiconMgr.names.length > 0) {
      if (!this.lexiconMgr.validateRequires(inDescJI)) {
        throw new Error("[SDJ] There has been an unknown lexicon error");
      }
    }
    inDescJI.items = this.lexiconMgr.fullItemJI(inDescJI);
    inDescJI.graph = this.lexiconMgr.fullGraphJI(inDescJI);
    if (!this.lexiconMgr.validateGraph(inDescJI)) {
      throw new Error("[SDJ] There has been an unknown lexicon error");
    }
    return inDescJI;
  }

  getLogFunc(name: string): FuncStrNumVoid {
    return this.settings.logs.getLogFunc(name);
  }

  searchDescriptions(search: DescriptionSearch): DescriptSearchResult {
    let rtnArray: IDescriptionSdj[] = [],
      singleDesc: IDescriptionSdj | undefined;
    if (search.name && isString(search.name)) {
      singleDesc = find(this._descriptions, {name: search.name});
      if (singleDesc) {
        rtnArray.push(singleDesc);
      }
    }
    return rtnArray;
  }
  // Given the validation rules some JIs can look like each other;
  // This function is to lock out/check for strange loading of Sdj Class objects that
  // are code masquerading themselves or other strangeness.
  checkClassInst(ji: AllSdjTypes, jiType: ESDJ_CLASS, isClass: boolean = false) {
    let isInst: boolean
    
    switch(jiType) {
    case ESDJ_CLASS.DESCRIPTION:
      isInst = (<IDescriptionSdj>ji instanceof SdjDescription);
      break;
    case ESDJ_CLASS.HOST:
      isInst = (<ISdjHost>ji instanceof SdjHost);
      break;
    case ESDJ_CLASS.DATA:
      isInst = (<DataJI>ji instanceof SdjData);
      break;
    case ESDJ_CLASS.ITEM:
      isInst = (<ItemJI>ji instanceof SdjItem);
      break;
    case ESDJ_CLASS.ENTITY:
      isInst = (<EntityJI>ji instanceof SdjEntity);
      break;
    default:
      throw new Error(`[SDJ] in checkClassInst jiType must match ESDJ_CLASS types, value is '${jiType}'`);
    }
    if (isClass && !isInst) {
      throw new Error(`[SDJ] input value is required to be class '${jiType}';`);
    } else if (!isClass && isInst) {
      throw new Error(`[SDJ] input JI value cannot be of class '${jiType}';`);
    }
  }
  verifyJIbyType(ji: SdjJITypes, jiType: ESDJ_CLASS, strict: boolean = false): boolean {
    let rtnVal = true,
      ogError: Error | unknown;

    try {
      switch(jiType) {
      case ESDJ_CLASS.DESCRIPTION:
        SdjDescription.VerifyJI(<DescriptionJI>ji);
        break;
      case ESDJ_CLASS.DATA:
        SdjData.VerifyJI(<DataJI>ji);
        break;
      case ESDJ_CLASS.ITEM:
        SdjItem.VerifyJI(<ItemJI>ji);
        break;
      case ESDJ_CLASS.ENTITY:
        SdjEntity.VerifyJI(<EntityJI>ji);
        break;
      default:
          // no default
      }
    } catch(verifyError) {
      ogError = verifyError;
      rtnVal = false;
    }

    if (strict) {
      if (!rtnVal) {
        throw new Error(`[SDJ] verifyJI '${jiType}' failed: ${ogError};`);
      }
    }
    return rtnVal;
  }
  createDescription(descJI: DescriptionJI): IDescriptionSdj {
    return new SdjDescription(descJI, SdjHost.getHost());
  }
  // This is for testing purposes commented out on releases // builds
  static setTestingInstance(testInstance: SdjHost): void {
    this._instance = testInstance;
  }

  // Primary static external access point
  static getISdjHost(options?: Settings | undefined | null): ISdjHost {
    if (this._instance && options) {
      throw new Error("[SDJ] Illegal attempt to change SDJ after initialization;");
    } else if (!this._instance) {
      this._instance = new SdjHost(new IntSingletonLock(), options);
    }
    return this._instance;
  }

  // Sdj Library is built to allow initialization ONCE, and will error on second+ attempts.
  //
  // Use of either top-level library classes (Description, Json) before an initialization setup
  // will lock the system to defaults; This entry point is only meant for those classes.
  // Independently created Entities, Items and Data are exempt.
  //
  // Use of this entry point does allow access to core SdjHost functionality; if needed.
  //

  static getHost(): SdjHost {
    if (!this._instance) {
      this._instance = new SdjHost(new IntSingletonLock());
    }
    return <SdjHost>this._instance;
  }
}
