import { ConcatSource, Source } from "webpack-sources";
import { SourceFactory } from "../../typings";
import middleWareSourceBuilder from "./middleware-source-builder";

const middlewareInjector: MiddlewareInjector = (
  { background, contentScript, extensionPage },
  { port, reloadPage },
) => {
  // 获得了一个中间件脚本
  const source: Source = middleWareSourceBuilder({ port, reloadPage });
  const sourceFactory: SourceFactory = (...sources): Source =>
    new ConcatSource(...sources);

  const matchBgOrContentOrPage = (name: string) =>
    name === background ||
    name === contentScript ||
    (contentScript && contentScript.includes(name)) ||
    name === extensionPage ||
    (extensionPage && extensionPage.includes(name));

  return (assets, chunks) =>
    chunks.reduce((prev, { name, files }) => {
      if (matchBgOrContentOrPage(name)) {
        files.forEach(entryPoint => {
          if (/\.js$/.test(entryPoint)) {
            // 将监听脚本注入各个插件的js中，妙啊
            const finalSrc = sourceFactory(source, assets[entryPoint]);
            prev[entryPoint] = finalSrc;
          }
        });
      }
      return prev;
    }, {});
};

export default middlewareInjector;
