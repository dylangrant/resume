import {
  htmlToOneLine,
  parseTextToJSObject,
  objectToHtml,
} from "./html_parser.util.js";

import {
  buildRteText,
  getCopyValues,
  getData,
  getTitle,
  mapRteNodes,
  rteToString,
} from "./json_parser.util.js";

import resume from "./index.html"

// TODO: Need functions here to convert from html to json and json to html. Needs to be callable from package.json script.