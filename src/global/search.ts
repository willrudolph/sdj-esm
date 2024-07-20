/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {ISdjHost, ISdjSearch} from "./global-interfaces.js";
import type {
  DataJI,
  DescriptionSearch,
  EntitySearch,
  FuncStrNumVoid,
  ItemSearch,
  JIValue,
  NumKeyStore
} from "../core/interfaces.js";
import type {IDataSdj, IDescriptionSdj, IEntitySdj, IItemSdj, IJsonSdj} from "../classes/class-interfaces.js";
import {each, find, isEqual, isNull, isString, isUndefined} from "lodash-es";
import {validIntArray} from "../core/sdj-types.js";
import {ESDJ_LIMIT} from "../core/enums.js";
import {SD_IDX} from "../core/statics.js";
import {SdjDescription} from "../classes/description.js";
import {getFromCoreArray} from "../util/func.std.js";

export class SdjSearch implements ISdjSearch {
  log: FuncStrNumVoid;

  private _host: ISdjHost;
  constructor(private host: ISdjHost) {
    this._host = host;
    this.log = this._host.getLogFunc("SdjSearch");
  }

  changeDataInfo(sdJson: IJsonSdj, newValue: boolean) {


    this.log(sdJson.sdInfo.name + ":" + newValue);
  } 
    
  // Excepts either / or .
  // clears or ignores first /.
  dataByPath(sdJson: IJsonSdj, dataPath: string): IDataSdj | undefined {
    if (!dataPath || !isString(dataPath) || dataPath === "." || dataPath === "/") {
      return undefined;
    }
    let routePath = (dataPath.indexOf(".") !== -1) ? dataPath.replace(/\./g, "/"): dataPath,
      routeSplit: string[] = routePath.split("/"),
      parentPath: string;

    while(routeSplit[0] === "" || routeSplit[0] === "/") {
      routeSplit.shift();
    }
    if (routeSplit.length === 0) {
      this.log(`Error finding sdKey: ${dataPath}`, 3);
      return undefined;
    }

    let rtnData: IDataSdj | undefined = find(sdJson.data, {sdKey: String(routeSplit[0])});
    if (!rtnData) {
      this.log(`Error finding sdKey:${routeSplit[0]}`, 3);
      return undefined;
    } else if (rtnData && routeSplit.length === 1) {
      return rtnData;
    }

    parentPath = String(routeSplit[0]);
    routeSplit.shift();
    while (routeSplit.length > 0) {
      if (rtnData) {
        rtnData = find(rtnData.sdChildren, {sdKey: String(routeSplit[0])});
      }
      if (rtnData) {
        parentPath += ("." + routeSplit[0]);
        routeSplit.shift();
      } else {
        this.log(`On ${parentPath}; Error finding ${routeSplit[0]}`, 3);
        return undefined;
      }
    }

    return rtnData;
  }

  searchDescriptions(search: DescriptionSearch): IDescriptionSdj[] {
    let rtnArray: IDescriptionSdj[] = [],
      singleDesc: IDescriptionSdj | undefined;
    // TODO: Make more robust
    if (search.name && isString(search.name)) {
      singleDesc = find(this._host.descriptions, {name: search.name});
      if (singleDesc) {
        rtnArray.push(singleDesc);
      }
    }
    return rtnArray;
  }

  // Both of these searches are single prop search term/item cut-out searches
  // Adding multiple terms will be ignored after the first is found in below order
  // Unclear if multiple item search should be supported
  // but that could be achieved by external methodologies
  searchEntities(sdjDescript: IDescriptionSdj, searchEnt: EntitySearch): IEntitySdj[] {
    const asDescSdj: SdjDescription = <SdjDescription>sdjDescript,
      rtnAry: IEntitySdj[] = [],
      pushIfAvail = (ent: IEntitySdj | undefined) => {
        if (ent) {
          rtnAry.push(ent);
        }
      };

    if (searchEnt) {
      if (searchEnt.sdId) {
        pushIfAvail(<IEntitySdj>getFromCoreArray(searchEnt.sdId, asDescSdj.$graph));
      } else if (searchEnt.sdKey) {
        pushIfAvail(<IEntitySdj>getFromCoreArray(searchEnt.sdKey, asDescSdj.$graph));
      } else if (searchEnt.limiter) {
        each(asDescSdj.$graph, (sdjEnt: IEntitySdj) => {
          if (sdjEnt.limiter === searchEnt.limiter) {
            rtnAry.push(sdjEnt);
          }
        });
      } else if (validIntArray(searchEnt.parentIds)) {
        each(searchEnt.parentIds, (sdId: number) => {
          each(asDescSdj.$graph, (entRef: IEntitySdj) => {
            if (entRef.parentIds.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.extendIds)) {
        each(searchEnt.extendIds, (sdId: number) => {
          each(asDescSdj.$graph, (entRef: IEntitySdj) => {
            if (entRef.extendIds && entRef.extendIds.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.sdItems)) {
        each(searchEnt.sdItems, (sdId: number) => {
          each(asDescSdj.$graph, (entRef: IEntitySdj) => {
            if (entRef.sdItems.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (validIntArray(searchEnt.childIds)) {
        each(searchEnt.childIds, (sdId: number) => {
          each(asDescSdj.$graph, (entRef: IEntitySdj) => {
            if (entRef.sdId === 0) {
              return; 
            }
            if (entRef.childIds && entRef.childIds?.indexOf(sdId) !== -1) {
              rtnAry.push(entRef);
            }
          });
        });
      } else if (searchEnt.sdProps) {
        each(asDescSdj.$graph, (entRef: IEntitySdj) => {
          if (entRef.sdId === 0) {
            return; 
          }
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
          } 
        });
      }
    }
    return rtnAry;
  }

  searchItems(sdjDescript: IDescriptionSdj, searchItem: ItemSearch): IItemSdj[] {
    const asDescript: SdjDescription = <SdjDescription>sdjDescript,
      rtnAry: IItemSdj[] = [],
      pushIfAvail = (item: IItemSdj | undefined) => {
        if (item) {
          rtnAry.push(item);
        }
      };
    if (searchItem) {
      if (searchItem.sdId) {
        pushIfAvail(<IItemSdj>getFromCoreArray(searchItem.sdId, asDescript.$items));
      } else if (searchItem.sdKey) {
        pushIfAvail(<IItemSdj>getFromCoreArray(searchItem.sdKey, asDescript.$items));
      } else if (searchItem.type) {
        each(asDescript.$items, (sdjItem: IItemSdj) => {
          if (sdjItem.type === searchItem.type) {
            rtnAry.push(sdjItem);
          }
        });
      } else if (searchItem.limiter) {
        each(asDescript.$items, (sdjItem: IItemSdj) => {
          if (sdjItem.limiter === searchItem.limiter) {
            rtnAry.push(sdjItem);
          }
        });
      }
    }
    return rtnAry;
  }

  dataByEntity(sdJson: IJsonSdj, searchEnt: EntitySearch, dataPath?: string): IDataSdj[] {
    const dataPathItem: IDataSdj | undefined = (dataPath) ? sdJson.dataByPath(dataPath) : undefined,
      data: IDataSdj[] = (dataPath && dataPathItem) ? [dataPathItem] : sdJson.data,
      foundEnts: IEntitySdj[] = sdJson.description.searchEntities(searchEnt),
      rtnAry: IDataSdj[] = [],
      subChildSearch = (children: IDataSdj[]) => {
        each(children, (dataObj: IDataSdj) => {
          const matchedEnt = find(foundEnts, {sdId: dataObj.sdId});
          if (dataObj.entity && matchedEnt) {
            if (!searchEnt.checkData) {
              rtnAry.push(dataObj);
            } else if (searchEnt.checkData && this.checkEntityData(searchEnt, dataObj, matchedEnt)){
              rtnAry.push(dataObj);
            }
          }
          if (dataObj.sdChildren && dataObj.sdChildren?.length > 0) {
            subChildSearch(dataObj.sdChildren);
          }
        });
      };

    if (data.length > 0) {
      subChildSearch(data);
      this.log("dataByEntity;" + foundEnts.length);
    }
    return rtnAry;
  }
  dataByItem(sdJson: IJsonSdj, searchItem: ItemSearch, dataPath?: string): IDataSdj[] {
    const dataPathItem: IDataSdj | undefined = (dataPath) ? sdJson.dataByPath(dataPath) : undefined,
      data: IDataSdj[] = (dataPath && dataPathItem) ? [dataPathItem] : sdJson.data,
      foundItems: IItemSdj[] = sdJson.description.searchItems(searchItem),
      rtnAry: IDataSdj[] = [],
      subChildSearch = (children: IDataSdj[]) => {
        each(children, (dataObj: IDataSdj) => {
          each(foundItems, (item: IItemSdj): boolean => {
            if (dataObj.entity && dataObj.entity.itemRefs[item.sdKey]) {
              rtnAry.push(dataObj);
              return false;
            } else {
              return true;
            }
          });
          if (dataObj.sdChildren && dataObj.sdChildren?.length > 0) {
            subChildSearch(dataObj.sdChildren);
          }
        });
      };

    if (data.length > 0) {
      subChildSearch(data);
      this.log("dataByEntity;" + foundItems.length);
    }
    return rtnAry;
  }

  validData(entity: IEntitySdj, dataSdj: DataJI, strict = false): boolean {
    let rtnVal = true,
      errorResults: string[] = this.findDataErrors(entity, dataSdj),
      splits: string[];

    each(errorResults, (errSptStr) => {
      splits = errSptStr.split(",");
      this.log(
        `SdjEntity '${entity.sdKey}' struct '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`
        , 3);
      rtnVal = false;
    });

    if (strict && errorResults?.length > 0) {
      const singleErr = errorResults.shift();
      if (singleErr) {
        splits = singleErr.split(",");
        throw new Error(
          `SdjData key '${entity.sdKey}' validate item '${splits[0]}' is '${splits[1]}' should be type '${splits[2]}'`);
      }
    }

    return rtnVal;
  }

  validStruct(entity: IEntitySdj, dataSdj: DataJI, parentRef: DataJI | undefined, strict = false): boolean {
    let rtnVal = true,
      errorResults: string[] = this.findStructErrors(entity, dataSdj, parentRef),
      splits: string[];

    each(errorResults, (errSptStr) => {
      splits = errSptStr.split(",");
      this.log(
        `Entity '${entity.sdKey}' with data '${splits[0]}' error '${splits[1]}' with data/ent '${splits[2]}'`
        , 3);
      rtnVal = false;
    });

    if (strict && errorResults?.length > 0) {
      const singleErr = errorResults.shift();
      if (singleErr) {
        splits = singleErr.split(",");
        throw new Error(
          `[SDJ] Entity '${entity.sdKey}' with data '${splits[0]}' error '${splits[1]}' with data/ent '${splits[2]}'`);
      }
    }

    return rtnVal;
  }

  /*    getRefByType<Type>(sdjDescript: IDescriptionSdj, idOrKey: number | string, type: string): Type | undefined {
        if (isUndefined(idOrKey) || (!isString(idOrKey) && !isNumber(idOrKey))) return undefined;
        const searchGroup = (type === "entity") ? sdjDescript.graph : sdjDescript.items;
        return (isNumber(idOrKey)) ? <Type>find(searchGroup, {sdId: idOrKey}) : <Type>find(searchGroup, {sdKey: idOrKey});
    }*/

  private findDataErrors(entity: IEntitySdj, dataJI: DataJI): string[] {
    let rtnErrStrs: string[] = [];
    each(entity.itemRefs, (itemRef: IItemSdj) => {
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
  private findStructErrors(entity: IEntitySdj, dataJI: DataJI, parentData: DataJI | undefined): string[] {
    if (!entity.description) {
      return [entity.sdKey + ",description,not available"]; 
    }
    let rtnErrs: string[] = [],
      childPresent: NumKeyStore<number> = {},
      parentEnt: IEntitySdj | undefined = (parentData) ? entity.description.getEntity(parentData.sdId)
        : undefined,
      checkIndexing: boolean = (parentEnt?.limiter === ESDJ_LIMIT.KEY_IDX);

    each(entity.childRefs, (childRef) => {
      childPresent[childRef.sdId] = 0;
    });

    if (!parentData && entity.parentIds.indexOf(0) === -1) {
      rtnErrs.push(entity.sdKey + ",requires parent,parent undefined");
    } else if (parentEnt && entity.parentIds.indexOf(parentEnt.sdId) === -1) {
      rtnErrs.push(entity.sdKey + ",entity does not allow parent," + parentEnt.sdKey);
    } else if (parentEnt && (!parentEnt.childIds || parentEnt.childIds.indexOf(entity.sdId) === -1)) {
      console.log(parentEnt.childIds + ":" + parentEnt + ":" + entity.sdId);
      rtnErrs.push(parentEnt.sdKey + ",parent does not allow child," + entity.sdKey);
    }

    each(dataJI.sdChildren, (childItem: DataJI, idx: number) => {
      const entRef = entity.childRefs[childItem.sdId];
      if (entity.childIds?.indexOf(childItem.sdId) === -1) {
        rtnErrs.push(entity.sdKey +",doesn't allow child," + childItem.sdId);
      }
      if (entRef) {
        if (entRef.limiter !== ESDJ_LIMIT.NONE) {
          childPresent[childItem.sdId] += 1;
        }
      } else {
        rtnErrs.push(entity.sdKey + ",unknown child entity," + childItem.sdKey);
      }
      if (checkIndexing && childItem.sdKey !== (SD_IDX + idx)) {
        rtnErrs.push(dataJI.sdKey + ",KEY_IDX out of order or wrong," + childItem.sdKey + "!=" + SD_IDX + idx);
      }
    });

    each(childPresent, (totals, sdId) => {
      const childEnt = entity.childRefs[sdId];
      if (childEnt) {
        switch(childEnt.limiter) {
        case ESDJ_LIMIT.REQ:
          if (totals === 0) {
            rtnErrs.push(entity.sdKey + ",missing req'd," + childEnt.sdKey);
          }
          break;
        case ESDJ_LIMIT.REQ_HIDE:
          if (totals !== 1) {
            rtnErrs.push(entity.sdKey + `,single req hidden 1 != '${totals}',` + childEnt.sdKey);
          }
          break;
        case ESDJ_LIMIT.ONE_NONE:
          if (totals > 1) {
            rtnErrs.push(entity.sdKey + ",can only have one or none," + childEnt.sdKey);
          }
          break;
        case ESDJ_LIMIT.REQ_ONE:
          if (totals > 1 || totals === 0) {
            rtnErrs.push(entity.sdKey + ",requires one single," + childEnt.sdKey);
          }
          break;
        default:
            // default would be NONE/SD_IDX
        }
      }

    });

    return rtnErrs;
  }


  private checkEntityData(searchEnt: EntitySearch, inData: IDataSdj, checkEnt: IEntitySdj): boolean {
    let rtnVal = false;
    // Assume single value array for now
    if (searchEnt.childIds) {
      if (find(inData.sdChildren, {sdId: checkEnt.sdId})) {
        rtnVal = true;
      }
    } else if (searchEnt.parentIds) {
      if (inData.parentRef && inData.parentRef.sdId === checkEnt.sdId) {
        rtnVal = true;
      }
    } else if (searchEnt.sdItems) {
      const checksdId = searchEnt.sdItems[0],
        foundItem = (checksdId) ? find(checkEnt.itemRefs, {sdId: checksdId}) : undefined;
      if (foundItem) {
        rtnVal = Boolean(!isUndefined(inData.getDataKey(foundItem.sdKey)));
      }
    } else {
      rtnVal = true;
    }

    return rtnVal;
  }
}
