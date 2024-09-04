/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {DataJI, DescriptionJI, EntityJI, FuncStrNumVoid, ItemJI} from "../core/interfaces.js";
import {SdjDescription} from "../classes/description.js";
import {DESC_ALT, ESDJ_CLASS, ESDJ_LOG} from "../core/statics.js";
import type {IDescriptionSdj} from "../classes/class-interfaces.js";
import type {
  AllSdjTypes,
  GlobalOptions,
  ISdjHost,
  ISdjLexicons,
  ISdjLibrary,
  ISdjSearch,
  SdjJITypes,
  Settings
} from "./global-interfaces.js";
import {SdjLexicons} from "./lexicons.js";
import {SdjEntity} from "../classes/entity.js";
import {SdjItem} from "../classes/item.js";
import {SdjData} from "../classes/data.js";
import {each, isEqual, isFunction} from "lodash-es";
import {SdjSearch} from "./search.js";
import {type ILogManager, LogManager} from "../util/log";
import {freezeDescription} from "../util/general";


class EmptySdjLibrary implements ISdjLibrary {
  init() {}

  getDescList() {
    return [];
  }
  getDescByName() {
    return undefined;
  }
  storeDesc() {
    return false;
  }
  removeDesc() {
    return false;
  }
}

class IntSingletonLock {
  constructor() {
    // console.log("IntSingletonLock");
  }
}

export class SdjHost implements ISdjHost {
  // eslint-disable-next-line no-use-before-define
  private static _instance?: SdjHost | undefined;

  gLog: FuncStrNumVoid;

  private _lexicons: SdjLexicons;
  private _library: ISdjLibrary;
  private _search: SdjSearch;
  private _logs!: ILogManager;

  constructor(lockCon: IntSingletonLock, initialSet?: Settings | undefined | null) {
    if (!(lockCon instanceof IntSingletonLock)) {
      throw new Error("[SDJ] Illegal attempt create SdjHost");
    }
    this.initLogs(initialSet?.options);
    this.gLog = this._logs.getLogFunc("ISdjHost");

    this._lexicons = new SdjLexicons(this, initialSet?.lexicons);
    this._search = new SdjSearch(this);
    if (initialSet?.options?.logMode && initialSet.options.logMode !== ESDJ_LOG.PROD) {
      this.gLog("Set logMode:" + initialSet.options.logMode);
    }
    if (initialSet?.library) {
      this.verifyLibrary(initialSet.library);
      this._library = initialSet.library;
      this._library.init(this._logs.getLogFunc("ISdjLibrary"), this);
    } else {
      this._library = new EmptySdjLibrary();
    }
  }
  get library() {
    return this._library;
  }

  get lexiconMgr(): ISdjLexicons {
    return <ISdjLexicons>this._lexicons;
  }

  get searchMgr(): ISdjSearch {
    return <ISdjSearch>this._search;
  }

  get logs(): ILogManager {
    return this._logs;
  }

  makeDescript(descJI: DescriptionJI, unlocked = false): IDescriptionSdj {
    let rtnDesc = this._library.getDescByName(descJI.sdInfo.name),
      expDesc: IDescriptionSdj,
      newDesc: IDescriptionSdj;

    if (rtnDesc) {
      if (!isEqual(descJI, rtnDesc.genJI())) {
        descJI.sdInfo.name += DESC_ALT;
      } else {
        return rtnDesc;
      }
    }
    const thisHost = SdjHost.getHost();
    newDesc = new SdjDescription(descJI, thisHost);
    if (this._library.storeDesc(newDesc)) {
      rtnDesc = this._library.getDescByName(descJI.sdInfo.name);
      if (rtnDesc) {
        expDesc = rtnDesc;
      } else {
        this.gLog("Error on unsuccessful add description to library;", 3);
        expDesc = newDesc;
      }
    } else {
      expDesc = newDesc;
    }

    if(!unlocked) {
      freezeDescription(expDesc);
    }
    return expDesc;
  }

  fullDescription(inDescJI: DescriptionJI): DescriptionJI {
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
    return this._logs.getLogFunc(name);
  }

  // Given the validation rules some JIs can look like each other;
  // This function is to lock out/check for strange loading of Sdj Class objects that
  // are code masquerading themselves or other strangeness.
  checkClassInst(ji: AllSdjTypes, jiType: ESDJ_CLASS, isClass: boolean = false) {
    let isInst: boolean;
    
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
        throw new Error(`[SDJ] verifyJI '${jiType}' failed: ${ogError}`);
      }
    }
    return rtnVal;
  }

  createDescription(descJI: DescriptionJI): IDescriptionSdj {
    let rtnDesc = this._library.getDescByName(descJI.sdInfo.name);
    if (rtnDesc) {
      if (!isEqual(descJI, rtnDesc.genJI())) {
        descJI.sdInfo.name += DESC_ALT;
      } else {
        return rtnDesc;
      }
    }
    rtnDesc = new SdjDescription(descJI, SdjHost.getHost());
    this._library.storeDesc(rtnDesc);
    return rtnDesc;
  }

  private initLogs(options?: GlobalOptions) {
    if (options?.loggerStore && options?.logManager) {
      throw new Error("[SDJ] Create a custom ILogManager or alternate loggerStore, not both;");
    } else if (options?.logManager) {
      if (!isFunction(options.logManager.getLogFunc)) {
        throw new Error("[SDJ] custom ILogManager missing getLogFunc");
      } else {
        this._logs = options.logManager;
      }
    } else {
      const logMode:ESDJ_LOG = (options?.logMode) ? options.logMode : ESDJ_LOG.PROD;
      this._logs = new LogManager(logMode, options?.loggerStore);
    }
  }

  private verifyLibrary(inLib: ISdjLibrary) {
    const vfList: Function[] = [inLib.init, inLib.getDescByName, inLib.getDescList,
      inLib.storeDesc, inLib.removeDesc];
    each(vfList, (testFunc) => {
      if (!isFunction(testFunc)) {
        throw new Error("[SDJ] Illegal ISdjLibrary assignment, does not include all functions;");
      }
    });
  }

  // This is for testing purposes commented out on initial release // builds
  static setTestingInstance(testInstance: SdjHost | undefined): void {
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
