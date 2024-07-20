/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  ExtAllowedValue,
  FuncJsonValueValidator,
  FuncValueInput,
  FuncValueOutput,
  Info,
  IValidator,
  JIValue,
  ValidatorJI
} from "./interfaces.js";
import {UUID, validTypeLexName} from "../util/func.std.js";
import type {__ANY, IntAny} from "./internal.js";
import {each, isArray, isBoolean, isFunction, isNull, isNumber, isObject, isString, isUndefined, uniq} from "lodash-es";
import {getValidObjFunc} from "./sdj-types.js";
import {MIN_INFO_DATE, MIN_NAME_CHAR} from "./statics.js";


/*

Validators are the inputs, outputs and allowed values for the Items in a description.
In order to provide comprehensive flexibility to lexicons validators are more than a simple true/false on a value.
Validators that exist in the core sdj library force common conventions, and are meant for base-level functionality of
the system. Using the default validators provide standard error functionality and standard
and tested performance expectations.

Lexicons, however can create wide range of options of what inputs/outputs can be and provide an extra level of
transformation can be customizable to user, code base, etc.

There are parts to a validator:
  - input: Default - straight null/undefined check pass-through to valid; Custom - transform any value to JIValid value
  - valid: Boolean check on JIValue stored in SdjData
  - output: Default - valid undefined/JIValue from sdj; Custom - transform valid JIValue to any value.

By default; upon place a value in an SDJ it will run the input function and then valid based off of the result.
Conversely - when pulling an SDJ it will first check the validity and then perform the output function on the data.
Validity will always be checked when going in and out of an SDJ Data value.

Sdj does not use "null" values to force simplicity, conversely it does use "undefined" as means to clear out, track,
maintain key:lists. By default; any value passed in as "null" entered into a validator will be auto set to undefined and not read.

Types can now be used as both storage type confirmation/validation, and custom lexicons be used in a variety of ways as
needed by a developer.

*/
export const defaultInputFunc: FuncValueInput = (inputVal: ExtAllowedValue): JIValue => {
  if (isNull(inputVal)) {
    throw new TypeError("[SDJ] null value is not allowed as JIValue;");
  }
  return <JIValue>inputVal;
};

export class SdjValidator implements IValidator {
  type: string;
  input: FuncValueInput = defaultInputFunc;
  valid: FuncJsonValueValidator;
  output?: FuncValueOutput;
  constructor(inIValid: ValidatorJI) {
    SdjValidator.VerifyJI(<IValidator>inIValid);
    this.type = inIValid.type;

    if (inIValid.input) {
      this.input = inIValid.input;
    }

    if (inIValid.output && isFunction(inIValid.output)) {
      this.output = inIValid.output;
    }

    if(inIValid.valid) {
      this.valid = inIValid.valid;
    } else {
      this.valid = this.defaultValid;
    }
  }

  private defaultValid(value: JIValue): boolean {
    return !isUndefined(value);
  }
  static VerifyJI(inIValid: IValidator) {
    if (!validTypeLexName(inIValid.type)) {
      throw new Error(`[SDJ] Lexicon validator type:'${inIValid.type}' invalid => requires (a-z0-9_-{4});`);
    }

    if (inIValid.output && !isFunction(inIValid.output)) {
      throw new TypeError("[SDJ] Validator output defined but is not function;");
    }

    if (inIValid.input && !isFunction(inIValid.input)) {
      throw new TypeError("[SDJ] Validator input defined but is not function;");
    }

    if (inIValid.valid && !isFunction(inIValid.valid)) {
      throw new TypeError("[SDJ] Validator valid defined but is not function;");
    }
  }
}
export const autoFailValidator = new SdjValidator(
  {type: "unmapped", input: defaultInputFunc, valid: () => false});

export function isJsonValue(value: IntAny): boolean {
  let rtnBool = false;
  if (isNumber(value) || isBoolean(value) || isString(rtnBool)) {
    rtnBool = true;
  } else if (isObject(value) || isArray(value)) {
    rtnBool = true;
  }
  return rtnBool;
}

export const validStrMin4: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
  Boolean(isString(checkVal) && (<string>checkVal).length > MIN_NAME_CHAR);



// Manual validation of any JavaScript array, confirms just isArray and length
export function isArrayWithLen<Type extends Array<__ANY>>(arrayLike: Type | undefined): boolean {
  const rtnBool = (arrayLike && isArray(arrayLike));
  return (rtnBool) ? arrayLike.length > 0 : false;
}

export const validLexiconArray = (checkValue: JIValue): boolean => {
  const rtnVal = true;
  if (!getValidObjFunc("array", "string")(checkValue)) {
    return false;
  }
  const uniqArray = uniq(<[]>checkValue);
  if ((<[]>checkValue).length !== uniqArray.length) {
    return false;
  }
  return rtnVal;
};

export const validInfoDate: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
  Boolean(isNumber(checkVal) && (<number>checkVal) > MIN_INFO_DATE);



export const isInfo = (inSet: Info, compress: boolean = false): boolean => {
  const keys: string[] = ["name", "uniqId", "created", "modified"],
    verifyActs: FuncJsonValueValidator[] = [validStrMin4, UUID.Valid, validInfoDate, validInfoDate];

  if (!inSet || Object.keys(inSet).length !== keys.length) {
    return false;
  }
  if (compress) {
    verifyActs[1] = UUID.ValidData;
  }
  each(inSet, (value: JIValue | undefined, key: string) => {
    const keyIdx = keys.indexOf(key),
      verType = (keyIdx !== -1) ? verifyActs[keyIdx] : () => false,
      isValid = (verType && keyIdx !== -1 && !isUndefined(value)) ? verType(value) : false;

    if (isValid) {
      keys.splice(keyIdx, 1);
      verifyActs.splice(keyIdx, 1);
    }
  });
  return (keys.length === 0);
};

