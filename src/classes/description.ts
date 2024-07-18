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
  IValidator,
  SdKeyProps
} from "../core/interfaces.js";
import {checkResetInfo, verifyUniqKeys,} from "../util/verify.js";
import {genEntityJI, genInfoJI, genItemJI} from "../util/immutables.js";
import {BASE_ITEMS_JI, GRAPH_ZERO, SYS_RESERVED} from "../core/statics.js";
import {cloneJI, UUID} from "../util/func.std.js";
import {isArrayWithLen, isInfo, validLexiconArray} from "../core/validators.js";
import {restrictToAllowedKeys} from "../core/restrict.js";
import type {IDescriptionSdj, IEntitySdj, IItemSdj} from "./class-interfaces.js";
import {SdjEntity} from "./entity.js";
import {SdjItem} from "./item.js";
import type {ISdjHost, SdjJITypes} from "../global/global-interfaces.js";
import {ESDJ_CLASS} from "../core/enums.js";
import {
  clone,
  cloneDeep,
  each,
  find,
  isArray,
  isEqual,
  isFunction,
  isNumber,
  isString,
  isUndefined,
  times,
  uniq
} from "lodash-es";
import {validIntArray} from "../core/sdj-types.js";

// eslint-disable-next-line no-use-before-define
export declare type DescriptSearchResult = IDescriptionSdj[];

export class SdjDescription implements IDescriptionSdj {
  dataInfo: boolean;
  lang: string;

  log: FuncStrNumVoid;
  private _lexicons: string[] = [];
  private _graph: IEntitySdj[] = [];
  private _sdInfo: Info;
  private _items: SdjItem[] = [];
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
    } else if (!inDescJI.lexicons && inDescJI.graph.length === 0 && inDescJI.items.length === 0) {
      this._host.gLog(`Description '${inDescJI.sdInfo.name}' contains no items, graph, or lexicon reference`, 3);
    }
    inDescJI.sdInfo = checkResetInfo(inDescJI.sdInfo);
    inDescJI = this._host.fullDescription(inDescJI);

    this._sdInfo = inDescJI.sdInfo;
    this.dataInfo = inDescJI.dataInfo || false;
    this.lang = inDescJI.lang || "en";
    this.log = this._host.getLogFunc("Desc:" + this._sdInfo.name);
    this.log("created");
    this.entityItemBuild(inDescJI);
    this._host.addDescription(this);
  }

  get graph(): IEntitySdj[] {
    return <IEntitySdj[]>this._graph;
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
  // Both of these searches are single prop search term/item cut-out searches
  // Adding multiple terms will be ignored after the first is found in below order
  // Unclear if multiple item search should be supported
  // but that could be achieved by external methodologies
  searchEntities(searchEnt: EntitySearch): IEntitySdj[] {
    const rtnAry: IEntitySdj[] = [],
        pushIfAvail = (ent: IEntitySdj | undefined) => {
          if (ent) {
            rtnAry.push(ent);
          }
        };

    if (searchEnt) {
      if (searchEnt.sdId) {
        pushIfAvail(<IEntitySdj>this.getRefByType(searchEnt.sdId, "entity"));
      } else if (searchEnt.sdKey) {
        pushIfAvail(<IEntitySdj>this.getRefByType(searchEnt.sdKey, "entity"));
      } else if (searchEnt.limiter) {
        each(this._graph, (sdjEnt: IEntitySdj) => {
          if (sdjEnt.limiter === searchEnt.limiter) {
            rtnAry.push(sdjEnt);
          }
        })
      } else if (validIntArray(searchEnt.parentIds)) {
        each(searchEnt.parentIds, (sdId: number)=> {
          each(this._graph, (entRef: IEntitySdj) => {
            if (entRef.parentIds.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.extendIds)) {
        each(searchEnt.extendIds, (sdId: number)=> {
          each(this._graph, (entRef: IEntitySdj) => {
            if (entRef.extendIds && entRef.extendIds.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.sdItems)) {
        each(searchEnt.sdItems, (sdId: number)=> {
          each(this._graph, (entRef: IEntitySdj) => {
            if (entRef.sdItems.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.childIds)) {
        each(searchEnt.childIds, (sdId: number)=> {
          each(this._graph, (entRef: IEntitySdj) => {
            if (entRef.sdId === 0) return;
            if (entRef.childIds && entRef.childIds?.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (searchEnt.sdProps) {
        each(this._graph, (entRef: IEntitySdj)=> {
          if (entRef.sdId === 0) return;
          if (searchEnt.checkData) {
            if (entRef.sdProps && isEqual(entRef.sdProps, searchEnt.sdProps)) {
              rtnAry.push(entRef);
            }
          } else {
            let allValid = true;
            each(searchEnt.sdProps, (propValue, key) => {
              if (entRef.sdProps && entRef.sdProps[key] !== propValue) {
                allValid = false;
                return false;
              }
              return true;
            });
            if (allValid) {
              rtnAry.push(entRef);
            }
        }});
      }
    }
    return rtnAry;
  }
  searchItems(searchItem: ItemSearch): IItemSdj[] {
    const rtnAry: IItemSdj[] = [],
        pushIfAvail = (item: IItemSdj | undefined) => {
          if (item) {
            rtnAry.push(item);
          }
        }
    if (searchItem) {
      if (searchItem.sdId) {
        pushIfAvail(<IItemSdj>this.getRefByType(searchItem.sdId, "item"));
      } else if (searchItem.sdKey) {
        pushIfAvail(<IItemSdj>this.getRefByType(searchItem.sdKey, "item"));
      } else if (searchItem.type) {
        each(this._items, (sdjItem: IItemSdj) => {
          if (sdjItem.type === searchItem.type) {
            rtnAry.push(sdjItem);
          }
        });
      } else if (searchItem.limiter) {
        each(this._items, (sdjItem: IItemSdj) => {
          if (sdjItem.limiter === searchItem.limiter) {
            rtnAry.push(sdjItem);
          }
        })
      }
    }
    return rtnAry;
  }

  getEntityProps(entity: IEntitySdj): SdKeyProps {
    return this._host.lexiconMgr.simpleExtendProps(entity, this._graph);
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

  getValidator(validatorId: string): IValidator {
    return this._host.lexiconMgr.getValidator(validatorId);
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

    if (this.dataInfo) {
      rtnDescJI.dataInfo = true;
    }

    if (this._lexicons && this._lexicons.length > 0) {
      rtnDescJI.lexicons = clone(this._lexicons);
      each(this._lexicons, (lexId) => {
        const workLex = this._host.lexiconMgr.getByName(lexId);
        lexEntRefs = (workLex?.entities) ? lexEntRefs.concat(workLex.entities) :lexEntRefs;
        lexItemRefs = (workLex?.items) ? lexItemRefs.concat(workLex.items) : lexItemRefs;
      });
    }

    each(this._items, (sdjItem: IItemSdj) => {
      const itemInLex =  find(lexItemRefs, {sdId: sdjItem.sdId}),
          itemInBase = find(BASE_ITEMS_JI, {sdId: sdjItem.sdId});
      if (!itemInLex && !itemInBase) {
        rtnDescJI.items.push(sdjItem.genJI());
      }
    });

    each(this._graph, (sdjEnt: IEntitySdj) => {
      const entInLex =  find(lexEntRefs, {sdId: sdjEnt.sdId});
      if (sdjEnt.sdId !== 0 && !entInLex) {
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

  getItemsByEntity(entKeyNum: string | number): IItemSdj[] {
    let actualEnt: IEntitySdj | undefined = this.getRefByType<IEntitySdj>(entKeyNum, "entity");
    if (!actualEnt) return [];
    let extendsList = (actualEnt.extendIds) ? clone(actualEnt.extendIds) : [],
        fullItemList: number[] = cloneDeep(actualEnt.sdItems),
        getEnts = (entRef: IEntitySdj) => {
          let rtnSdItems = cloneDeep(entRef.sdItems);
          if (entRef.extendIds && isArrayWithLen(entRef.extendIds)) {
            each(entRef.extendIds, (num: number) => {
              const subEntRef = this.getRefByType<IEntitySdj>(num, "entity");
              if (subEntRef) {
                rtnSdItems = rtnSdItems.concat(getEnts(subEntRef));
              }
            });
          }
          return rtnSdItems;
        };

    each(extendsList, (entNum: number) => {
      const topExtendRef = this.getRefByType<IEntitySdj>(entNum, "entity");
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

  private getRefByType<Type>(idOrKey: number | string, type: string): Type | undefined {
    if (isUndefined(idOrKey) || (!isString(idOrKey) && !isNumber(idOrKey))) return undefined;
    const searchGroup = (type === "entity") ? this._graph : this._items;
    return (isNumber(idOrKey)) ? <Type>find(searchGroup, {sdId: idOrKey}) : <Type>find(searchGroup, {sdKey: idOrKey});
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

    each(this._graph, (entity: IEntitySdj) => {
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
