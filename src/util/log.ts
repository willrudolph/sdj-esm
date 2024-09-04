/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {ESDJ_LOG} from "../core/statics.js";
import type {FuncStrNumVoid} from "../core/interfaces.js";
import {find, isArray} from "lodash-es";

const ECODES: string[] = [
  "CRIT ", // 0 - Will throw Error in PROD
  "Error", // 1 - Logs in DEV/LIB / No error in Prod
  "Warn ", // 2 - Logs in DEV/LIB / No error in Prod
  "Lib. ", // 3 -
  "Debug", // 4
  "Trace", // 5
], ECODE_COLORS: string[] = [
  "font-weight: bold; color: #FF0000;",
  "font-weight: bold; color: #FF9900;",
  "font-weight: bold; color: #AAAA00;",
  "font-weight: bold; color: #AAFFAA;",
  "font-weight: bold; color: #FFFFFF;",
  "font-weight: normal; color: #FFFFFF;"
];

// Simple flexible logger manager
//
// Defaults to 0:0:0; will not store any logs and will not throw console statements.

export interface ILogManager {
  logMode?: ESDJ_LOG; // Current logging mode
  storeLvl: number; // 0-5 Debug level which will store in local logger
  consoleLvl: number; // 0-5 Debug level which will fire console.log()
  maxLogs: number; // fixed amount of details per logger
  getLogFunc: (name: string) => FuncStrNumVoid
}

export interface LogDetail {
  message: string;
  level: number;
  time: number;
  fromModule: string;
}

export class Logger {
  store?: LogDetail[];
  fileName: string;

  constructor(name: string) {
    const lastIdx: number = (name.lastIndexOf("\\") === -1)
      ? 0
      : name.lastIndexOf("\\") + 1;
    this.fileName = name.substring(lastIdx);
  }

  makeString(logDet: LogDetail): string {
    let asString = String(logDet.time),
      tBuild: string;

    while (asString.length < 6) {
      asString = "0" + asString;
    }

    tBuild = asString + "| " + ECODES[logDet.level];
    tBuild += " [" + logDet.fromModule + "]:";
    tBuild += logDet.message;

    return tBuild;
  }

  toConsole(logDet: LogDetail) {
    // eslint-disable-next-line no-console
    console.log("%c " + this.makeString(logDet), ECODE_COLORS[logDet.level]);
  }
}

export class LogManager implements ILogManager{
  storeLvl: number = 0;
  maxLogs: number = 0;
  consoleLvl: number = 0;

  private _startTime: number;
  private _loggerStore: Logger[];
  private _logMode: ESDJ_LOG;

  constructor(logMode: ESDJ_LOG, store: Logger[] | undefined = undefined) {
    this._loggerStore = (store && isArray(store)) ? store : [];
    this._startTime = Date.now();
    this.setLogMode(logMode);
    this._logMode = logMode;
  }

  set logMode(inMode: ESDJ_LOG) {
    this.setLogMode(inMode);
  }

  get logMode(): ESDJ_LOG {
    return this._logMode;
  }

  getLogFunc(name: string): FuncStrNumVoid {
    let existingLogger: Logger | undefined = find(this._loggerStore, {fileName: name});
    if (!existingLogger) {
      existingLogger = new Logger(name);
      this._loggerStore.push(existingLogger);
    }

    return (msg: string, dbLevel?: number):void => {
      if (!msg || msg === "" || (this.storeLvl === 0 && this.consoleLvl === 0)) {
        return;
      }
      if (existingLogger) {
        const logDetail: LogDetail = {
          message: msg,
          time: this.getTime(),
          fromModule: existingLogger.fileName,
          level: (dbLevel) ? <number>dbLevel : ECODES.length - 1
        };
        if (this.consoleLvl <= logDetail.level) {
          existingLogger.toConsole(logDetail);
        }
        if (this.storeLvl <= logDetail.level) {
          if (!existingLogger.store) {
            existingLogger.store = [];
          }
          existingLogger.store.push(logDetail);
          if (this.maxLogs !== -1 && existingLogger.store.length > this.maxLogs) {
            existingLogger.store.shift();
          }
        }
      }
    };
  }

  private getTime() {
    const now: number = Date.now();
    return now - this._startTime;
  }

  private setLogMode(setMode: ESDJ_LOG) {
    switch(setMode) {
    case ESDJ_LOG.DEV:
      this.storeLvl = 5;
      this.maxLogs = -1;
      this.consoleLvl = 5;
      break;
    case ESDJ_LOG.LIB:
      this.storeLvl = 3;
      this.maxLogs = 10;
      this.consoleLvl = 3;
      break;
    case ESDJ_LOG.TEST:
      this.storeLvl = 5;
      this.maxLogs = 5;
      this.consoleLvl = 5;
      break;
    case ESDJ_LOG.PROD:
      this.storeLvl = 0;
      this.maxLogs = 0;
      this.consoleLvl = 0;
      break;
    case ESDJ_LOG.RUN:
      this.storeLvl = 4;
      this.maxLogs = 20;
      this.consoleLvl = 0;
      break;
    default:
      // no default
    }
    this._logMode = setMode;
  }
}
