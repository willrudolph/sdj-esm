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
import type {ESDJ_CLASS, ESDJ_LIMIT} from "../core/statics.js";

export declare interface IItemSdj {
    readonly sdId: number;
    readonly sdKey: string;
    readonly type: string;
    readonly limiter: ESDJ_LIMIT;
    readonly validator: IValidator;
    // eslint-disable-next-line no-use-before-define
    readonly description: IDescriptionSdj | undefined;
    genJI: () => ItemJI;
}
export declare interface IEntitySdj {
    readonly sdId: number;
    readonly sdKey: string;
    readonly parentIds: number[];
    readonly sdItems: number[];
    readonly extendIds: number[] | undefined;
    readonly childIds: number[] | undefined;
    readonly sdProps: SdKeyProps | undefined;
    readonly dataInfo: boolean | undefined;
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
    readonly sdKey: string;
    readonly sdId: number;
    readonly data: DataJI;
    readonly parentRef: IDataSdj | undefined;
    readonly sdChildren: IDataSdj[] | undefined;
    readonly hasChildren: boolean;
    readonly depth: number;
    readonly path: string;
    readonly entity: IEntitySdj | undefined;
    update: (replaceData: DataJI) => boolean;
    getChild:(childRef: string | number) => IDataSdj | undefined;
    isValid: () => boolean;
    getDataKey: (dataKey: string) => ExtAllowedValue;
    setDataKey: (dataKey: string, value: ExtAllowedValue) => void;
    genJI: (withChildren?: boolean) => DataJI;
}

export declare interface IDescriptionSdj {
    // vvv frozen/readonly when json locked
    name: string;
    graph: IEntitySdj[];
    items: IItemSdj[];
    sdInfo: Info;
    lang: string;
    // ^^^ frozen/readonly when json locked
    readonly host: ISdjHost;
    searchEntities: (searchEnt: EntitySearch) => IEntitySdj[];
    searchItems: (searchItem: ItemSearch) => IItemSdj[];
    getEntity: (entKeyNum: number | string) => IEntitySdj | undefined
    getEntityRefs: (entArray: number[] | string[]) => IEntitySdj[]
    getItemsByEntity: (entKeyNum: string | number) => IItemSdj[];
    getItem: (itemKeyNum: number | string) => IItemSdj | undefined
    getItemRefs: (itemArray: number[] | string[]) => IItemSdj[];
    genJI: () => DescriptionJI;
    calcSdKeyProps: (entity: IEntitySdj) => SdKeyProps;
    verifyJIbyType: (ji: SdjJITypes, jiType: ESDJ_CLASS, strict?: boolean) => boolean;
    // Sub items of description use this log access point, as log is labeled by descript name
    log: FuncStrNumVoid
}

export declare interface IJsonSdj {
    readonly lang: string;
    readonly data: IDataSdj[];
    readonly description: IDescriptionSdj;
    readonly sdInfo: Info;
    readonly isLocked: boolean;
    readonly isValid: boolean;
    dataByPath: (dataPath: string) => IDataSdj | undefined;
    dataByEntity: (searchEnt: EntitySearch, dataPath?: string) => IDataSdj[];
    dataByItem: (searchItem: ItemSearch, dataPath?: string) => IDataSdj[];
    lock: (setLock: boolean) => IDescriptionSdj | undefined;
    genJI: () => SdJsonJI;
}

