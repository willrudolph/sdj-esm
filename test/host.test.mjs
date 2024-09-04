import {ESDJ_LOG, SdjDescription, SdjHost, SdJson} from "../dist/index.js";
import {afterEach, describe, expect, test} from "@jest/globals";
import {isEqual} from "lodash-es";

describe("Sdj Host / Global Testing / Dictionary", () => {
  let hostSdj;

  afterEach(() => {
    SdjHost.setTestingInstance(undefined);
  })

  test('SdjHost Initialization', () => {
    hostSdj = SdjHost.getISdjHost()
    expect(hostSdj.library).toBeTruthy();
    expect(ESDJ_LOG.PROD).toBe(hostSdj.logs.logMode);
  });

  test("Singleton Lockout Tests", () => {
    expect(() => {
      new SdjHost(undefined);
    }).toThrow();
    expect(() => {
      SdjHost(undefined);
    }).toThrow();
    expect(() => {
      SdjHost();
    }).toThrow();
    expect(() => {
      new SdjHost([]);
    }).toThrow();
    expect(() => {
      new SdjHost({});
    }).toThrow();
    expect(() => {
      new SdjHost(new IntSingletonLock());
    }).toThrow();
  });

  test('ISdjHost Errors - clear A', () => {
    expect(() => {
      let initial = SdjHost.getISdjHost();
      let second = SdjHost.getISdjHost({});
    }).toThrow();
  });

  test('Host Error - clear B', () => {
    expect(() => {
      let initial = SdjHost.getHost();
      let second = SdjHost.getISdjHost({});
    }).toThrow();
  });

  test('Host Error - wrong place', () => {
    expect(() => {
      let initial = new SdjDescription(SdjHost.getHost());
    }).toThrow();
  });

  test('SdjHost Initialization', () => {
    hostSdj = SdjHost.getISdjHost()
    expect(hostSdj.library).toBeTruthy();
    expect(ESDJ_LOG.PROD).toBe(hostSdj.logs.logMode);
  });


});
