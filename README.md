cookie 的解析和序列化可以单独写一个@hoajs/cookie 中间件

1. 我简单调研了 cookies/cookie-parser/cookie/tough-cookie/cookie-signature 发现要么有依赖，要么只能在 node 中用，都不够简洁
1. 主要可以参考 hono 的 cookie 源码: https://github.com/honojs/hono/blob/main/src/utils/cookie.ts
1. 其次参考 cookies/cookie-parser/cookie/tough-cookie/cookie-signature 的 api 设计
1. 可以用 ts 写
1. 用 app.extend(cookie({ secret, ... }))，添加

- ctx.req.getCookie(name)
- ctx.req.setCookie(name, value, {
  domain,
  path,
  expires,
  ...
  signed: true/false // 是否签名
  })

- ctx.res.getCookie(name)
- ctx.res.setCookie(name, value, {
  domain,
  path,
  expires,
  ...
  signed: true/false // 是否签名
  })

你看下，如果有问题我们可以再讨论

## @hoajs/cookie

Adapters for Hoa.

## Installation

```bash
$ npm i @hoajs/cookie --save
```

## Quick Start

```js
import { Hoa } from "hoa";
import { cookie } from "@hoajs/cookie";

const app = new Hoa();
app.extends(cookie());

app.use(async (ctx) => {
  ctx.res.body = "Hello, Hoa!";
});

export default app;
```

## Documentation

The documentation is available on [hoa-js.com](https://hoa-js.com/adapter/cookie.html)

## Test (100% coverage)

```sh
$ npm test
```

## License

MIT
