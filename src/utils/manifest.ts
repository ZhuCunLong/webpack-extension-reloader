import { readFileSync } from "fs";
import { flatMapDeep } from "lodash";
import { Entry, Output } from "webpack";
import {
  bgScriptEntryErrorMsg,
  bgScriptManifestRequiredMsg,
} from "../messages/errors";

export function extractEntries(
  webpackEntry: Entry,
  webpackOutput: Output = {},
  manifestPath: string,
): IEntriesOption {
  const manifestJson = JSON.parse(
    readFileSync(manifestPath).toString(),
  ) as IExtensionManifest;
  const { background, content_scripts } = manifestJson;
  // webpack打包出来的产物 [name].bundle.js ？ 还是最终打包出来的名称
  const { filename } = webpackOutput;

  if (!filename) {
    throw new Error();
  }

  // TODO: 这里要重构迁移到mv3
  // ================================================================
  if (!background?.scripts) {
    throw new TypeError(bgScriptManifestRequiredMsg.get());
  }

  // manifest 中配置的background.scripts的数组
  const bgScriptFileNames = background.scripts;
  // 从这里可以看出，filename是[name].bundle.js
  const toRemove = (filename as string).replace("[name]", ""); // ".bundle.js"

  // 从entry中找到background的入口key
  const bgWebpackEntry = Object.keys(webpackEntry).find(entryName =>
    bgScriptFileNames.some(
      bgManifest => bgManifest.replace(toRemove, "") === entryName,
    ),
  );

  if (!bgWebpackEntry) {
    throw new TypeError(bgScriptEntryErrorMsg.get());
  }
  // ================================================================

  // manifest中的content_script是一个数组，所以这里使用了数组打平的api
  const contentEntries: unknown = content_scripts
    ? flatMapDeep(Object.keys(webpackEntry), entryName =>
        content_scripts.map(({ js }) =>
          js
            .map(contentItem => contentItem.replace(toRemove, ""))
            .filter(contentItem => contentItem === entryName),
        ),
      )
    : null;
  return {
    background: bgWebpackEntry,
    contentScript: contentEntries as string[],
    extensionPage: null,
  };
}
