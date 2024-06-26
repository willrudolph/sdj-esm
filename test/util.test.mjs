import {ESDJ_LOG, UUID, getRegEx, newInfoJI} from "../dist/index.js";
import {expect, test, afterEach, beforeEach, describe} from "@jest/globals";
import {isString} from "lodash-es";


describe("Util Tests", () => {
  test("generator tests", () => {
    const newInfo = newInfoJI("temp");
    expect(newInfo).toMatchObject({
      name: "temp",
      uniqId: newInfo.uniqId,
      created: newInfo.created,
      modified: newInfo.modified
    })
    expect(newInfoJI("value")).toBeTruthy();
  });


  test('Valid UUIDs', () => {
    const uuidComp = UUID.GetCompress(),
      uuid = UUID.GetNew();

    expect(UUID.ValidData(UUID.GetEmpty(true))).toBe(true);
    expect(UUID.Valid(UUID.GetEmpty())).toBe(true);

    expect(UUID.ValidData(uuidComp)).toBe(true);
    expect(UUID.Valid(uuid)).toBe(true);

  });
  // Recheck isString from Lodash on removal of custom isString
  test('Lodash isString Re-Check', () => {
    expect(isString()).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(true)).toBe(false);
    expect(isString(false)).toBe(false);
    expect(isString(0)).toBe(false);
    expect(isString(-1)).toBe(false);
    expect(isString(() => {})).toBe(false);
    expect(isString(new Date())).toBe(false);
    expect(isString(/a/g)).toBe(false);
    expect(isString(new RegExp("a", "g"))).toBe(false);
    expect(isString(Object(5))).toBe(false);
    expect(isString(NaN)).toBe(false);
    expect(isString(Infinity)).toBe(false);

    let fakeString = {
      toString: function () { return "7"},
      valueOf: function () {return "42"}
    }
    fakeString[Symbol.toStringTag] = "String";

    expect(isString(fakeString)).toBe(false);

    expect(isString("foo")).toBe(true);
    expect(isString(Object("bob"))).toBe(true);
    expect(isString("")).toBe(true);

  });
});
