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
    ExtAllowedValue,
    FuncStrNumVoid,
    GenKeyStore,
    Info,
    ItemJI,
    ItemSearch,
    IValidator,
    NumKeyStore,
    SdJsonJI,
    SdKeyProps
} from "../core/interfaces.js";

import type {ISdjHost, SdjJITypes} from "../global/global-interfaces.js";
import type {ESDJ_CLASS, ESDJ_LIMIT} from "../core/enums.js";


export declare interface IItemSdj {
    sdId: number;
    sdKey: string;
    type: string;
    limiter: ESDJ_LIMIT;
    // eslint-disable-next-line no-use-before-define
    description: IDescriptionSdj;
    genJI: () => ItemJI;
    validator: IValidator;
}
export declare interface IEntitySdj {
    sdId: number;
    sdKey: string;
    parentIds: number[];
    sdItems: number[];
    extendIds?: number[];
    childIds?: number[];
    readonly sdProps?: SdKeyProps;
    readonly limiter: ESDJ_LIMIT;
    readonly childRefs: NumKeyStore<IEntitySdj>;
    readonly itemRefs: GenKeyStore<IItemSdj>;
    validStruct: (dataSdj: DataJI, parentRef: DataJI | undefined, strict?:boolean) => boolean;
    validData: (dataSdj: DataJI, strict?: boolean) => boolean;
    // eslint-disable-next-line no-use-before-define
    description: IDescriptionSdj;
    genJI:() => EntityJI;
}

export declare interface IDataSdj {
    sdKey: string;
    sdId: number;
    parentRef: IDataSdj | undefined;
    sdChildren: IDataSdj[] | undefined;
    readonly hasChildren: boolean;
    readonly data: DataJI;
    readonly depth: number;
    readonly path: string;
    readonly entity: IEntitySdj | undefined;
    getChild:(childRef: string | number | IDataSdj) => IDataSdj | undefined;
    addChild: (childRef: IDataSdj) => void;
    isValid: () => boolean;
    // removeChild: (childRef: string | number | IDataSdj) => IDataSdj | undefined;
    getDataKey: (dataKey: string) => ExtAllowedValue;
    setDataKey: (dataKey: string, value: ExtAllowedValue) => void;
    genJI: (withChildren: boolean) => DataJI;
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
    getItemsByEntity: (entKeyNum: string | number) => IItemSdj[];
    getEntityRefById: (entId: number) => IEntitySdj | undefined;
    getItemRefs: (intAry: number[]) => IItemSdj[];
    getValidator: (validatorId: string) => IValidator;
    genJI: () => DescriptionJI;
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

