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
    FuncJsonValueValidator, FuncStrNumVoid,
    Info,
    ItemJI,
    ItemSearch,
    JIValue,
    SdjLimiter,
    SdJsonJI,
    SdKeyProps
} from "../core/interfaces.js";

import type {ISdjHost, SdjJITypes} from "../global/global-interfaces.js";
import type {ESDJ_CLASS} from "../core/enums.js";


export declare interface IItemSdj {
    sdId: number;
    sdKey: string;
    type: string;
    limiter: SdjLimiter;
    // eslint-disable-next-line no-use-before-define
    description: IDescriptionSdj;
    genJI: () => ItemJI;
    validateValue: (inVal: JIValue) => boolean;
}
export declare interface IEntitySdj {
    sdId: number;
    sdKey: string;
    parentIds: number[];
    sdItems: number[];
    extendIds?: number[];
    childIds?: number[];
    sdProps?: SdKeyProps;
    limiter: SdjLimiter;
    // eslint-disable-next-line no-use-before-define
    description: IDescriptionSdj;
    getItemRefs: () => IItemSdj[];
    genJI:() => EntityJI;
}

export declare interface IDataSdj {
    sdKey: string;
    sdId: number;
    parentRef?: IDataSdj | undefined;
    sdChildren?: IDataSdj[];
    readonly depth: number;
    readonly path: string;
    entity: IEntitySdj | undefined;
    getItemRefs: () => IItemSdj[];
    genJI: (withChildren: boolean) => DataJI;
    validateData: (strict: boolean) => boolean;
}

export declare interface IDescriptionSdj {
    dataInfo: boolean;
    readonly name: string;
    readonly sdInfo: Info;
    readonly graph: IEntitySdj[];
    readonly host: ISdjHost;
    searchEntities: (searchEnt: EntitySearch) => IEntitySdj[];
    searchItems: (searchItem: ItemSearch) => IItemSdj[];
    getEntityProps: (entity: IEntitySdj) => SdKeyProps | undefined;
    getEntityRefs: (intAry: number[]) => IEntitySdj[];
    getEntityRefById: (entId: number) => IEntitySdj | undefined;
    getItemRefs: (intAry: number[]) => IItemSdj[];
    getValidator: (validatorId: string) => FuncJsonValueValidator;
    genJI: () => DescriptionJI;
    verifyParent: (sdData: IDataSdj, strict: boolean) => boolean;
    verifyJIbyType: (ji: SdjJITypes, jiType: ESDJ_CLASS, strict?: boolean) => boolean;
    // Sub items of description use this log access point
    log: FuncStrNumVoid
}

export declare interface IJsonSdj {
    readonly data: IDataSdj[];
    readonly description: IDescriptionSdj;
    readonly sdInfo: Info;
    dataByPath: (dataPath: string) => IDataSdj | undefined;
    dataByEntity: (searchEnt: EntitySearch, dataPath?: string) => IDataSdj[];
    dataByItem: (searchItem: ItemSearch, dataPath?: string) => IDataSdj[];
    genJI: () => SdJsonJI;
}

