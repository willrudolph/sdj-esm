/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DataJI,
  DescriptionJI,
  EntitySearch,
  FuncStrNumVoid,
  Info,
  ItemSearch,
  SdJsonJI
} from "../core/interfaces.js";
import {UUID} from "../util/func.std.js";

import {SDJ_SCHEMA} from "../core/statics.js";
import {blankInfoJI, genInfoJI, isBlankInfo, newInfoJI} from "../util/immutables.js";
import {checkResetInfo, verifyUniqKeys} from "../util/verify.js";
import {restrictToAllowedKeys} from "../core/restrict.js";
import {isInfo} from "../core/validators.js";
import type {IDataSdj, IDescriptionSdj, IEntitySdj, IItemSdj, IJsonSdj} from "./class-interfaces.js";
import {SdjHost} from "../global/host.js";
import {SdjData} from "./data.js";
import {ESDJ_CLASS} from "../core/enums.js";
import {cloneDeep, each, find, has, isArray, isEmpty, isEqual, isObject, isString, isUndefined} from "lodash-es";

export class SdJson implements IJsonSdj{
  _sdInfo: Info;
  _data: IDataSdj[] = [];
  _description: IDescriptionSdj;

  private _host: SdjHost = SdjHost.getHost();
  private readonly log: FuncStrNumVoid;

  constructor(inJI: SdJsonJI | DescriptionJI) {
    const initKey: string = (inJI.sdInfo?.name) ? inJI.sdInfo.name : "",
      inJson: SdJsonJI = this.modifyInJson(inJI);
    this.log = this._host.getLogFunc(`sdJson:${initKey}`);
    this.log("Initialize");
    if (<SdJsonJI>inJson instanceof SdJson) {
      throw new Error("[SDJ] input for SdJson cannot be another SdJson;");
    }
    SdJson.VerifyJI(inJson);
    if (isBlankInfo(inJson.sdInfo)) {
      inJson.sdInfo = newInfoJI(inJson.sdInfo.name);
    }
    this._description = this._host.makeDescript(inJson.description);
    this._sdInfo = genInfoJI(inJson.sdInfo);
    this._host.lexiconMgr.verifyData(inJson, true);
    this.build(inJson);
    this.log("JSON Build Complete");
  }

  get data(): IDataSdj[] {
    return this._data;
  }

  get description(): IDescriptionSdj {
    return this._description;
  }

  get sdInfo(): Info {
    return this._sdInfo;
  }

  // Excepts either / or .
  // clears or ignores first /.

  dataByPath(dataPath: string): IDataSdj | undefined {
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

    let rtnData: IDataSdj | undefined = find(this._data, {sdKey: String(routeSplit[0])});
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
  dataByEntity(searchEnt: EntitySearch, dataPath?: string): IDataSdj[] {
    const dataPathItem: IDataSdj | undefined = (dataPath) ? this.dataByPath(dataPath) : undefined,
      data: IDataSdj[] = (dataPath && dataPathItem) ? [dataPathItem] : this._data,
      foundEnts: IEntitySdj[] = this._description.searchEntities(searchEnt),
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

  dataByItem(searchItem: ItemSearch, dataPath?: string): IDataSdj[] {
    const dataPathItem: IDataSdj | undefined = (dataPath) ? this.dataByPath(dataPath) : undefined,
      data: IDataSdj[] = (dataPath && dataPathItem) ? [dataPathItem] : this._data,
      foundItems: IItemSdj[] = this._description.searchItems(searchItem),
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

  genJI(): SdJsonJI {
    const rtnJsonJI: SdJsonJI = {
      $id: <string>SDJ_SCHEMA[0],
      description: this._description.genJI(),
      sdInfo: genInfoJI(this._sdInfo),
      data: []
    };
    each(this._data, (sdjData: IDataSdj) => {
      // @ts-expect-error .. just defined it above
      rtnJsonJI.data.push(sdjData.genJI(true));
    });

    return rtnJsonJI;
  }

  private build(inJson: SdJsonJI) {
    this.log("In Json: " + inJson.sdInfo.name)
    let quickLocRef: SdjData[] = [];
    each(inJson.data, (topDataJI: DataJI) => {
      const entRef = this._description.getEntityRefById(topDataJI.sdId);
      entRef!.validStruct(topDataJI, undefined, true);
    });
    each(inJson.data, (topDataJI: DataJI) => {
      const entRef = this._description.getEntityRefById(topDataJI.sdId);
      let topBuildData: SdjData | IDataSdj;
      if (!entRef) {
        throw new Error(`[SDJ] Description '${this._description.name}' has no entity with sdId:'${topDataJI.sdId}';`);
      }
      try {
        topBuildData = new SdjData(topDataJI, entRef, undefined);
      } catch(err) {
        throw new Error(`[SDJ] SdJson Data create/valid err:${err};`);
      }

      if (topDataJI.sdChildren) {
        this.createSubData(topDataJI.sdChildren, topBuildData);
      }
      quickLocRef.push(<SdjData>topBuildData);
      this._data.push(<IDataSdj>topBuildData);
    });
    each(quickLocRef, (sdjData, idx) => {
      sdjData.$sdIndex = idx;
    });
  }

  private createSubData(childrenJI: DataJI[], parentRef: IDataSdj) {
    each(childrenJI, (childRef) => {
      const entRef = this._description.getEntityRefById(childRef.sdId);
      entRef!.validStruct(childRef, parentRef.genJI(false), true);
    });
    const quickLocRef: SdjData[] = [];

    each(childrenJI, (childJI: DataJI) => {
      const entRef = this._description.getEntityRefById(childJI.sdId);
      let newSdjData: SdjData;
      if (!entRef) {
        throw new Error(`[SDJ] Description '${this._description.name}' has no entity with sdId:'${childJI.sdId}';`);
      }
      try {
        newSdjData = new SdjData(childJI, entRef, parentRef);
      } catch (err) {
        throw new Error(`[SDJ] SdJson Data create/valid err:${err};`);
      }
      if (childJI.sdChildren) {
        this.createSubData(childJI.sdChildren, newSdjData);
      }
      quickLocRef.push(newSdjData);
      parentRef.addChild(newSdjData);
    });

    each(quickLocRef, (sdjData, idx) => {
      sdjData.$sdIndex = idx;
    })
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

    return rtnVal
  }

  private modifyInJson(inJI: SdJsonJI | DescriptionJI): SdJsonJI {
    let rtnJson: SdJsonJI,
      descOrJson: SdJsonJI | DescriptionJI,
      descJI: DescriptionJI;

    if (!isObject(inJI)) {
      throw new Error("[SDJ] Input JSON is not an object;");
    } else {
      descOrJson = <SdJsonJI | DescriptionJI>inJI;
      if (!has(descOrJson, "items") && !has(descOrJson, "graph") && has(descOrJson, "description")) {
        rtnJson = <SdJsonJI>descOrJson;
        if (!rtnJson.data || !isArray(rtnJson.data)) {
          rtnJson = cloneDeep(rtnJson);
          rtnJson.data = [];
        }
      } else if (!inJI.data && inJI.sdInfo && has(descOrJson, "items") && has(descOrJson, "graph")) {
        descJI = <DescriptionJI>descOrJson;
        descJI.sdInfo = checkResetInfo(inJI.sdInfo);
        try {
          this._host.verifyJIbyType(descJI, ESDJ_CLASS.DESCRIPTION, true);
          this._host.checkClassInst(descJI, ESDJ_CLASS.DESCRIPTION, false);
          rtnJson = {
            $id: <string>SDJ_SCHEMA[0],
            sdInfo: blankInfoJI(descJI.sdInfo.name + UUID.GetCompress()),
            description: descJI,
            data: []
          };
        } catch (e) {
          throw new Error(`[SDJ] Improper Description :${e}`);
        }
      } else {
        // don't know what it is - send through std error
        rtnJson = <SdJsonJI>inJI;
      }
    }

    return rtnJson;
  }

  static VerifyJI(inJson: SdJsonJI) {
    if (!isEmpty(inJson) && !isEqual(inJson, {})) {
      if (SDJ_SCHEMA.indexOf(inJson.$id) === -1) {
        throw new Error(`[SDJ] Json: Unknown Schema '${inJson.$id}';`);
      }
    } else {
      throw new Error("[SDJ] Json: empty or blank;");
    }

    if (!isInfo(inJson.sdInfo)) {
      throw new Error("[SDJ] Json: missing sdInfo;");
    }

    if (!inJson.description || !inJson.description.sdInfo || !isInfo(inJson.description.sdInfo)) {
      throw new Error("[SDJ] Json: missing description or description.sdInfo;");
    }

    if (!inJson.data || !isArray(inJson.data)) {
      throw new Error("[SDJ] Json: data must be in array format;");
    } else if (isArray(inJson.data) && inJson.data.length > 0 && !verifyUniqKeys(inJson.data, true)) {
      throw new Error("[SDJ] Json: top level data has duplicate child sdKeys;");
    }
    restrictToAllowedKeys("SdJsonJI:" + inJson.sdInfo.name,
      ["$id", "description", "sdInfo", "data"], inJson);
  }
}
