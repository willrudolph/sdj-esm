/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CoreSD,
  DescriptionJI,
  EntityJI,
  EntitySearch,
  FuncJsonValueValidator, FuncStrNumVoid,
  Info,
  ItemJI,
  ItemSearch,
  SdKeyProps
} from "../core/interfaces.js";
import {checkResetInfo, verifyUniqKeys,} from "../util/verify.js";
import {genEntityJI, genInfoJI, genItemJI} from "../util/immutables.js";
import {BASE_ITEMS_JI, GRAPH_ZERO, RESERVED_WORDS} from "../core/statics.js";
import {clone, cloneJI, each, find, isArray, isEqual, isFunction, times, UUID} from "../util/std.funcs.js";
import {isArrayWithLen, isInfo, validIntArray, validLexiconArray} from "../core/validators.js";
import {restrictToAllowedKeys} from "../core/restrict.js";
import type {IDataSdj, IDescriptionSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";
import {SdjEntity} from "./entity.js";
import {SdjItem} from "./item.js";
import type {ISdjHost, SdjJITypes} from "../global/global-interfaces.js";
import {ESDJ_CLASS} from "../core/enums.js";

// eslint-disable-next-line no-use-before-define
export declare type DescriptSearchResult = IDescriptionSdj[];

export class SdjDescription implements IDescriptionSdj {
  dataInfo: boolean;
  lang: string;

  log: FuncStrNumVoid;
  private _lexicons: string[] = [];
  private _graph: SdjEntity[] = [];
  private _sdInfo: Info;
  private _items: SdjItem[] = [];
  private _host: ISdjHost;

  constructor(refDescJI: DescriptionJI, requiredHost: ISdjHost) {
    this._host = requiredHost;
    if (requiredHost.checkClassInst && isFunction(requiredHost.checkClassInst)) {
      this.host.checkClassInst(requiredHost, ESDJ_CLASS.HOST, true);
      this.host.checkClassInst(refDescJI, ESDJ_CLASS.DESCRIPTION, false);
    } else {
      throw new Error("[SDJ] Improper required Host - use SdjHost.createDescription for auto provided host;");
    }
    SdjDescription.VerifyJI(refDescJI);
    const existDesc = this.host.descriptByName(refDescJI.sdInfo.name);
    let inDescJI: DescriptionJI;
    if (existDesc && refDescJI.sdInfo.uniqId === existDesc.sdInfo.uniqId) {
      throw new Error(`[SDJ] Description '${refDescJI.sdInfo.name}' w/uniqId exists already in host;`);
    }
    inDescJI = cloneJI(refDescJI);

    if (existDesc) {
      inDescJI.sdInfo.name += "_alt";
      inDescJI.sdInfo.uniqId = UUID.GetEmpty();
      this._host.gLog(`Existing description conflict creating Description now renamed '${inDescJI.sdInfo.name}'`, 3);
    }
    inDescJI.sdInfo = checkResetInfo(inDescJI.sdInfo);
    inDescJI = this._host.validateGraph(inDescJI);

    this._sdInfo = inDescJI.sdInfo;
    this.dataInfo = inDescJI.dataInfo || false;
    this.lang = inDescJI.lang || "en";
    this.log = this._host.getLogFunc("Desc:" + this._sdInfo.name);
    this.log("created");
    this.entityItemBuild(inDescJI);
    this._host.addDescription(this);
  }

  get graph(): IEntitySdj[] {
    return this._graph;
  }

  get name(): string {
    return this._sdInfo.name;
  }

  get sdInfo(): Info {
    return this._sdInfo;
  }

  get items(): IItemSdj[] {
    return this._items;
  }

  get host(): ISdjHost {
    return this._host;
  }
  searchEntities(searchEnt: EntitySearch): IEntitySdj[] {
    const rtnAry: IEntitySdj[] = [];

    if (searchEnt.sdId || searchEnt.sdKey) {
      //
    }
    return rtnAry;
  }

  searchItems(searchItem: ItemSearch): IItemSdj[] {
    const rtnAry: IItemSdj[] = [];

    if (searchItem.sdId || searchItem.sdKey) {
      //
    }

    return rtnAry;
  }

  getEntityProps(entity: IEntitySdj): SdKeyProps {
    return this._host.lexiconMgr.simpleExtendProps(entity, this._graph);
  }

  getEntityRefs(intAry: number[]): IEntitySdj[] {
    const rtnAry: IEntitySdj[] = [];
    if (validIntArray(intAry)) {
      each(intAry, (sdNum: number) => {
        const entRef: IEntitySdj | undefined = find(this._graph, {sdId: sdNum});
        if (entRef) {
          rtnAry.push(entRef);
        } else {
          this.log(`Unable to find entity sdId ${sdNum}`, 3);
        }
      });
    }
    return rtnAry;
  }

  getItemRefs(intAry: number[]): IItemSdj[] {
    const rtnAry: IItemSdj[] = [];
    if (validIntArray(intAry)) {
      each(intAry, (sdNum: number) => {
        const itemRef: IItemSdj | undefined = find(this._items, {sdId: sdNum});
        if (itemRef) {
          rtnAry.push(itemRef);
        } else {
          this.log(`Unable to find item sdId ${sdNum}`, 3);
        }
      });
    }
    return rtnAry;
  }

  getValidator(validatorId: string): FuncJsonValueValidator {
    return this._host.lexiconMgr.getValidator(validatorId);
  }

  genJI(): DescriptionJI {
    const itemStart = BASE_ITEMS_JI.length,
      itemEnd = this._items.length,
      rtnDescJI: DescriptionJI = {
        sdInfo: genInfoJI(this._sdInfo),
        items: [],
        graph: [],
        lang: this.lang
      };

    if (this.dataInfo) {
      rtnDescJI.dataInfo = true;
    }

    if (this._lexicons && this._lexicons.length > 0) {
      rtnDescJI.lexicons = clone(this._lexicons);
    }

    for (let d = itemStart; d < itemEnd; d += 1) {
      const item: IItemSdj | undefined = this._items[d];
      if (item) {
        rtnDescJI.items.push(item.genJI());
      } else {
        throw new Error(`[SDJ] Description item config error ${this._sdInfo.name}`);
      }
    }

    each(this._graph, (sdjEnt: IEntitySdj) => {
      if (sdjEnt.sdId !== 0) {
        rtnDescJI.graph.push(sdjEnt.genJI());
      }
    });

    return rtnDescJI;
  }

  // Use searches for misses; use this function only for Verified Graphs
  // Internals should not be calling for things that don't exist
  // Returns graphZero??
  getEntityRefById(entId: number): IEntitySdj | undefined {
    return find(this._graph, {sdId: entId});
  }

  verifyParent(sdData: IDataSdj, strict = false): boolean {
    let rtnBool = true;
    const parentEntRef = sdData.entity;
    if (parentEntRef && !isArrayWithLen(parentEntRef.childIds) && isArrayWithLen(sdData.sdChildren)) {
      this.strictLogError("[SDJ] Data entity has children it's not suppose to;", strict);
      rtnBool = false;
    } else if (!parentEntRef) {
      throw new Error ("[SDJ] Unknown error");
    
    } else if (parentEntRef.childIds && sdData.sdChildren) {
      //     each(sdData.sdChildren, (dataObj: SdjData) => {
      //   }
    }
    /*   
      
      each(this.getEntityRefs(parentEntRef.childIds), (childRef: SdjEntity) => {
        const childData: CoreSD[] = (sdData.sdChildren) ? findCoreIds(sdData.sdChildren, childRef.sdId) : [];
        if (childRef.limiter === ESDJ_LIMIT.REQ || childRef.limiter === ESDJ_LIMIT.REQ_HIDE) {
          if (childData.length !== 1) {
            this.strictLogError(`[SDJ] Data entity '${sdData.sdKey}' required child '${childRef.sdKey}`, strict);
          }
        }
        if (isArrayWithLen(childData)) {
          if (childData.length > 1 && childRef.limiter === ESDJ_LIMIT.ONE_NONE) {
            this.strictLogError(`[SDJ] Data '${sdData.sdKey}' item '${childRef.sdKey}' limited to 'one or none';`, strict);
          } else if ((childData.length === 0 || childData.length > 1) && childRef.limiter === ESDJ_LIMIT.REQ_ONE) {
            this.strictLogError(`[SDJ] Data '${sdData.sdKey}' item '${childRef.sdKey}' limited to 'requires at least one';`, strict);
          }
        }
        // child + parent confirmation
        if (parentEntRef.childIds && parentEntRef.childIds.indexOf(childRef.sdId) === -1) {
          this.strictLogError(`[SDJ] Data '${childRef.sdKey}' not allowed child of '${parentEntRef.sdKey}'`, strict);
        } else if (childRef.parentIds && childRef.parentIds.indexOf(parentEntRef.sdId) === -1) {
          this.strictLogError(`[SDJ] Data '${parentEntRef.sdKey}' not allowed parent of '${childRef.sdKey}'`, strict);
        }
*/
    return rtnBool;
  }

  verifyJIbyType(ji: SdjJITypes, jiType: ESDJ_CLASS, strict: boolean = false): boolean {
    let rtnVal = false;
    rtnVal = this._host.verifyJIbyType(ji, jiType, strict);
    return rtnVal;
  }

  private entityItemBuild(inDescJI: DescriptionJI) {
    this._items = this.buildBaseItems();

    const descriptRef: IDescriptionSdj = <IDescriptionSdj>this;
    each(inDescJI.items, (itemJI: ItemJI) => {
      this.checkBase(itemJI, true);
      this._items.push(new SdjItem(genItemJI(itemJI), descriptRef));
    });

    each(inDescJI.graph, (entityJI: EntityJI) => {
      this.checkBase(entityJI, false);
      let defItemIds = times(BASE_ITEMS_JI.length);
      if (entityJI.sdItems && Array.isArray(entityJI.sdItems)) {
        defItemIds = defItemIds.concat(entityJI.sdItems);
      }
      entityJI.sdItems = defItemIds;
      this._graph.push(new SdjEntity(genEntityJI(entityJI), descriptRef));
    });
    this._graph.unshift(new SdjEntity(genEntityJI(GRAPH_ZERO), this));
    this._lexicons = (inDescJI.lexicons) ? inDescJI.lexicons : [];
  }
  private buildBaseItems(): SdjItem[] {
    const newBaseItems: ItemJI[] = this._host.lexiconMgr.newBaseItems(),
      rtnArray: SdjItem[] = [];
    each(newBaseItems, (itemJI: ItemJI) => {
      rtnArray.push(new SdjItem(itemJI, this));
    });
    return rtnArray;
  }
  private checkBase(itemBase: CoreSD, isItem: boolean) {
    const checkArray = (isItem) ? this._items : this._graph,
      errorType = (isItem) ? "Item" : "Entity";
    if (RESERVED_WORDS.indexOf(itemBase.sdKey) !== -1) {
      throw new Error(`[SDJ] Description: ${errorType} sdKey '${itemBase.sdKey}' is reserved;`);
    }
    if (find(checkArray, {sdKey: itemBase.sdKey})) {
      throw new Error(`[SDJ] Description: ${errorType} sdKey '${itemBase.sdKey}' already exists;`);
    }
    if (find(checkArray, {sdId: itemBase.sdId})) {
      throw new Error(`[SDJ] Description:: ${errorType} sdKey '${itemBase.sdKey}' has duplicate sdId [${itemBase.sdId}];`);
    }
  }

  private strictLogError(logStr: string, strict: boolean) {
    if (strict) {
      throw new Error(logStr);
    } else {
      this.log(logStr, 3);
    }
  }

  static VerifyJI(inDesc: DescriptionJI) {
    if (!isInfo(inDesc.sdInfo)) {
      throw new Error("[SDJ] Description - improperly formatted sdInfo;");
    }
    if (inDesc.lexicons && !validLexiconArray(inDesc.lexicons)) {
      throw new Error("[SDJ] Description.lexicons improperly formed;");
    }

    if ((!inDesc.items || !isArray(inDesc.items)) && !inDesc.lexicons) {
      throw new Error("[SDJ] Description - items missing or array error;");
    } else if (!inDesc.lexicons && !verifyUniqKeys(inDesc.items)) {
      throw new Error("[SDJ] Description - items array must contain unique sdKeys and sdIds;");
    }
    if (!inDesc.graph) {
      inDesc.graph = [];
    } else if ((inDesc.graph && !isArray(inDesc.graph)) && !inDesc.lexicons) {
      throw new Error("[SDJ] Description graph is not array;");
    } else if (isArray(inDesc.graph) && !verifyUniqKeys(inDesc.graph)) {
      throw new Error("[SDJ] Description graph does not have unique sdKeys/sdIds;");
    }

    restrictToAllowedKeys("DescriptionJI:" + inDesc.sdInfo.name,
      ["sdInfo", "items", "graph", "dataInfo", "lexicons", "lang"], inDesc);
  }
  static IsEqual(alpha: SdjDescription | DescriptionJI, beta: SdjDescription | DescriptionJI) {
    const betaJI = (beta instanceof SdjDescription) ? beta.genJI() : beta,
      alphaJI = (alpha instanceof SdjDescription) ? alpha.genJI() : alpha;
    return isEqual(alphaJI, betaJI);
  }
}
