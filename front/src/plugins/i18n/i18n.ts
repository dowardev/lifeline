// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2021-2026 Gonzalo Ponce <gonzalo@dowar.xyz>

import es from "./languages/es";
import en from "./languages/en";
const messages = {
  es: es,
  en: en,
};

const name = "language=";
const cDecoded = decodeURIComponent(document.cookie);
const cArr = cDecoded.split("; ");
let language = "es";
cArr.forEach((val) => {
  if (val.indexOf(name) === 0) language = val.substring(name.length);
});
if (language !== "es" && language !== "en") {
  language = "es";
}

import { createI18n } from "vue-i18n";
export default createI18n({
  locale: language, // set locale
  fallbackLocale: "es", // set fallback locale
  messages,
});
