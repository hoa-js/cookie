## @hoajs/cookie

Cookie middleware for Hoa.

## Installation

```bash
$ npm i @hoajs/cookie --save
```

## Quick Start

```js
import { Hoa } from 'hoa'
import { cookie } from '@hoajs/cookie'

const app = new Hoa()
app.extend(cookie())

app.use(async (ctx) => {
  const name = await ctx.req.getCookie('name')
  ctx.res.body = `Hello, ${name}!`
})

export default app
```

## Documentation

The documentation is available on [hoa-js.com](https://hoa-js.com/middleware/cookie.html)

## Test (100% coverage)

```sh
$ npm test
```

## License

MIT
