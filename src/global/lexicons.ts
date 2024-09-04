/*
  Copyright (c) 2023-2024 Will Rudolph <@willrudolph.com>

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type {
  CoreSD,
  DescriptionJI,
  EntityJI,
  GenKeyStore,
  ILexicon,
  ItemJI,
  IValidator,
  SdJsonJI,
  SdKeyProps,
  ValidatorJI
} from "../core/interfaces.js";
import {validTypeLexName} from "../util/func.std.js";
import {autoFailValidator, SdjValidator,} from "../core/validators.js";
import {getRegEx} from "../util/regex.js";
import {verifySequenceKeys, verifyUniqKeys} from "../util/verify.js";
import {BASE_ITEMS_JI, ESDJ_CLASS} from "../core/statics.js";
import {
  assign,
  clone,
  cloneDeep,
  each,
  find,
  findIndex,
  has,
  isArray,
  isEmpty,
  isFunction,
  isObject,
  isString,
  isUndefined,
  map,
  uniq
} from "lodash-es";
import {genSdKeyProps} from "../util/immutables.js";
import {restrictToAllowedKeys} from "../core/restrict.js";
import type {ISdjHost, ISdjLexicons} from "./global-interfaces.js";
import type {IEntitySdj} from "../classes/class-interfaces.js";
import {type DefaultInitItem, rtnSdjItemName, SdjDefaultTypes, validStrArray} from "../core/sdj-types.js";

/*
  SdjLexicons are the dictionary/library extension system of SDJ.

  These are in code javascript libraries/APIs that can be used by developers to add/customize additional
  Entities, Items, Validation, and Graph Verification.

  Each DescriptionJI object has an optional string[] "lexicons" which references the required lexicons needed to
  provide and instantiate the SdjDescription. Lexicon name order is critical - when the description is assembled
  in memory; DataObj.sdId & Entity/Item sdId's are expected to line up correctly. Errors will still be thrown for missing
  items or entities references in the data description.

  Sdj provides a default set of Items/Validations that anticipates many expected simple use cases.
  However, given the openness of the JSON format there's a myriad of other options.
  The internal SDJ set reserves and reverts and close name approximations of existing keys/validators on description creation.
  On lexicon instantiation it will throw errors on when attempt to assign any of these values or previously added lexicon name values.

  See core/validators.ts for more info about reserved words for items.


  The Graph verification routines are run in sequential order based on DescriptionJI.lexicons that are run
  after collection (as GraphJI) are fed back into the lexicon library (via graphVerify) before construction and
  instantiation completes. Developers can state that their lexicons also require other lexicons (and in which order).

  The SdjEditor will handle many construction tasks based on the internal rules and allow lexicon attachment and ordering.
  It also comes with additional optional lexicons.

  Entities in Lexicons are verified one after another; and validated against all items available based on lexicon add order.
  Make sure that any entities are added in reference order; for example if the first item extends an entity that isn't
  loaded or available, then errors will be thrown.

  See examples for lexicon options, use and building.

  SDJ is build to be FAULT INTOLERANT. While a developer could easily build (by hand) a structure that would break various
  rules, JS errors will be consistently thrown for things like -
  - Missing / unreferenced Entities
  - Missing / unreferenced Items
  - Missing required-s
  - Violations of SDJ standard ruleset

 */


export class SdjLexicons implements ISdjLexicons {
  private _names: string[] = [];
  private _lexicons: ILexicon[] = [];
  private _validators: GenKeyStore<IValidator> = {};
  private readonly _baseItemIJs: ItemJI[] = BASE_ITEMS_JI;

  constructor(private _host: ISdjHost, addLexicons: ILexicon[] | undefined | null) {
    // build default validators
    each(SdjDefaultTypes, (defaultItem: DefaultInitItem) => {
      this._validators[defaultItem.item] = new SdjValidator({
        type: defaultItem.item,
        valid: defaultItem.valid
      });
    });

    if (addLexicons && addLexicons.length > 0) {
      // check required
      let mentionedReqs: string[] = [];
      each(addLexicons, (lexicon: ILexicon) => {
        SdjLexicons.VerifyJI(lexicon);
        if (lexicon.required) {
          mentionedReqs = mentionedReqs.concat(lexicon.required);
        }
      });
      if (mentionedReqs.length > 0) {
        mentionedReqs = uniq([...mentionedReqs]);
        each(mentionedReqs, (mentionedName) => {
          const lexRef: ILexicon | undefined = find(addLexicons, {name: mentionedName});
          if (!lexRef) {
            throw new Error(`[SDJ] a Lexicon.required mentions '${mentionedName}' which is not provided;`);
          }
        });
      }
      each(addLexicons, (lexicon: ILexicon) => this.buildLexicon(lexicon));
    }
  }

  get names(): string[] {
    return this._names;
  }

  getValidator(validatorType: string): IValidator {
    let rtnValidator = this._validators[validatorType];
    if (isUndefined(rtnValidator)) {
      this._host.gLog(`Lexicons: Unknown validator type '${validatorType}' return autoFailValidator`, 3);
      rtnValidator = autoFailValidator;
    }
    return rtnValidator;
  }
  getByName(lexName: string): ILexicon | undefined {
    const lexicon = find(this._lexicons, {name: lexName});
    if (!this._lexicons) {
      throw new Error("No SdjLexicons added - must be enabled/added on Sdj Initialization;");
    } else if (!lexicon) {
      this._host.gLog(`SdjLexicon: missing lexicon ${lexName}`, 4);
      return undefined;
    }
    return lexicon;
  }

  fullGraphJI(inDescJI: DescriptionJI): EntityJI[] {
    let rtnGraph: EntityJI[] = [];
    if (inDescJI.lexicons) {
      each(inDescJI.lexicons, (lexName: string) => {
        const actLexicon: ILexicon | undefined = find(this._lexicons, {name: lexName});
        let addEnts: EntityJI[];
        if (actLexicon && actLexicon.entities) {
          addEnts = cloneDeep(actLexicon.entities);
          rtnGraph = rtnGraph.concat(addEnts);
        } else {
          throw new Error("[SDJ] Unknown error on lexicon read");
        }
      });
    }
    if (inDescJI.graph && inDescJI.graph.length > 0) {
      rtnGraph = rtnGraph.concat(cloneDeep(inDescJI.graph));
    }

    // this.cleanItemsDups(rtnGraph);
    if (!verifyUniqKeys(rtnGraph)) {
      throw new Error("[SDJ] Description graph duplicate keys;");

      // sequential entity check; uniforms the system to require all mentioned entities be present + numbered
      // If fails means that lexicon and description are conflicting. ie lex1Ents + lex2Ents + descEnts
      // have holes which could mean errors and should be corrected outside the library (ie creation/editor etc.)
    } else if (!verifySequenceKeys(rtnGraph)) {
      throw new Error("[SDJ] Full entity graph cannot have missing ids != length;");
    }

    rtnGraph = this.removeEntityItemIds(rtnGraph);
    rtnGraph.map((entJI) => this.entityUniqSort(entJI));
    rtnGraph = rtnGraph.sort((a, b) => a.sdId - b.sdId);
    rtnGraph = this.extendEntityKeys(rtnGraph);

    return rtnGraph;
  }
  
  
  
  newBaseItems(): ItemJI[] {
    return cloneDeep(this._baseItemIJs);
  }

  fullItemJI(inDescJI: DescriptionJI): ItemJI[] {
    let itemsJI: ItemJI[] = [];
    if (inDescJI.lexicons) {
      each(inDescJI.lexicons, (lexName: string) => {
        const actLexicon: ILexicon | undefined = find(this._lexicons, {name: lexName});
        let addItems: ItemJI[];
        if (actLexicon && actLexicon.items) {
          addItems = cloneDeep(actLexicon.items);
          itemsJI = itemsJI.concat(addItems);
        } else {
          throw new Error("[SDJ] Unknown error on lexicon read");
        }
      });
    }
    if (inDescJI.items && inDescJI.items.length > 0) {
      itemsJI = itemsJI.concat(inDescJI.items);
    }

    // Remove keys that might conflict due to external errors/lexicons
    itemsJI = itemsJI.filter((item) => item.sdId !== 0 && item.sdId !== 1);
    itemsJI = itemsJI.filter((item) => item.sdKey !== "sdKey" && item.sdKey !== "sdId");
    itemsJI.map((itemJI) => this.adjustCheckItem(itemJI));
    itemsJI = itemsJI.sort((a, b) => a.sdId - b.sdId);

    return itemsJI;
  }

  validateRequires(descJI: DescriptionJI): boolean {
    const rtnBool = true;

    each(descJI.lexicons, (descLexName: string) => {
      const lexIdx = this._names.indexOf(descLexName);
      if (lexIdx === -1) {
        throw new Error(`[SDJ] SdJson Description references '${descLexName}' which needs to be added
          on initialization;`);
      }
      const activeLexicon = this._lexicons[lexIdx];
      if (activeLexicon?.required) {
        each(activeLexicon.required, (requiredLexName: string, idx: number) => {
          if (descJI.lexicons && requiredLexName !== descJI.lexicons[idx]) {
            throw new Error(`[SDJ] required Lexicon '${requiredLexName}' not in correct location`);
          }
        });
      }
    });
    return rtnBool;
  }

  validateGraph(inDescJI: DescriptionJI): boolean {
    const rtnVal = true;
    this.defaultValidateGraphItems(inDescJI);
    if (inDescJI.graph) {
      this.checkExtendsRecursion(inDescJI.graph);
    }

    // Note, at this point the in library lexicon presence and proper data in DescriptionJI has matched
    // Otherwise an error would already have been thrown
    if (inDescJI.lexicons && inDescJI.graph) {
      each(inDescJI.lexicons, (lexName: string) => {
        const iLexicon = this.findLexicon(lexName);
        if (iLexicon.graphVerify && inDescJI.graph && !iLexicon.graphVerify(inDescJI.graph)) {
          throw new Error(`[SDJ] graphVerify fail with Lexicon '${lexName}'`);
        }
      });
    }
    return rtnVal;
  }

  verifyData(inJson: SdJsonJI, strict = false): boolean {
    let rtnVal = true;
    // Normal process - At this point SdJsonJI has been description/lexicons validated
    if (inJson.description.lexicons) {
      each(inJson.description.lexicons, (lexName: string) => {
        const iLexicon = this.findLexicon(lexName);
        if (iLexicon.dataVerify) {
          try {
            rtnVal = iLexicon.dataVerify(inJson);
          } catch (err) {
            this._host.gLog(`SdJsonJI '${inJson.sdInfo.name}' failed lexicon '${lexName}' validation: ${err};`);
            rtnVal = false;
            if (strict) {
              throw new Error(`[SDJ] SdJsonJI '${inJson.sdInfo.name}' failed lexicon '${lexName}' validation: ${err};`);
            }
          }
        }
      });
    }
    return rtnVal;
  }

  // Returns simplified extended props based on extendIds
  calcSdKeyProps(entity:IEntitySdj, graph: IEntitySdj[]): SdKeyProps {
    let rtnProps: SdKeyProps = {},
      curProps = entity.sdProps,
      beforeProps: SdKeyProps,
      parentProps: SdKeyProps[] = this.getParentProps(entity, graph);
    if (curProps && !isEmpty(curProps)) {
      if (parentProps.length > 0) {
        beforeProps = this.assignSdProps(parentProps);
        each(curProps, (value, key) => {
          if (value !== beforeProps[key]) {
            rtnProps[key] = value;
          }
        });
      } else if (parentProps.length === 0) {
        rtnProps = genSdKeyProps(curProps);
      }
    }
    return rtnProps;
  }

  private defaultValidateGraphItems(inDescJI: DescriptionJI) {
    const graph: EntityJI[] = (inDescJI.graph) ? inDescJI.graph : [],
      items: ItemJI[] = inDescJI.items || [],
      definedEnts: number[] = [0],
      definedItems: number[] = map(items, "sdId");
    let mentionedEnts: number[] = [],
      mentionedItems: number[] = [];

    each(graph, (sdEnt: EntityJI) => {
      definedEnts.push(sdEnt.sdId);
      if (sdEnt.parentIds) {
        mentionedEnts = mentionedEnts.concat(sdEnt.parentIds);
      }
      if (sdEnt.sdItems) {
        mentionedItems = mentionedItems.concat(sdEnt.sdItems);
      }
      if (sdEnt.childIds) {
        mentionedEnts = mentionedEnts.concat(sdEnt.childIds);
      }
      if (sdEnt.extendIds) {
        mentionedEnts = mentionedEnts.concat(sdEnt.extendIds);
      }
    });
    mentionedEnts = uniq(mentionedEnts);
    each(mentionedEnts, (entId: number) => {
      if (definedEnts.indexOf(entId) === -1) {
        throw new Error(`[SDJ]: Description entity sdId '${entId}' is used but undefined;`);
      }
    });
    mentionedItems = uniq(mentionedItems);
    each(mentionedItems, (sdItemId: number) => {
      if (definedItems.indexOf(sdItemId) === -1) {
        throw new Error(`[SDJ]: Description item id '${sdItemId}' is used by undefined;`);
      }
    });
  }

  private checkExtendsRecursion(graph: EntityJI[]) {
    let extendChains: {[key: number]: number[]} = {};
    const getExtended = (rootExtId: number, extIds: number[]): number[] => {
      let rtnAry: number[] = [];
      each(extIds, (entId) => {
        const refEnt = find(graph, {sdId: entId});
        if (refEnt) {
          if (rootExtId === entId) {
            throw new Error(`[SDJ] extendId ${refEnt.sdKey} creates a circular reference`);
          }
          if (extendChains[entId]) {
            const theChain: number[] = (extendChains[entId]) ? <number[]>extendChains[entId] : [];
            rtnAry.push(...theChain);
          } else if (refEnt.extendIds) {
            rtnAry.push(...getExtended(rootExtId, refEnt.extendIds));
          }
        } // presence has already been confirmed
      });

      return rtnAry;
    };

    each(graph, (entJI: EntityJI) => {
      if (entJI.extendIds) {
        extendChains[entJI.sdId] = [];

        const refExtChain = (extendChains[entJI.sdId]) ? <number[]>extendChains[entJI.sdId] : [];
        refExtChain.push(...entJI.extendIds);
        refExtChain.push(...getExtended(entJI.sdId, entJI.extendIds));

        const curLen = refExtChain.length,
          uniqLen = uniq(refExtChain).length;
        if (curLen !== uniqLen) {
          throw new Error(`[SDJ] ${entJI.sdKey} extends contains a circular reference`);
        }
      }
    });
  }

  private findLexicon(lexName: string): ILexicon {
    const lexIdx = findIndex(this._lexicons, {name: lexName});
    let rtnILexicon: ILexicon;
    if (lexIdx !== -1) {
      rtnILexicon = <ILexicon>this._lexicons[lexIdx];
    } else {
      throw new Error(`[SDJ] Internal call failed to find lexicon '${lexName}';`);
    }
    return rtnILexicon;
  }
  private buildLexicon(lexicon: ILexicon) {
    const lexRegEx = getRegEx("typeLexName");
    if (this._names.indexOf(lexicon.name) !== -1) {
      throw new Error(`[SDJ] Lexicon name '${lexicon.name}' already added`);
    }
    if (lexicon.validators) {
      each(lexicon.validators, (validator: ValidatorJI, key) => {
        lexRegEx.lastIndex = 0;
        if (isArray(validator) || !isObject(validator) || !isString(key) || !isString(validator?.type)) {
          throw new Error(`[SDJ] Lexicon validator is malformed ${key} / ${validator?.type};`);
        } else if (validator.type !== key) {
          throw new Error(`[SDJ] Lexicon validator typeKey[${validator.type}] !== type[${key}];`);
        }
        const replaceName = rtnSdjItemName(validator.type);
        if (replaceName) {
          throw new Error(`[SDJ] Lexicon '${lexicon.name}' rejects validator '${key}' as similar to default '${replaceName}';`);
        } else if (has(this._validators, key)) {
          throw new Error(`[SDJ] Lexicon '${lexicon.name}' is attempting to add an identical validator for '${key}';`);
        }
        this._validators[key] = new SdjValidator(validator);
      });
    }
    each(lexicon.items, (itemJI: ItemJI) => {
      this.adjustCheckItem(itemJI);
    });

    if (lexicon.entities && lexicon.entities.length > 0) {
      each(lexicon.entities, (entityJI: EntityJI) => {
        this._host.verifyJIbyType(entityJI, ESDJ_CLASS.ENTITY, true);
      });
    }

    this._names.push(lexicon.name);
    this._lexicons.push(lexicon);
    this._host.gLog(`Lexicon added: '${lexicon.name}'`, 3);
  }

  // Clear out any duplicate entities, or entities that are already by extension
  private removeEntityItemIds(graphJI: EntityJI[]): EntityJI[] {
    const base: number[] = [0, 1];
    each(graphJI, (entityJI: EntityJI) => {
      this._host.verifyJIbyType(entityJI, ESDJ_CLASS.ENTITY, false);
      if (entityJI.sdItems) {
        entityJI.sdItems = entityJI.sdItems.filter((intId: number) => !base.includes(intId));
      }
    });

    each(graphJI, (checkJI) => {
      if (checkJI.extendIds) {
        each(checkJI.extendIds, (extId: number) => {
          const entityRef = find(graphJI, {sdId: extId});
          if (entityRef && entityRef.sdItems && checkJI.sdItems) {
            checkJI.sdItems = checkJI.sdItems.filter((intId: number) => ((entityRef.sdItems) ? !entityRef.sdItems.includes(intId) : true));
          } else if (!entityRef) {
            throw new Error(`[SDJ] Extended Entity ref ${extId} does not exist for '${checkJI.sdKey}'`);
          }
        });
      }
    });
    // kill sdId = 0 if attempted
    graphJI = graphJI.filter((entJI) => entJI.sdId !== 0);

    return graphJI;
  }

  // Confirms name and validator of ItemJI, adjusts name if necessary
  private adjustCheckItem(itemJI: ItemJI): ItemJI {
    this._host.verifyJIbyType(itemJI, ESDJ_CLASS.ITEM, true);
    const replaceName = rtnSdjItemName(itemJI.type);
    if (replaceName) {
      this._host.gLog(`type '${itemJI.type}' is too close to '${replaceName}' so it's been replaced`, 2);
      itemJI.type = replaceName;
    }
    const existingValidator = this._validators[itemJI.type];
    if (!existingValidator) {
      throw new Error(`[SDJ] Item '${itemJI.sdKey}' has type '${itemJI.type}' which has no validator;`);
    }

    return itemJI;
  }

  private extendEntityKeys(graph: EntityJI[]): EntityJI[] {
    each(graph, (entityJI: EntityJI) => {
      let parentProps: SdKeyProps[] = this.getParentProps(entityJI, graph);
      if (parentProps.length > 0) {
        const assignProps = assign(this.assignSdProps(parentProps),
          (entityJI.sdProps) ? entityJI.sdProps : {});
        if (assignProps && !isEmpty(assignProps)) {
          entityJI.sdProps = assignProps;
        }
      }
    });
    return graph;
  }

  private getParentProps(entity: EntityJI | IEntitySdj, graph: CoreSD[]): SdKeyProps[] {
    let parentProps: SdKeyProps[] = [];
    if (entity.extendIds) {
      each(entity.extendIds, (parentId) => {
        const foundEnt = <EntityJI>find(graph, {sdId: parentId});
        if (foundEnt && foundEnt.sdProps) {
          parentProps.push(clone(foundEnt.sdProps));
        }
      });
    }

    return parentProps;
  }

  private assignSdProps(parentFlats: SdKeyProps[]): SdKeyProps {
    let rtnFV: SdKeyProps = {};
    each(parentFlats, (pFlat: SdKeyProps) => {
      assign(rtnFV, pFlat);
    });
    return rtnFV;
  }

  private entityUniqSort(entityJI: EntityJI): EntityJI {
    if (entityJI.childIds) {
      entityJI.childIds = uniq([...entityJI.childIds]);
      entityJI.childIds.sort();
    }
    if (entityJI.sdItems) {
      entityJI.sdItems = uniq([...entityJI.sdItems]);
      entityJI.sdItems.sort();
    }
    if (entityJI.extendIds) {
      entityJI.extendIds = uniq([...entityJI.extendIds]);
      entityJI.extendIds.sort();
    }
    if (entityJI.parentIds) {
      entityJI.parentIds = uniq([...entityJI.parentIds]);
      entityJI.parentIds.sort();
    }
    return entityJI;
  }


  static VerifyJI(lexicon: ILexicon) {
    if (!lexicon.name) {
      throw new Error("[SDJ] Lexicon missing name;");
    }
    if (!validTypeLexName(lexicon.name)) {
      throw new Error(`[SDJ] Lexicon name '${lexicon.name}' invalid /^[a-z]{1}[a-z0-9_-]{2,14}[/a-z0-9]{1}/;`);
    }

    if (!lexicon.validators && !lexicon.items && !lexicon.entities && !lexicon.graphVerify && !lexicon.dataVerify) {
      throw new Error(`[SDJ] Lexicon '${lexicon.name}' has no information;`);
    }

    if (lexicon.required && !validStrArray(lexicon.required)) {
      throw new Error("[SDJ] Lexicon has malformed required value;");
    }

    if (lexicon.items && !isArray(lexicon.items)) {
      throw new Error("[SDJ] Lexicon items is not an array;");
    } else if (isArray(lexicon.items) && !verifyUniqKeys(lexicon.items)) {
      throw new Error("[SDJ] Lexicon items does not have unique sdKeys/sdIds;");
    }

    if (lexicon.entities && !isArray(lexicon.entities)) {
      throw new Error("[SDJ] Lexicon entities is not an array;");
    } else if (isArray(lexicon.entities) && !verifyUniqKeys(lexicon.entities)) {
      throw new Error("[SDJ] Lexicon entities does not have unique sdKeys/sdIds;");
    }

    if (lexicon.validators && !isObject(lexicon.validators)) {
      throw new Error("[SDJ] Lexicon 'validators' is present but not an object;");
    }

    if (lexicon.dataVerify && !isFunction(lexicon.dataVerify)) {
      throw new Error("[SDJ] Lexicon 'dataVerify' is present but not a function;");
    }

    if (lexicon.graphVerify && !isFunction(lexicon.graphVerify)) {
      throw new Error("[SDJ] Lexicon 'graphVerify' is present but not a function;");
    }

    restrictToAllowedKeys("ILexicon: " + lexicon.name,
      ["name", "entities", "items", "validators", "graphVerify", "dataVerify", "required"], lexicon);
  }
}
