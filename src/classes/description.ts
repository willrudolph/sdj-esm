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
  FuncStrNumVoid,
  Info,
  ItemJI,
  ItemSearch,
  SdKeyProps
} from "../core/interfaces.js";
import {checkResetInfo, verifyUniqKeys,} from "../util/verify.js";
import {genEntityJI, genInfoJI, genItemJI} from "../util/immutables.js";
import {BASE_ITEMS_JI, ESDJ_CLASS, GRAPH_ZERO, SYS_RESERVED} from "../core/statics.js";
import {cloneJI, getFromCoreArray} from "../util/func.std.js";
import {isArrayWithLen, isInfo, validLexiconArray} from "../core/validators.js";
import {restrictToAllowedKeys} from "../core/restrict.js";
import type {IDescriptionSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";
import {SdjEntity} from "./entity.js";
import {SdjItem} from "./item.js";
import type {ISdjHost, SdjJITypes} from "../global/global-interfaces.js";
import {clone, cloneDeep, each, find, isArray, isEqual, isFunction, times, uniq} from "lodash-es";
import {validSDKey} from "../core/sdj-types";

// Descriptions created outside of new SdJson() or SdjHost.makeDescription
// using 'new SdjDescription(...)' ; will NOT automatically be added to a library.
// After initial creation they can be added as needed via library.storeDesc(...);


export class SdjDescription implements IDescriptionSdj {
  lang: string;

  log: FuncStrNumVoid;
  private _lexicons: string[] = [];
  private _graph: IEntitySdj[] = [];
  private _sdInfo: Info;
  private _items: IItemSdj[] = [];
  private _host: ISdjHost;

  constructor(refDescJI: DescriptionJI, requiredHost: ISdjHost) {
    this._host = requiredHost;
    if (requiredHost?.checkClassInst && isFunction(requiredHost.checkClassInst)) {
      this.host.checkClassInst(requiredHost, ESDJ_CLASS.HOST, true);
      this.host.checkClassInst(refDescJI, ESDJ_CLASS.DESCRIPTION, false);
    } else {
      throw new Error("[SDJ] Improper required Host - use SdjHost.createDescription for auto provided host;");
    }
    SdjDescription.VerifyJI(refDescJI);
    let inDescJI: DescriptionJI;
    inDescJI = cloneJI(refDescJI);
    inDescJI.sdInfo = checkResetInfo(inDescJI.sdInfo);
    inDescJI = this._host.fullDescription(inDescJI);

    this._sdInfo = inDescJI.sdInfo;
    this.lang = inDescJI.lang || "en";
    this.log = this._host.getLogFunc("Desc:" + this._sdInfo.name);
    this.log("created");
    this.entityItemBuild(inDescJI);
  }

  // vvv Below are frozen when description/sdJson locked
  get graph(): SdjEntity[] {
    return <SdjEntity[]>this._graph;
  }

  set graph(inGraph: SdjEntity[]) {
    this._graph = inGraph;
  }

  set items(inItems: IItemSdj[]) {
    this._items = <SdjItem[]>inItems;
  }

  get items(): SdjItem[] {
    return <SdjItem[]>this._items;

  }
  get name(): string {
    return this._sdInfo.name;
  }

  set name(name: string) {
    this._sdInfo.name = name;
  }

  get sdInfo(): Info {
    return this._sdInfo;
  }
  // ^^ Above Frozen when locked

  get host(): ISdjHost {
    return this._host;
  }

  searchEntities(searchEnt: EntitySearch): IEntitySdj[] {
    return this._host.searchMgr.searchEntities(this, searchEnt);
  }

  searchItems(searchItem: ItemSearch): IItemSdj[] {
    return this._host.searchMgr.searchItems(this, searchItem);
  }

  getEntity (entKeyNum: number | string): IEntitySdj | undefined {
    return (entKeyNum === 0) ? undefined : <IEntitySdj>getFromCoreArray(entKeyNum, this._graph);
  }

  getEntityRefs (entArray: number[] | string[]): IEntitySdj[] {
    const rtnAry: IEntitySdj[] = [];
    each(entArray, (theValue: number | string) => {
      const entRef = <IEntitySdj>getFromCoreArray(theValue, this._graph);
      if (entRef && entRef.sdId !== 0) {
        rtnAry.push(entRef);
      } else {
        this.log(`Unable to find item sdId/sdKey '${theValue}'`, 3);
      }
    });
    return rtnAry;
  }
  calcSdKeyProps(entity: IEntitySdj): SdKeyProps {
    // confirm entity name and sdId, and get from graph instead
    const localEnt = (entity && this._graph[entity.sdId]) ? this._graph[entity.sdId] : undefined;
    if (!localEnt || entity.sdKey !== localEnt.sdKey || !isEqual(localEnt.sdProps, entity.sdProps)) {
      throw new Error(`[SDJ] entity '${entity.sdKey}' does match description '${this._sdInfo.name}'`);
    }
    return this._host.lexiconMgr.calcSdKeyProps(entity, this._graph);
  }
  getItem (itemKeyNum: number | string): IItemSdj | undefined {
    return <IItemSdj>getFromCoreArray(itemKeyNum, this._items);
  }
  getItemRefs(itemArray: number[] | string[]): IItemSdj[] {
    const rtnAry: IItemSdj[] = [];
    each(itemArray, (theValue: number | string) => {
      const itemRef = <IItemSdj>getFromCoreArray(theValue, this._items);
      if (itemRef) {
        rtnAry.push(itemRef);
      } else {
        this.log(`Unable to find item sdId/sdKey '${theValue}'`, 3);
      }
    });
    return rtnAry;
  }

  genJI(): DescriptionJI {
    const rtnDescJI: DescriptionJI = {
      sdInfo: genInfoJI(this._sdInfo),
      graph: [],
      items: [],
      lang: this.lang
    };
    let lexEntRefs: EntityJI[] = [],
      lexItemRefs: ItemJI[] = [];

    if (this._lexicons && this._lexicons.length > 0) {
      rtnDescJI.lexicons = clone(this._lexicons);
      each(this._lexicons, (lexId) => {
        const workLex = this._host.lexiconMgr.getByName(lexId);
        lexEntRefs = (workLex?.entities) ? lexEntRefs.concat(workLex.entities) :lexEntRefs;
        lexItemRefs = (workLex?.items) ? lexItemRefs.concat(workLex.items) : lexItemRefs;
      });
    }

    each(this._items, (sdjItem: IItemSdj) => {
      const itemInLex = find(lexItemRefs, {sdId: sdjItem.sdId}),
        itemInBase = find(BASE_ITEMS_JI, {sdId: sdjItem.sdId});
      if (!itemInLex && !itemInBase) {
        rtnDescJI.items.push(sdjItem.genJI());
      }
    });

    each(this._graph, (sdjEnt: IEntitySdj) => {
      const entInLex = find(lexEntRefs, {sdId: sdjEnt.sdId});
      if (sdjEnt.sdId !== 0 && !entInLex) {
        rtnDescJI.graph.push(sdjEnt.genJI());
      }
    });

    return rtnDescJI;
  }

  // Use searches for misses; use this function only for Verified Graphs
  // Internals should not be calling for things that don't exist
  getEntityRefById(entId: number): IEntitySdj | undefined {
    return (entId > 0) ? this._graph[entId] : undefined;
  }

  getItemsByEntity(entKeyNum: string | number): IItemSdj[] {
    const actualEnt = <IEntitySdj>getFromCoreArray(entKeyNum, this._graph);
    if (!actualEnt) {
      return []; 
    }
    let extendsList = (actualEnt.extendIds) ? clone(actualEnt.extendIds) : [],
      fullItemList: number[] = cloneDeep(actualEnt.sdItems),
      getEnts = (entRef: IEntitySdj) => {
        let rtnSdItems = cloneDeep(entRef.sdItems);
        if (entRef.extendIds && isArrayWithLen(entRef.extendIds)) {
          each(entRef.extendIds, (num: number) => {
            const subEntRef = <IEntitySdj>getFromCoreArray(num, this._graph);
            if (subEntRef) {
              rtnSdItems = rtnSdItems.concat(getEnts(subEntRef));
            }
          });
        }
        return rtnSdItems;
      };

    each(extendsList, (entNum: number) => {
      const topExtendRef = <IEntitySdj>getFromCoreArray(entNum, this._graph);
      if (topExtendRef) {
        fullItemList = fullItemList.concat(getEnts(topExtendRef));
      }
    });

    fullItemList = uniq(fullItemList.sort());
    return this.getItemRefs(fullItemList);
  }

  verifyJIbyType(ji: SdjJITypes, jiType: ESDJ_CLASS, strict: boolean = false): boolean {
    return this._host.verifyJIbyType(ji, jiType, strict);
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

    each(this._items, (itemJI: IItemSdj, idx: number) => {
      // Has been pre-sorted, final confirmation to confirm sdId === _item index alignment
      if (idx !== itemJI.sdId) {
        throw new Error("[SDJ] Description validity error, missing entity or error;");
      }
    });

    each(this._graph, (entity: IEntitySdj, idx: number) => {
      // This has been presorted before this, but confirms sdId === _graph index alignment
      if (idx !== entity.sdId) {
        throw new Error("[SDJ] Description validity error, missing entity or error;");
      }
      const classRef: SdjEntity = <SdjEntity>entity;
      classRef.$refreshRefs();
    });
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
    if (SYS_RESERVED.indexOf(itemBase.sdKey) !== -1) {
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
    } else if (isInfo(inDesc.sdInfo) && !validSDKey(inDesc.sdInfo.name)) {
      throw new Error(`[SDJ] Description name '${inDesc.sdInfo.name}' must be sdKey format;`);
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
      ["sdInfo", "items", "graph", "lexicons", "lang"], inDesc);
  }
  static IsEqual(alpha: SdjDescription | DescriptionJI, beta: SdjDescription | DescriptionJI) {
    const betaJI = (beta instanceof SdjDescription) ? beta.genJI() : beta,
      alphaJI = (alpha instanceof SdjDescription) ? alpha.genJI() : alpha;
    return isEqual(alphaJI, betaJI);
  }
}
