/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  DataJI,
  DescriptionJI,
  EntityJI,
  EntitySearch,
  FuncLexGraphVerify,
  FuncStrNumVoid,
  ILexicon,
  ItemJI,
  ItemSearch,
  IValidator,
  SdJsonJI,
  SdKeyProps
} from "../core/interfaces.js";
import type {IDataSdj, IDescriptionSdj, IEntitySdj, IItemSdj, IJsonSdj} from "../classes/class-interfaces.js";
import {type ESDJ_CLASS, type ESDJ_LOG} from "../core/statics.js";
import {type ILogManager, Logger} from "../util/log.js";

export interface GraphVerifyMap {
    [key: string]: FuncLexGraphVerify;
}

// This is an Initial API for library functionality
// By default; SDJ-ESM does NOT store references to each created Sdj Description;
// these are stored with the local object on 1 to 1 basis
// However, there may be need to concern with collisions and multiple similar descriptions, efficiencies, etc.
//
// This API is for connectivity and future expansion-ability, and the
// esm core will call these in description creation, so these could be managed
// without forcing storage, need, methodology on SDJ-ESM
//
// However, by default SDJ-ESM only provides the API which does not store or do anything;
// See EmptySdjLibrary for implementation; added via options:
//

export declare interface ISdjLibrary {
    // eslint-disable-next-line no-use-before-define
    init: (log: FuncStrNumVoid, host: ISdjHost) => void;
    getDescList: () => string[];
    getDescByName: (descName: string) => IDescriptionSdj | undefined;
    // success/fail boolean on return
    storeDesc: (inputDesc: IDescriptionSdj) => boolean;
    removeDesc: (descName: string) => boolean;
}

export interface GlobalOptions {
    logMode?: ESDJ_LOG;
    loggerStore?: Logger[];
    logManager?: ILogManager;
}

export interface Settings {
    options?: GlobalOptions;
    library?: ISdjLibrary;
    lexicons?: ILexicon[];
}

export interface ISdjSearch {
    dataByPath: (sdJson: IJsonSdj, dataPath: string) => IDataSdj | undefined;
    dataByItem: (sdJson: IJsonSdj, searchItem: ItemSearch, dataPath?: string) => IDataSdj[];
    dataByEntity: (sdJson: IJsonSdj, searchEntity: EntitySearch, dataPath?: string) => IDataSdj[];
    validStruct: (entity: IEntitySdj, dataSdj: DataJI, parentRef: DataJI | undefined, strict?: boolean) => boolean
    validData: (entity: IEntitySdj, dataSdj: DataJI, strict?: boolean) => boolean
    searchItems: (sdjDescript: IDescriptionSdj, searchItem: ItemSearch) => IItemSdj[];
    searchEntities: (sdjDescript: IDescriptionSdj, searchEnt: EntitySearch) => IEntitySdj[];
}

export declare interface ISdjLexicons {
    readonly names: string[];
    getValidator: (validatorId: string) => IValidator;
    getByName: (lexId: string) => ILexicon | undefined;
    fullGraphJI: (inDescJI: DescriptionJI) => EntityJI[];
    newBaseItems: () => ItemJI[];
    fullItemJI: (inDescJI: DescriptionJI) => ItemJI[];
    validateRequires: (descJI: DescriptionJI) => boolean;
    verifyData: (inJson: SdJsonJI, strict: boolean) => boolean;
    validateGraph: (inDescJI: DescriptionJI) => boolean;
    calcSdKeyProps: (entity: IEntitySdj, graph: IEntitySdj[]) => SdKeyProps;
}

export type SdjJITypes = SdJsonJI | DescriptionJI | ItemJI | EntityJI | DataJI;
// eslint-disable-next-line no-use-before-define
export type SdjInterfaces = ISdjHost | IJsonSdj | IDescriptionSdj | IItemSdj | IEntitySdj | IDataSdj;
export type AllSdjTypes = SdjJITypes | SdjInterfaces;

export declare interface ISdjHost {
    makeDescript: (inDescJI: DescriptionJI, unlocked?: boolean) => IDescriptionSdj;
    library: ISdjLibrary;
    lexiconMgr: ISdjLexicons;
    searchMgr: ISdjSearch;
    getLogFunc: (name: string) => FuncStrNumVoid;
    gLog: FuncStrNumVoid;
    logs: ILogManager;
    fullDescription: (inDescJI: DescriptionJI) => DescriptionJI;
    verifyJIbyType: (ji: SdjJITypes, jiType: ESDJ_CLASS, strict?: boolean) => boolean;
    checkClassInst: (ji: AllSdjTypes, jiType: ESDJ_CLASS, isClass?: boolean ) => void;
    createDescription: (descJI: DescriptionJI) => IDescriptionSdj;
}
