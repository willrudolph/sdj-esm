/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {ESDJ_LIMIT} from "./enums.js";
import type {SdjValidators} from "./validators.js";

// * Typescript Notes for SDJ *
// SDJ primarily focuses on JSON/JavaScript compatibility - not full range/all-possible TypeScript support
// Types/Interfaces defined for Internal are marked Int
// Full TypeScript compatibility should be set externally or provided by another library
//
// Naming Conventions
// [Int]Name - Types/Interfaces defined for Internal library use type-unsafe usually, not to be used outside of lib
// [Sdj]Name - Indicates a JS Class that requires construction/instantiation
// I[ClassName]Sdj - Indicates a TypeScript Interface for JavaScript Class object that contains code/refs
// [JI]Name - JSON Immutable typescript primitives Types
// Name[JI] - Indicates a Json/Immutable Interface that contains no code, usually a constructor input


// JI / JSON Immutable Primitives

// eslint-disable-next-line no-use-before-define
export type JIValue = JIPrimitive | JIObject | JIArray;
export interface JIObject {
  [key: string]: JIValue | undefined;
}
export type JIArray = JIValue[] | readonly JIValue[];
export type JIPrimitive = string | boolean | number | null;

export declare type ArrayFlatType = number[] | string[] | boolean[];
export declare type SdjLimiter = string | ESDJ_LIMIT;
export const SdjLimiterGroup: SdjLimiter[] = [ESDJ_LIMIT.NONE, ESDJ_LIMIT.REQ,
  ESDJ_LIMIT.REQ_HIDE, ESDJ_LIMIT.REQ_ONE, ESDJ_LIMIT.ONE_NONE, ESDJ_LIMIT.SYS_REQ];
export interface SdKeyProps {
  [key: string]: JIPrimitive;
}

// Standard Function signatures available outside of library; this list may grow
export declare type FuncStrNumVoid = (input: string, num?: number) => void;

export declare type FuncJsonValueValidator = (value: JIValue) => boolean;
export interface Info extends JIObject {
  name: string;
  uniqId: string;
  created: number;
  modified: number;
}

export interface InfoSearch {
  name?: string;
  uniqId?: string;
  created?: number;
  modified?: number;
}
// Core Self Description
export interface CoreSD {
  sdKey: string;
  sdId: number;
}

export interface CoreSDSearch {
  sdId?: number;
  sdKey?: string;
}

// eslint-disable-next-line no-use-before-define
export type DataJIValues = Info | DataJI[] | JIValue | undefined;
export interface DataJI extends CoreSD, JIObject {
  [key: string]: DataJIValues;
  sdInfo?: Info;
  sdChildren?: DataJI[];
}

export interface ItemSearch extends CoreSDSearch {
  type?: string;
  limiter?: SdjLimiter;
}

export interface ItemJI extends CoreSD, JIObject {
  type: string;
  limiter?: SdjLimiter;
}

export interface EntityCore {
  sdItems?: number[]; // Item ids associated with Entity, excluding extended
  extendIds?: number[]; // Entity sdId(s) from which the entity extends
  parentIds?: number[]; // Entity sdId(s) which this item can be a child of
  childIds?: number[]; // Entity sdId(s) which can be children
  limiter?: SdjLimiter;
  // assigned/optional key values that can be assigned to the entity
  sdProps?: SdKeyProps;
}

export interface EntityJI extends EntityCore, CoreSD, JIObject {}

export interface EntitySearch extends CoreSDSearch, EntityCore {}
export declare type FuncLexGraphVerify = (entities: EntityJI[]) => boolean;
export declare type FuncLexDataVerify = (entities: EntityJI[]) => boolean;
export interface ILexicon {
  name: string;
  required?: string[];
  entities?: EntityJI[];
  items?: ItemJI[];
  validators?: SdjValidators;
  graphVerify?: FuncLexGraphVerify;
  dataVerify?: FuncLexDataVerify;
}

export interface DescriptionJI extends JIObject {
  sdInfo: Info;
  items: ItemJI[];
  graph: EntityJI[];
  dataInfo?: boolean;
  lexicons?: string[];
  lang?: string;
}

export interface DescriptionSearch {
  name?: string
  sdInfo?: InfoSearch;
  hasEntity?: EntitySearch
  hasItem?: ItemSearch
  usesLexicons?: string[]
  lang?: string;
}


// Self Described JSON Immutable
export interface SdJsonJI extends JIObject {
  $id: string // json schema id
  description: DescriptionJI;
  sdInfo: Info;
  data?: DataJI[];
}

