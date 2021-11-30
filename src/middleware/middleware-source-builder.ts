import { template } from "lodash";
import rawSource from "raw-loader!./wer-middleware.raw";
import polyfillSource from "raw-loader!webextension-polyfill";
import { RawSource, Source } from "webpack-sources";

import {
  RECONNECT_INTERVAL,
  SOCKET_ERR_CODE_REF,
} from "../constants/middleware-config.constants";
import * as signals from "../utils/signals";

export default function middleWareSourceBuilder({
  port,
  reloadPage,
}: IMiddlewareTemplateParams): Source {
  // rawSource 使用raw-loader将文件转换为字符串
  const tmpl = template(rawSource);

  return new RawSource(
    tmpl({
      WSHost: `ws://localhost:${port}`,
      config: JSON.stringify({ RECONNECT_INTERVAL, SOCKET_ERR_CODE_REF }),
      polyfillSource: `"||${polyfillSource}"`,
      reloadPage: `${reloadPage}`,
      signals: JSON.stringify(signals),
    }),
  );
}
