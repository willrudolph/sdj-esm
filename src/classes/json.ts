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
import type {IDataSdj, IDescriptionSdj, IJsonSdj} from "./class-interfaces.js";
import {SdjHost} from "../global/host.js";
import {SdjData} from "./data.js";
import {ESDJ_CLASS} from "../core/enums.js";
import {cloneDeep, each, has, isArray, isEmpty, isEqual, isObject} from "lodash-es";

export class SdJson implements IJsonSdj{
  _sdInfo: Info;
  _data: SdjData[] = [];
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
    return <IDataSdj[]>this._data;
  }

  get description(): IDescriptionSdj {
    return this._description;
  }

  get sdInfo(): Info {
    return this._sdInfo;
  }

  dataByPath(dataPath: string): IDataSdj | undefined {
    return this._host.searchMgr.dataByPath(this, dataPath);
  }
  dataByEntity(searchEnt: EntitySearch, dataPath?: string): IDataSdj[] {
    return this._host.searchMgr.dataByEntity(this, searchEnt, dataPath);
  }

  dataByItem(searchItem: ItemSearch, dataPath?: string): IDataSdj[] {
    return this._host.searchMgr.dataByItem(this, searchItem, dataPath);
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
    this.log("In Json: " + inJson.sdInfo.name);
    let quickLocRef: SdjData[] = [];
    each(inJson.data, (topDataJI: DataJI) => {
      const entRef = this._description.getEntity(topDataJI.sdId);
      if (entRef) {
        entRef.validStruct(topDataJI, undefined, true);
      } else {
        throw new Error(`[SDJ] data error '${topDataJI.sdKey}';`);
      }
    });
    each(inJson.data, (topDataJI: DataJI) => {
      const entRef = this._description.getEntity(topDataJI.sdId);
      let topBuildData: SdjData;
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
      this._data.push(topBuildData);
    });
    each(quickLocRef, (sdjData, idx) => {
      sdjData.$sdIndex = idx;
    });
  }

  private createSubData(childrenJI: DataJI[], parentRef: SdjData) {
    each(childrenJI, (childRef) => {
      const entRef = this._description.getEntity(childRef.sdId);
      if (entRef) {
        entRef.validStruct(childRef, parentRef.genJI(false), true);
      } else {
        throw new Error(`[SDJ] data error '${childRef.sdKey}';`);
      }
    });
    const quickLocRef: SdjData[] = [];

    each(childrenJI, (childJI: DataJI) => {
      const entRef = this._description.getEntity(childJI.sdId);
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
      parentRef.$addChild(newSdjData);
    });

    each(quickLocRef, (sdjData, idx) => {
      sdjData.$sdIndex = idx;
    });
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
