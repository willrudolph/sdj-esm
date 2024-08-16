/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


export const getRegEx = (regExName: string): RegExp => {
  let rtnRegEx: RegExp | undefined;

  switch(regExName) {

  // sdKey is the primary key string/reg-ex
  // for all reference key values inside the SDJ file
  // while semi-restrictive, provides for best range/flexibility
  //
  // at least 3/max 32;
  // - letter or "_$" allowed as first char
  // - "-_$" w/Nums + Chars allowed as middle chars
  // - "_$" w/Nums + Chars allowed as last char

  case "sdKey":
    rtnRegEx = /^[A-Za-z_$]{1}[A-Za-z0-9\-_$]{2,30}[A-Za-z0-9_$]{1}$/gm;
    break;

  // Used for Item types and Lexicon Names
  // at least 4 max 24; only lower case letters must start with letter
  // all lowercase to force simplified naming
  // may have _- as separators
  case "typeLexName":
    rtnRegEx = /^[a-z]{1}[a-z0-9_-]{2,22}[/a-z0-9]{1}$/gm;
    break;

  case "fileName":
  // Standard File name check for sdjJson files
  // eslint-disable-next-line no-control-regex
    rtnRegEx = /^([^\x00-\x1F!"$'\\(\\)*,\\/:;<>\\?\\[\\\]\\{\\|\\}\x7F]+)\.([a-zA-Z0-9]*)$/gm;
    break;
  // uuid for data objects
  case "uuidData":
    rtnRegEx = /^[a-zA-Z0-9]{5}[-]{1}[a-zA-Z0-9]{4}$/gm;
    break;
  case "uuid":
    rtnRegEx = /^[a-zA-Z0-9]{6}[-]{1}[a-zA-Z0-9]{5}[-]{1}[a-zA-Z0-9]{4}[-]{1}[a-zA-Z0-9]{7}$/gm;
    break;
  default:
    // deliberately no default
  }
  if(!rtnRegEx) {
    throw new Error(`[SDJ] regex missing '${regExName}'`);
  }
  return rtnRegEx;
};
