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
    FuncJsonValueValidator,
    FuncLexGraphVerify, FuncStrNumVoid,
    ILexicon,
    ItemJI,
    SdJsonJI,
    SdKeyProps
} from "../core/interfaces.js";
import type {IDataSdj, IDescriptionSdj, IEntitySdj, IItemSdj, IJsonSdj} from "../classes/class-interfaces.js";
import {type ESDJ_CLASS, type ESDJ_LOG} from "../core/enums.js";
import {type ILogManager, Logger} from "../util/log.js";
import type {DescriptSearchResult} from "../classes/description.js";

export interface GraphVerifyMap {
    [key: string]: FuncLexGraphVerify;
}

export interface GlobalOptions {
    logMode?: ESDJ_LOG;
    loggerStore?: Logger[];
    logManager?: ILogManager;
}

export interface Settings {
    options?: GlobalOptions;
    lexicons?: ILexicon[];
}

export interface ISdjSettings {
    logs: ILogManager;
}
export declare interface ISdjLexicons {
    readonly names: string[];
    getValidator: (validatorId: string) => FuncJsonValueValidator;
    getByName: (lexId: string) => ILexicon | undefined;
    fullGraphJI: (inDescJI: DescriptionJI) => EntityJI[];
    newBaseItems: () => ItemJI[];
    fullItemJI: (inDescJI: DescriptionJI) => ItemJI[];
    validateRequires: (descJI: DescriptionJI) => boolean;
    validateGraph: (inDescJI: DescriptionJI) => boolean;
    simpleExtendProps: (entity: IEntitySdj, graph: IEntitySdj[]) => SdKeyProps;
}

export type SdjJITypes = SdJsonJI | DescriptionJI | ItemJI | EntityJI | DataJI;
// eslint-disable-next-line no-use-before-define
export type SdjInterfaces = ISdjHost | IJsonSdj | IDescriptionSdj | IItemSdj | IEntitySdj | IDataSdj;
export type AllSdjTypes = SdjJITypes | SdjInterfaces;

export declare interface ISdjHost {
    makeDescript: (inDescJI: DescriptionJI) => IDescriptionSdj;
    descriptions: IDescriptionSdj[];
    settings: ISdjSettings;
    lexiconMgr: ISdjLexicons;
    getLogFunc: (name: string) => FuncStrNumVoid;
    gLog: FuncStrNumVoid;
    searchDescriptions: (search: DescriptionSearch) => DescriptSearchResult;
    descriptByName: (name: string) => IDescriptionSdj | undefined
    addDescription: (addDesc: IDescriptionSdj) => void;
    validateGraph: (inDescJI: DescriptionJI) => DescriptionJI;
    verifyJIbyType: (ji: SdjJITypes, jiType: ESDJ_CLASS, strict?: boolean) => boolean;
    checkClassInst: (ji: AllSdjTypes, jiType: ESDJ_CLASS, isClass?: boolean ) => void;
    createDescription: (descJI: DescriptionJI) => IDescriptionSdj;
}
