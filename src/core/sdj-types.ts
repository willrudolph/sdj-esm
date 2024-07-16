/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {DEF_MAX_STR_LEN, MAX_OBJ_ARY_LEN, STR_LEN_LNG, STR_LEN_SHRT} from "./statics.js";
import type {FuncJsonValueValidator, JIValue} from "./interfaces.js";
import {each, isArray, isBoolean, isNumber, isObject, isString, isUndefined} from "lodash-es";
import type {IntAny} from "./internal.js";
import {getRegEx} from "../util/regex.js";
import {ESDJ_TYPE} from "./enums.js";

export const validSDKey = (checkVal: JIValue) => {
    const regEx = getRegEx("sdKey");
    return isString(checkVal) ? regEx.test(<string>checkVal) : false;
};
export const validUtcDate: FuncJsonValueValidator = (checkVal: JIValue):boolean =>
    Boolean(isNumber(checkVal));
export const validBoolean: FuncJsonValueValidator = (checkVal: JIValue): boolean => {
    let rtnValid = false;
    if (isString(checkVal)) {
        // No allowed "true"/"FALSE" as strings for uniformity and by spec.
        rtnValid = false;
    } else if (isBoolean(checkVal)) {
        rtnValid = true;
    }
    return rtnValid;
};
export const getValidObjFunc = (objType: string, itemType: string): FuncJsonValueValidator =>
    (checkVal: JIValue): boolean => {
        let rtnValid = false,
            typeArray = ["string", "boolean", "number", "integer", "int-pos"],
            validFuncArray= [getStrValidLenFunc(DEF_MAX_STR_LEN), validBoolean, getValidNumberFunc("none"),
                getValidNumberFunc("int"), getValidNumberFunc("int", true)],
            funcIdx = typeArray.indexOf(itemType),
            activeFunc: FuncJsonValueValidator | undefined =
                (funcIdx !== -1) ? validFuncArray[typeArray.indexOf(itemType)] : undefined;

        if (typeArray.indexOf(itemType) === -1 || !activeFunc) {
            throw new Error("--- Internal Dev error resolve missing:" + itemType);
        }

        // Yes, for now we will verify each array value
        if (objType === "array" && isArray(checkVal)) {
            // Yes, for now we will verify each key value
            const len = (<IntAny[]>checkVal).length;
            if (len && len < MAX_OBJ_ARY_LEN) {
                rtnValid = true;
                each(<IntAny[]>checkVal, (idxValue: IntAny) => {
                    if (activeFunc) {
                        if (!activeFunc(<JIValue>idxValue)) {
                            rtnValid = false;
                            return false;
                        }
                    }
                    return true;
                });
            }
        } else if (objType === "object" && isObject(checkVal)) {
            const len = Object.keys(<object>checkVal).length;
            // stupid long key names are not allowed either
            if (len && len < MAX_OBJ_ARY_LEN) {
                rtnValid = true;
                each(<object>checkVal, (value: JIValue, key: string) => {
                    if (activeFunc) {
                        if ((!isString(key) || (<string>key).length > DEF_MAX_STR_LEN) || !activeFunc(value)) {
                            rtnValid = false;
                            return false;
                        }
                    }
                    return true;
                });
            }
        }

        return rtnValid;
    };


/*
  Description arrays [extendIds, sdItems, parentIds, childIds]
  are all limited to unique positive number arrays

  validIntArray only confirms positive integer array is present, not uniqueness
 */
export const validIntArray = (checkValue: number[] | undefined): boolean => {
    const rtnBool = (checkValue && isArray(checkValue) && checkValue.length > 0);
    return (rtnBool) ? getValidObjFunc("array", "int-pos")(<number[]>checkValue) : false;
};


export const getValidNumberFunc = (preciseType: string, posOnly: boolean = false): FuncJsonValueValidator =>
    (checkVal: JIValue): boolean => {
        let rtnValid = false;
        if (isNumber(checkVal)) {
            rtnValid = true;
            switch (preciseType) {
                case "float":
                    rtnValid = Number.isFinite(checkVal);
                    break;
                case "int":
                    rtnValid = Number.isFinite(checkVal) && Math.floor(checkVal) === checkVal;
                    break;
                default:
                // 'none' is also default
            }
        }
        if (rtnValid && posOnly) {
            rtnValid = (<number>checkVal >= 0);
        }
        return rtnValid;
    };

export const getStrValidLenFunc = (maxLength: number): FuncJsonValueValidator =>
    (checkVal: JIValue): boolean => Boolean(isString(checkVal) && (<string>checkVal).length < maxLength);




// Fixed name of Std SDJ Items; with all common "alternate spellings" referenced that will be checked and forced
// to common/standardized (first value)
// This is to prevent libraries and individual files from ever close (or near) default SDJ Item validation/confirmation
// also checks "-" -> "_"
// This check occurs after the standard regex for validator values (regEx "typeLexName"),

export interface DefaultInitItem {
    item: ESDJ_TYPE;
    similarNames: string[];
    valid: FuncJsonValueValidator;
}
export const SdjDefaultTypes: DefaultInitItem[] = [{
    // sdKey; force close 'name' type to use sdKey
        item: ESDJ_TYPE.KEY,
        similarNames: ["sd-k", "sd--key", "sd_-key", "sd-_key", "s-d-k", "s-d-key", "sd-ke"],
        valid: validSDKey
    }, {
    // sdId; force close 'name' type to use sdId
        item: ESDJ_TYPE.ID,
        similarNames: ["sd-id", "sd--id", "sd-_id", "sd_-id", "sd-i", "s-d-id", "s-d_id", "s_d-id"],
        valid: getValidNumberFunc("int")
    }, {
    // standard JS number
        item: ESDJ_TYPE.NUM,
        similarNames: ["number", "num-b", "num-ber", "num-b"],
        valid: getValidNumberFunc("none"),
    }, {
    // number forced/confirmed to integer
        item: ESDJ_TYPE.INT,
        similarNames: ["intr", "integr", "integ", "integer", "num-int", "int-num", "intnum", "numint", "numbint", "intnumb"],
        valid: getValidNumberFunc("int"),
    }, {
    // number parsed for floating point
        item: ESDJ_TYPE.FLT,
        similarNames: ["flop", "float", "fltpt", "num-flt", "num-float", "floatnum", "fltnum"],
        valid: getValidNumberFunc("float"),
    }, {
    // standard boolean
        item: ESDJ_TYPE.BOOL,
        similarNames: ["boolean", "bolean", "boolea", "boole", "b-oo", "bo-l"],
        valid: validBoolean
    }, {
    // string default - max length 64 characters
        item: ESDJ_TYPE.STR,
        similarNames: ["string", "stringdef", "str-def", "string-def"],
        valid: getStrValidLenFunc(DEF_MAX_STR_LEN),
    }, {
    // string large - max 1000 characters
        item: ESDJ_TYPE.STRL,
        similarNames: ["str-lg", "st-lg", "str-l", "string-lg", "string-l"],
        valid: getStrValidLenFunc(STR_LEN_LNG)
    }, {
    // string short - max length 16 characters
        item: ESDJ_TYPE.STRS,
        similarNames: ["str-sh", "st-sm", "str-sm", "str-s", "string-sm", "string-s", "string-sh"],
        valid: getStrValidLenFunc(STR_LEN_SHRT)
    }, {
    // UTC date format - throws out old/bad dates
        item: ESDJ_TYPE.UTC,
        similarNames: ["date-utc", "dateutc", "utcdate", "utc-date", "u-date", "date-u"],
        valid: validUtcDate
    }, {
    // Array of boolean values [true,false,..]
        item: ESDJ_TYPE.ARY_BOOL,
        similarNames: ["ary-bol", "arraybol", "array-bol"],
        valid: getValidObjFunc("array", "boolean")
    }, {
    // Array of number values [33, 4, 5.3, .322, 0, -2...]
        item: ESDJ_TYPE.ARY_NUM,
        similarNames: ["ary-num", "arraynum", "array-num"],
        valid: getValidObjFunc("array", "number")
    }, {
    // TODO Confirm Short and long as they use the same function
    // Array string Short - ["alpha", "beta", "gamma",...] - each entry max string length of 16 characters
        item: ESDJ_TYPE.ARY_STR_SH,
        similarNames: ["arystrsht", "arraystr", "array-str", "ary-str-s","array-str-s"],
        valid: getValidObjFunc("array", "string")
    }, {
    // Array string Default - ["alpha..", "beta..", "gamma...", ...] - each entry max string length of 64 characters
        item: ESDJ_TYPE.ART_STR_DF,
        similarNames: ["arystr", "ary-str", "array-def", "arystrdef", "array-str-d"],
        valid: getValidObjFunc("array", "string"),
    }, {
    // Obj:key Strings - {"alpha": "text1", "beta": "text2", ...}  each entry max string length of 64 characters
        item: ESDJ_TYPE.OBJ_STR,
        similarNames: ["obj-str", "object-str", "objectstr"],
        valid: getValidObjFunc("object", "string")
    }, {
    // Obj:key Booleans - {"alpha": true, "beta": false, ...}
        item: ESDJ_TYPE.OBJ_BOOL,
        similarNames: ["obj-bool", "object-bool", "objectbool", "obj-bool"],
        valid: getValidObjFunc("object", "boolean"),
    }, {
    // Obj:key Number(JS)s - {"alpha": 1, "beta": 2, ..}
        item: ESDJ_TYPE.OBJ_NUM,
        similarNames: ["obj-num", "object-num", "objectnum", "obj-number"],
        valid: getValidObjFunc("object", "number"),
    }, {
    // SdIndex Key validator
        item: ESDJ_TYPE.INDEX,
        similarNames: ["sdjidx", "sdidx,", "sd-idx", "sdj-idx", "sd--idx", "sdinx", "sdjindx", "sdjindex"],
        valid: getValidNumberFunc("int")
    }
];

export const rtnSdjItemName = (nameStr: string): string | undefined => {
    let rtnName: string | undefined = undefined;

    each(SdjDefaultTypes, (itemType: DefaultInitItem) => {
        if (itemType.item === nameStr) {
            return false;
        } else {
            each (itemType.similarNames, (strVal: string ) => {
                const underScoreCheck = strVal.replace("-", "_");
                if (strVal === nameStr || nameStr === underScoreCheck) {
                    rtnName = itemType.item;
                    return false;
                } else {
                    return true;
                }
            });
            return !!isUndefined(rtnName);
        }
    });

    return rtnName;
};
