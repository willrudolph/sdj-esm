/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {DescriptionJI, SdJsonJI} from "../core/interfaces.js";
import {has, isString} from "./std.funcs.js";
import {DEF_DESC, DEF_JSON, SDJ_SCHEMA} from "../core/statics.js";
import {isInfo, validSDKey} from "../core/validators.js";
import {blankDescriptionJI, blankInfoJI} from "./immutables.js";
import {SdjDescription} from "../classes/description.js";
import type {IJsonSdj} from "../classes/class-interfaces";
import {SdJson} from "../classes/json";
import {SdjHost} from "../global/host";

export function blankJsonJI(jsonName: string, descOpt: DescriptionJI | SdjDescription | string | undefined = undefined): SdJsonJI {
  const descName = (descOpt && isString(descOpt)) ?
        <string>descOpt : DEF_DESC, fileName = (validSDKey(jsonName)) ? jsonName : DEF_JSON;
  let descJI: DescriptionJI;

  if (descOpt instanceof SdjDescription) {
    descJI = (<SdjDescription>descOpt).genJI();
  } else if (descOpt && has(descOpt, "sdInfo") && isInfo((<DescriptionJI>descOpt).sdInfo)) {
    SdjDescription.VerifyJI(<DescriptionJI>descOpt);
    descJI = <DescriptionJI>descOpt;
  } else {
    descJI = blankDescriptionJI(descName);
  }

  return {
    $id: <string>SDJ_SCHEMA[0], // json schema id
    description: descJI,
    sdInfo: blankInfoJI(fileName),
    data: []
  };
}
// Note: using this assumes SdjHost has been previously initialized.
export function genJson(inJson: SdJsonJI | DescriptionJI): IJsonSdj | undefined {
  let rtnJson: IJsonSdj | undefined;
  const sdjHost = SdjHost.getHost();
  try {
    rtnJson = new SdJson(inJson);
  } catch (err: unknown) {
    if (inJson.sdInfo && isInfo(inJson.sdInfo)) {
      sdjHost.gLog(`[SDJ] SdInfo file: ${inJson.sdInfo.name} checkJson error: ${String(err).toString()}`, 2);
    } else {
      sdjHost.gLog("[SDJ] checkJson error:" + String(err).toString(), 2);
    }
  }

  return rtnJson;
}
