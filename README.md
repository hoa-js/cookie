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
  const hoaCookie = ctx.req.getCookie('hoa')
  ctx.res.body = "Hello, Hoa!";
  cts.res.setCookie('hoa', 'hoa')
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
