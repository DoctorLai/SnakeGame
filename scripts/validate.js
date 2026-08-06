"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const extensionDir = path.join(root, "snake");
const languageDir = path.join(extensionDir, "lang");
const localeDir = path.join(extensionDir, "_locales");
const expectedUiLanguages = new Set([
  "ar",
  "bn",
  "de-de",
  "en-us",
  "es-sp",
  "fa",
  "fr-fr",
  "hi",
  "id",
  "it-it",
  "ja",
  "ko",
  "mr",
  "nl-nl",
  "pl-pl",
  "pt-br",
  "ro-ro",
  "ru-ru",
  "sw",
  "ta",
  "te",
  "th",
  "tr-tr",
  "vi",
  "zh-cn",
  "zh-tw"
]);
const supportedChromeLocales = new Set([
  "am",
  "ar",
  "bg",
  "bn",
  "ca",
  "cs",
  "da",
  "de",
  "el",
  "en",
  "en_AU",
  "en_GB",
  "en_US",
  "es",
  "es_419",
  "et",
  "fa",
  "fi",
  "fil",
  "fr",
  "gu",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "kn",
  "ko",
  "lt",
  "lv",
  "ml",
  "mr",
  "ms",
  "nl",
  "no",
  "pl",
  "pt_BR",
  "pt_PT",
  "ro",
  "ru",
  "sk",
  "sl",
  "sr",
  "sv",
  "sw",
  "ta",
  "te",
  "th",
  "tr",
  "uk",
  "vi",
  "zh_CN",
  "zh_TW"
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertMatchingVersion(packageVersion, manifestVersion) {
  const packageParts = packageVersion.split(".");
  const manifestParts = manifestVersion.split(".");
  const sharedPartsMatch = manifestParts.every((part, index) => part === packageParts[index]);
  const packageSuffixIsZero = packageParts
    .slice(manifestParts.length)
    .every((part) => part === "0");

  assert(
    sharedPartsMatch && packageSuffixIsZero,
    `Version mismatch: package.json is ${packageVersion}, manifest.json is ${manifestVersion}`
  );
}

function loadTranslation(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const declaration = source.match(/const\s+(translation_[A-Za-z0-9_]+)\s*=/);
  assert(declaration, `${path.relative(root, filePath)} has no translation object`);

  const context = {};
  vm.runInNewContext(`${source}\nglobalThis.__translation = ${declaration[1]};`, context, {
    filename: filePath
  });
  return { identifier: declaration[1], values: context.__translation };
}

function assertSameKeys(referenceKeys, candidate, filePath) {
  const candidateKeys = Object.keys(candidate).sort();
  const relativePath = path.relative(root, filePath);
  assert(
    JSON.stringify(candidateKeys) === JSON.stringify(referenceKeys),
    `${relativePath} does not match the English translation keys`
  );
  for (const key of candidateKeys) {
    assert(
      typeof candidate[key] === "string" && candidate[key].trim(),
      `${relativePath} has an empty value for ${key}`
    );
  }
}

function validateTranslations() {
  const mainHtml = fs.readFileSync(path.join(extensionDir, "main.html"), "utf8");
  const translateSource = fs.readFileSync(path.join(extensionDir, "js", "translate.js"), "utf8");
  const selector = mainHtml.match(/<select[^>]+id="lang"[\s\S]*?<\/select>/);
  assert(selector, "snake/main.html has no language selector");

  const selectorLanguageMatches = Array.from(
    selector[0].matchAll(/<option\s+value="([^"]+)"/g),
    (match) => match[1]
  );
  const selectorLanguages = new Set(selectorLanguageMatches);
  const translationMappingMatches = Array.from(
    translateSource.matchAll(/case "([^"]+)":\s*return (translation_[A-Za-z0-9_]+);/g),
    (match) => [match[1], match[2]]
  );
  const translationMappings = new Map(translationMappingMatches);
  const languageFiles = fs
    .readdirSync(languageDir)
    .filter((fileName) => fileName.endsWith(".js"))
    .sort();
  const reference = loadTranslation(path.join(languageDir, "en-us.js"));
  const referenceKeys = Object.keys(reference.values).sort();

  for (const languageCode of expectedUiLanguages) {
    assert(
      languageFiles.includes(`${languageCode}.js`),
      `Required UI language ${languageCode} is missing`
    );
  }
  assert(
    selectorLanguageMatches.length === selectorLanguages.size,
    "The language selector contains a duplicate option"
  );
  assert(
    translationMappingMatches.length === translationMappings.size,
    "translate.js contains a duplicate language case"
  );

  for (const fileName of languageFiles) {
    const filePath = path.join(languageDir, fileName);
    const languageCode = path.basename(fileName, ".js");
    const translation = loadTranslation(filePath);

    assertSameKeys(referenceKeys, translation.values, filePath);
    assert(mainHtml.includes(`src="lang/${fileName}"`), `${fileName} is not loaded by main.html`);
    assert(
      selectorLanguages.has(languageCode),
      `${languageCode} is missing from the language selector`
    );
    assert(
      translationMappings.get(languageCode) === translation.identifier,
      `${languageCode} is not registered correctly in translate.js`
    );
  }

  assert(
    selectorLanguages.size === languageFiles.length,
    "The language selector contains an option without a matching translation file"
  );
  assert(
    translationMappings.size === languageFiles.length,
    "translate.js contains a case without a matching translation file"
  );
  return languageFiles.length;
}

function validateLocales(manifest) {
  const localeNames = fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert(
    localeNames.length >= 25,
    `Expected at least 25 extension locales, found ${localeNames.length}`
  );
  assert(localeNames.includes(manifest.default_locale), "The manifest default_locale is missing");
  assert(manifest.name === "__MSG_appName__", "The manifest name is not localized");
  assert(manifest.description === "__MSG_appDesc__", "The manifest description is not localized");
  assert(
    manifest.action && manifest.action.default_title === "__MSG_appName__",
    "The extension action title is not localized"
  );

  const defaultMessages = readJson(path.join(localeDir, manifest.default_locale, "messages.json"));
  const defaultMessageKeys = Object.keys(defaultMessages).sort();

  for (const localeName of localeNames) {
    assert(
      supportedChromeLocales.has(localeName),
      `${localeName} is not a supported Chrome locale code`
    );
    const filePath = path.join(localeDir, localeName, "messages.json");
    const messages = readJson(filePath);
    assert(
      JSON.stringify(Object.keys(messages).sort()) === JSON.stringify(defaultMessageKeys),
      `${path.relative(root, filePath)} does not match the default locale keys`
    );
    for (const key of ["appName", "appDesc"]) {
      assert(
        messages[key] && typeof messages[key].message === "string" && messages[key].message.trim(),
        `${path.relative(root, filePath)} has no ${key}.message`
      );
    }
  }
  return localeNames.length;
}

function validate() {
  const packageJson = readJson(path.join(root, "package.json"));
  const manifest = readJson(path.join(extensionDir, "manifest.json"));
  assertMatchingVersion(packageJson.version, manifest.version);

  const languageCount = validateTranslations();
  const localeCount = validateLocales(manifest);
  console.log(
    `Validated version ${manifest.version}, ${languageCount} UI languages and ${localeCount} locales.`
  );
}

try {
  validate();
} catch (error) {
  console.error(`Validation failed: ${error.message}`);
  process.exitCode = 1;
}
