import {describe, expect, test} from "@jest/globals";
import {newInfoJI, UUID, validIntArray, isArrayWithLen} from "../dist/index.js";

describe("Validator Tests", () => {
    test("validIntArray tests", () => {
        expect(validIntArray()).toBe(false);
        expect(validIntArray([])).toBe(false);
        expect(validIntArray(true)).toBe(false);
        expect(validIntArray(1)).toBe(false);
        expect(validIntArray("")).toBe(false);
        expect(validIntArray(undefined)).toBe(false);
        expect(validIntArray({})).toBe(false);
        expect(validIntArray([false,true])).toBe(false);
        expect(validIntArray(["d","D", false])).toBe(false);
        expect(validIntArray([1,"D", false])).toBe(false);
        expect(validIntArray([1,3,4,"D", false])).toBe(false);
        expect(validIntArray([0,-2,-3,2,4,2])).toBe(false);

        expect(validIntArray([0])).toBe(true);
        expect(validIntArray([1])).toBe(true);
        expect(validIntArray([1,2,3,2,4,2])).toBe(true);
        expect(validIntArray([1,2,4])).toBe(true);
        expect(validIntArray([0,2,3,2,4,2])).toBe(true);

    });


    test('isArrayWithLen tests', () => {
        expect(isArrayWithLen()).toBe(false);
        expect(isArrayWithLen(undefined)).toBe(false);
        expect(isArrayWithLen(null)).toBe(false);
        expect(isArrayWithLen({})).toBe(false);
        expect(isArrayWithLen([])).toBe(false);
        expect(isArrayWithLen(1)).toBe(false);
        expect(isArrayWithLen(false)).toBe(false);
        expect(isArrayWithLen("dfsa")).toBe(false);

        expect(isArrayWithLen([1])).toBe(true);
        expect(isArrayWithLen(["@"])).toBe(true);
        expect(isArrayWithLen([{}])).toBe(true);
        expect(isArrayWithLen(["dfa","22", 3])).toBe(true);
        expect(isArrayWithLen([false, true])).toBe(true);
        expect(isArrayWithLen([[]])).toBe(true);
    });
});

/*
describe("Validator Tests", () => {
    test("validIntArray tests", () => {
        expect(validIntArray()).toBeFalsy();
    });
});*/
