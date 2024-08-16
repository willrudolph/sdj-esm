/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {type ILogManager, LogManager} from "../util/log.js";
import {ESDJ_LOG} from "../core/statics.js";
import type {GlobalOptions, ISdjHost, ISdjSettings} from "./global-interfaces.js";
import {isFunction} from "lodash-es";

export class SdjSettings implements ISdjSettings{
  logs: ILogManager;

  constructor(private _host: ISdjHost, options: GlobalOptions | undefined | null) {
    if (options?.loggerStore && options?.logManager) {
      throw new Error("[SDJ] Create a custom ILogManager or alternate loggerStore, not both;");
    } else if (options?.logManager) {
      if (!isFunction(options.logManager.getLogFunc)) {
        throw new Error("[SDJ] custom ILogManager missing getLogFunc");
      } else {
        this.logs = options.logManager;
      }
    } else {
      const logMode:ESDJ_LOG = (options?.logMode) ? options.logMode : ESDJ_LOG.PROD;
      this.logs = new LogManager(logMode, options?.loggerStore);
    }
  }
}
