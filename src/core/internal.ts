/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Note: This file is deliberately not exported from index.js
// This contains internal TypeScript definitions that are only used via local reference and sparingly
//

// Baseline Primitives

export type IntPrimitive = undefined | string | boolean | number | null | void;
// eslint-disable-next-line no-use-before-define
export type IntAny = IntPrimitive | Function | IntAny[] | IntObject;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type __ANY = any;
export interface IntObject {
    [key: string]: IntAny;
}

export declare type numArrayOrUnDef = number[] | undefined;
export declare type IntFunction = (...args: IntAny[]) => IntAny;
export declare type FuncSymIntAny = (singleArg: IntAny) => IntAny;
export declare type FuncAnyIsValid = (singleArg: IntAny) => boolean;

export declare type FuncTwoVoid = (firstVal: IntAny, secondVal?: IntAny) => void;
export declare type FuncStrStr = (input: string) => string;
export declare type FuncArgsAnyValid = (...args: IntAny[]) => IntAny;
export declare type GenOneArg = <Type>(arg: Type) => Type;

export declare type RawFunction = (...args: unknown[]) => unknown;
