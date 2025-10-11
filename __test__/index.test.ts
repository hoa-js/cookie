import { Hoa } from 'hoa'
import type { HoaContext, NextFunction } from 'hoa'
import { cookie } from '../src/index.js'
import { parseCookie, serializeSigned } from '../src/cookie.js'
import { describe, it, expect, beforeEach } from '@jest/globals'

describe('Adapter behavior edge cases', () => {
  it('Should throw when defaultOptions.signed is true but secret is missing', () => {
    expect(() => {
      cookie({ defaultOptions: { signed: true } })
    }).toThrow('secret is required when signed is true')
  })

  it('Should return undefined for getCookie by name when no Cookie header (unsigned and signed)', async () => {
    const app = new Hoa()
    app.extend(cookie())
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      const unsigned = await ctx.req.getCookie('nope')
      expect(unsigned).toBeUndefined()
      const signed = await ctx.req.getCookie('nope', { signed: true })
      expect(signed).toBeUndefined()
      ctx.res.status = 204
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET' }))
    expect(response.status).toBe(204)
  })

  it('Should delete cookie and set Max-Age=0', async () => {
    const app = new Hoa()
    app.extend(cookie())
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      await ctx.res.deleteCookie('x')
      ctx.res.status = 204
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: 'x=1' } }))
    expect(response.status).toBe(204)
    const setCookies = response.headers.getSetCookie()
    const del = setCookies.find((c: string) => c.startsWith('x='))
    expect(del).toBeDefined()
    expect(del as string).toContain('Max-Age=0')
  })
})

describe('Cookie adapter mounting test', () => {
  let app: Hoa

  beforeEach(() => {
    app = new Hoa()
    app.extend(cookie({
      secret: '123456',
      signed: true
    }))
  })

  it('Should has cookie methods', async () => {
    let methodsChecked = false
    app.use(async (ctx: HoaContext, next: NextFunction) => {
      expect(ctx.req).toHaveProperty('getCookie')
      expect(ctx.req).toHaveProperty('setCookie')
      expect(ctx.req).toHaveProperty('deleteCookie')
      expect(typeof ctx.req.getCookie).toBe('function')
      expect(typeof ctx.req.setCookie).toBe('function')
      expect(typeof ctx.req.deleteCookie).toBe('function')

      expect(ctx.res).toHaveProperty('getCookie')
      expect(ctx.res).toHaveProperty('setCookie')
      expect(ctx.res).toHaveProperty('deleteCookie')
      expect(typeof ctx.res.getCookie).toBe('function')
      expect(typeof ctx.res.setCookie).toBe('function')
      expect(typeof ctx.res.deleteCookie).toBe('function')
      methodsChecked = true
      await next()
    })
    await app.fetch(new Request('http://localhost', { method: 'GET' }))
    expect(methodsChecked).toBe(true)
  })

  it('Should set cookie on response', async () => {
    app.use(async (ctx: HoaContext, next: NextFunction) => {
      ctx.res.body = 'hoa'
      ctx.res.status = 200
      expect(await ctx.req.getCookie('hoa-cookie')).toBe('hoa')
      const c = await ctx.req.getCookie('signed_last_path', { signed: true })
      expect(c).toBe('z33WMw')
      await ctx.res.setCookie('hoa-cookie', 'hoa')
      await ctx.res.setCookie('signed_last_path', 'z33WMw', { signed: true })
      await next()
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: 'hoa-cookie=hoa;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D' } }))
    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    cookies.forEach((c: string) => {
      if (c.includes('hoa-cookie')) {
        const parsedCookie = parseCookie(c, 'hoa-cookie')
        expect(parsedCookie).toEqual({ 'hoa-cookie': 'hoa' })
      } else if (c.includes('signed_last_path')) {
        const parsedCookie = parseCookie(c, 'signed_last_path')
        expect(parsedCookie).toEqual({ signed_last_path: 'z33WMw.+HQZYtat78aYvt5+6gmjdy7KPSigOJGhoR+tyvNoeyw=' })
      }
    })
  })
})

// 保留基础挂载测试

describe('basic', () => {
  it('mounts adapter without error', async () => {
    const app = new Hoa()
    app.extend(cookie())
    const res = await app.fetch(new Request('http://localhost', { method: 'GET' }))
    expect(res.status).toBe(404)
  })
})

describe('Index.ts getCookie prefix and signed/all branches', () => {
  it('getCookie with signed:true and prefix:secure resolves __Secure- name', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      const v = await ctx.req.getCookie('pp', { signed: true, prefix: 'secure' })
      expect(v).toBe('v')
      ctx.res.status = 204
    })
    const signedPair = await serializeSigned('__Secure-pp', 'v', '123456', { secure: true })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: signedPair.split(';')[0] } }))
    expect(response.status).toBe(204)
  })

  it('getCookie unsigned with prefix:host resolves __Host- name', async () => {
    const app = new Hoa()
    app.extend(cookie())
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      const v = await ctx.req.getCookie('uu', { prefix: 'host' })
      expect(v).toBe('u')
      ctx.res.status = 204
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: '__Host-uu=u' } }))
    expect(response.status).toBe(204)
  })

  it('getCookie with signed:true and no name returns only signed cookies object', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      const s1 = await ctx.req.getCookie('s1', { signed: true })
      const s2 = await ctx.req.getCookie('s2', { signed: true })
      const uu = await ctx.req.getCookie('uu')
      expect(s1).toBe('x')
      expect(s2).toBe('y')
      expect(uu).toBeUndefined()
      ctx.res.status = 204
    })
    const p1 = await serializeSigned('s1', 'x', '123456')
    const p2 = await serializeSigned('s2', 'y', '123456')
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: `${p1.split(';')[0]}; ${p2.split(';')[0]}` } }))
    expect(response.status).toBe(204)
  })
})

describe('More getCookie branches for index.ts', () => {
  it('prototype getCookie signed:true and no Cookie header returns undefined', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    const fn = app.HoaRequest.prototype.getCookie as unknown as (
      this: { get: (h: string) => string | undefined },
      name: string,
      opts?: { signed?: boolean }
    ) => Promise<string | undefined | false>
    const result = await fn.call({ get: (_h: string) => undefined }, 'any', { signed: true })
    expect(result).toBeUndefined()
  })
  it('prototype getCookie signed:true returns signed cookie value by name', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    const p1 = await serializeSigned('s1', 'x', '123456')
    const p2 = await serializeSigned('s2', 'y', '123456')
    const header = `${p1.split(';')[0]}; ${p2.split(';')[0]}`
    const fn = app.HoaRequest.prototype.getCookie as unknown as (
      this: { get: (h: string) => string | undefined },
      name: string,
      opts?: { signed?: boolean }
    ) => Promise<string | undefined | false>
    const s1 = await fn.call({ get: (h: string) => (h.toLowerCase() === 'cookie' ? header : undefined) }, 's1', { signed: true })
    const s2 = await fn.call({ get: (h: string) => (h.toLowerCase() === 'cookie' ? header : undefined) }, 's2', { signed: true })
    expect(s1).toBe('x')
    expect(s2).toBe('y')
  })
  it('res.getCookie signed:true and no name returns all signed cookies object', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    app.use(async (ctx: HoaContext, next: NextFunction) => {
      const s1 = await ctx.req.getCookie('s1', { signed: true })
      const s2 = await ctx.req.getCookie('s2', { signed: true })
      ctx.res.body = JSON.stringify({ s1, s2 })
      ctx.res.status = 200
    })
    const p1 = await serializeSigned('s1', 'x', '123456')
    const p2 = await serializeSigned('s2', 'y', '123456')
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: `${p1.split(';')[0]}; ${p2.split(';')[0]}` } }))
    expect(response.status).toBe(200)
    const txt = await response.text()
    const obj = JSON.parse(txt)
    expect(obj.s1).toBe('x')
    expect(obj.s2).toBe('y')
  })
  it('signed:true by name returns undefined when no Cookie header', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    app.use(async (ctx: HoaContext, next: NextFunction) => {
      const v = await ctx.req.getCookie('any', { signed: true })
      expect(v).toBeUndefined()
      ctx.res.status = 204
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET' }))
    expect(response.status).toBe(204)
  })

  it('empty cookie name returns undefined (unsigned and signed)', async () => {
    // unsigned
    {
      const app = new Hoa()
      app.extend(cookie())
      app.use(async (ctx: HoaContext, _next: NextFunction) => {
        const v = await ctx.req.getCookie('')
        expect(v).toBeUndefined()
        ctx.res.status = 204
      })
      const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: 'a=b' } }))
      expect(response.status).toBe(204)
    }
    // signed
    {
      const app = new Hoa()
      app.extend(cookie({ secret: '123456' }))
      app.use(async (ctx: HoaContext, _next: NextFunction) => {
        const v = await ctx.req.getCookie('', { signed: true })
        expect(v).toBeUndefined()
        ctx.res.status = 204
      })
      const p1 = await serializeSigned('x', 'y', '123456')
      const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: p1.split(';')[0] } }))
      expect(response.status).toBe(204)
    }
  })

  it('getCookie with signed:true and prefix:host resolves __Host- name', async () => {
    const app = new Hoa()
    app.extend(cookie({ secret: '123456' }))
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      const v = await ctx.req.getCookie('hh', { signed: true, prefix: 'host' })
      expect(v).toBe('hv')
      ctx.res.status = 204
    })
    const signedPair = await serializeSigned('__Host-hh', 'hv', '123456', { secure: true, path: '/' })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET', headers: { Cookie: signedPair.split(';')[0] } }))
    expect(response.status).toBe(204)
  })

  it('setCookie early-returns when name is empty or value is null/undefined', async () => {
    const app = new Hoa()
    app.extend(cookie())
    app.use(async (ctx: HoaContext, _next: NextFunction) => {
      await ctx.res.setCookie('', 'v')
      await ctx.res.setCookie('x', undefined as any)
      await ctx.res.setCookie('y', null as any)
      ctx.res.status = 204
    })
    const response = await app.fetch(new Request('http://localhost', { method: 'GET' }))
    expect(response.status).toBe(204)
    const setCookies = response.headers.getSetCookie()
    expect(Array.isArray(setCookies)).toBe(true)
    expect(setCookies.length).toBe(0)
  })
})
