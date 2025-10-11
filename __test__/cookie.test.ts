import Hoa from 'hoa'
import type { HoaContext, NextFunction } from 'hoa'
import { router } from '@hoajs/router'
import { cookie } from '../src/index'
import { describe, it, expect, beforeEach } from '@jest/globals'
import { parse, parseSigned, serialize, serializeSigned, } from '../src/cookie'
import type { Cookie, SignedCookie } from '../src/types/index'

describe('Parse cookie', () => {
  it('Should parse cookies', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
  })

  it('Should parse quoted cookie values', () => {
    const cookieString =
      'hoa_cookie="apple"; user_name = " strawberry " ; best_cookie="%20sugar%20";'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe(' strawberry ')
    expect(cookie['best_cookie']).toBe(' sugar ')
  })

  it('Should not throw a URIError when parsing an invalid string', () => {
    const cookieString = 'hoa_cookie="apple%2";'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple%2')
  })

  it('Should parse empty cookies', () => {
    const cookie: Cookie = parse('')
    expect(Object.keys(cookie).length).toBe(0)
  })

  it('Should parse one cookie specified by name', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa '
    const cookie: Cookie = parse(cookieString, 'hoa_cookie')
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse one cookie specified by name even if it is not found', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa '
    const cookie: Cookie = parse(cookieString, 'no_such_cookie')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse cookies with no value', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;last_path=;'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
    expect(cookie['last_path']).toBe('')
  })

  it('Should parse cookies but not process signed cookies', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
    expect(cookie['signed_last_path']).toBe('z33WMw.+HQZYtat78aYvt5+6gmjdy7KPSigOJGhoR+tyvNoeyw=')
  })

  it('Should ignore invalid cookie names', () => {
    const cookieString = 'hoa cookie=apple;hoa_m=banana; user_name\\ = hoa ;=AS9+01;'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa cookie']).toBeUndefined()
    expect(cookie['hoa_m']).toBe('banana')
    expect(cookie['user_name\\']).toBeUndefined()
    expect(cookie['']).toBeUndefined()
  })

  it('Should ignore invalid cookie values', () => {
    const cookieString = 'hoa_cookie=apple\\npen;hoa_m=banana;'
    const cookie: Cookie = parse(cookieString)
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['hoa_m']).toBe('banana')
  })

  it('Should parse signed cookies and ignore unsigned cookie', async () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const secret = '123456'
    const cookie: SignedCookie = await parseSigned(cookieString, secret)
    expect(cookie['signed_last_path']).toBe('z33WMw')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse signed cookies with binary secret and ignore unsigned cookie', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: SignedCookie = await parseSigned(cookieString, secret)
    expect(cookie['signed_last_path']).toBe('z33WMw')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse signed cookies containing the signature separator', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;'
    const cookie: SignedCookie = await parseSigned(cookieString, secret)
    expect(cookie['sign_last_path_dot']).toBe('z33WMw.demo')
  })

  it('Should parse signed cookies and return "false" for wrong signature', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;signed_last_path=z33WMw.%2BQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: SignedCookie = await parseSigned(cookieString, secret)
    expect(cookie['sign_last_path_dot']).toBe('z33WMw.demo')
    expect(cookie['signed_last_path']).toBeFalsy()
  })

  it('Should parse one signed cookie specified by name', async () => {
    const secret = '123456'
    const cookieString =
      'hoa_cookie=apple;sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;'
    const cookie: SignedCookie = await parseSigned(cookieString, secret, 'sign_last_path_dot')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['sign_last_path_dot']).toBe('z33WMw.demo')
  })
})

describe('Set cookie', () => {
  it('Should serialize cookie', () => {
    const serialized = serialize('hoa_cookie', 'hoa')
    expect(serialized).toBe('hoa_cookie=hoa')
  })

  it('Should serialize cookie with all options', () => {
    const serialized = serialize('__Secure-great_cookie', 'banana', {
      path: '/',
      secure: true,
      domain: 'example.com',
      httpOnly: true,
      maxAge: 1000,
      expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
      sameSite: 'Strict',
      priority: 'High',
      partitioned: true,
    })
    expect(serialized).toBe(
      '__Secure-great_cookie=banana; Max-Age=1000; Domain=example.com; Path=/; Expires=Sun, 24 Dec 2000 10:30:59 GMT; HttpOnly; Secure; SameSite=Strict; Priority=High; Partitioned'
    )
  })

  it('Should serialize __Host- cookie with all valid options', () => {
    const serialized = serialize('__Host-great_cookie', 'banana', {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 1000,
      expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
      sameSite: 'Strict',
      priority: 'High',
      partitioned: true,
    })
    expect(serialized).toBe(
      '__Host-great_cookie=banana; Max-Age=1000; Path=/; Expires=Sun, 24 Dec 2000 10:30:59 GMT; HttpOnly; Secure; SameSite=Strict; Priority=High; Partitioned'
    )
  })

  it('Should serialize a signed cookie', async () => {
    const secret = 'secret chocolate chips'
    const serialized = await serializeSigned('delicious_cookie', 'macha', secret)
    expect(serialized).toBe(
      'delicious_cookie=macha.diubJPY8O7hI1pLa42QSfkPiyDWQ0I4DnlACH%2FN2HaA%3D'
    )
  })

  it('Should serialize signed cookie with all options', async () => {
    const secret = 'secret chocolate chips'
    const serialized = await serializeSigned('great_cookie', 'banana', secret, {
      path: '/',
      secure: true,
      domain: 'example.com',
      httpOnly: true,
      maxAge: 1000,
      expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
      sameSite: 'Strict',
      priority: 'High',
      partitioned: true,
    })
    expect(serialized).toBe(
      'great_cookie=banana.hSo6gB7YT2db0WBiEAakEmh7dtwEL0DSp76G23WvHuQ%3D; Max-Age=1000; Domain=example.com; Path=/; Expires=Sun, 24 Dec 2000 10:30:59 GMT; HttpOnly; Secure; SameSite=Strict; Priority=High; Partitioned'
    )
  })

  it('Should serialize cookie with maxAge is 0', () => {
    const serialized = serialize('great_cookie', 'banana', {
      maxAge: 0,
    })
    expect(serialized).toBe('great_cookie=banana; Max-Age=0')
  })

  it('Should serialize cookie with maxAge is -1', () => {
    const serialized = serialize('great_cookie', 'banana', {
      maxAge: -1,
    })
    expect(serialized).toBe('great_cookie=banana')
  })

  it('Should throw Error cookie with maxAge grater than 400days', () => {
    expect(() => {
      serialize('great_cookie', 'banana', {
        maxAge: 3600 * 24 * 401,
      })
    }).toThrow(
      'Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.'
    )
  })

  it('Should throw Error Partitioned cookie without Secure attributes', () => {
    expect(() => {
      serialize('great_cookie', 'banana', {
        partitioned: true,
      })
    }).toThrow('Partitioned Cookie must have Secure attributes')
  })

  it('Should serialize cookie with lowercase priority values', () => {
    const lowSerialized = serialize('test_cookie', 'value', {
      priority: 'low',
    })
    expect(lowSerialized).toBe('test_cookie=value; Priority=Low')

    const mediumSerialized = serialize('test_cookie', 'value', {
      priority: 'medium',
    })
    expect(mediumSerialized).toBe('test_cookie=value; Priority=Medium')

    const highSerialized = serialize('test_cookie', 'value', {
      priority: 'high',
    })
    expect(highSerialized).toBe('test_cookie=value; Priority=High')
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
    app.extend(router())
  })

  it('Should has cookie methods', async () => {
    let methodsChecked = false
    app.get('/hoa', async (ctx: HoaContext, next: NextFunction) => {
      expect(ctx.req).toHaveProperty('getCookie')
      expect(ctx.req).toHaveProperty('getSignedCookie')
      expect(typeof ctx.req.getCookie).toBe('function')
      expect(typeof ctx.req.getSignedCookie).toBe('function')

      expect(ctx.res).toHaveProperty('setCookie')
      expect(ctx.res).toHaveProperty('setSignedCookie')
      expect(ctx.res).toHaveProperty('deleteCookie')
      expect(typeof ctx.res.setCookie).toBe('function')
      expect(typeof ctx.res.setSignedCookie).toBe('function')
      expect(typeof ctx.res.deleteCookie).toBe('function')
      methodsChecked = true
      await next()
    })
    await req(app, 'get', '/hoa')
    expect(methodsChecked).toBe(true)
  })

  it('Should set cookie on response', async () => {
    app.get('/set-cookie', async (ctx: HoaContext, next: NextFunction) => {
      ctx.res.body = 'hoa'
      ctx.res.status = 200
      expect(ctx.req.getCookie('hoa-cookie')).toBe('hoa')
      const c = await ctx.req.getSignedCookie('signed_last_path')
      expect(c).toBe('z33WMw')
      ctx.res.setCookie('hoa-cookie', 'hoa')
      await ctx.res.setSignedCookie('signed_last_path', 'z33WMw')
      await next()
    })
    const req = new Request('http://localhost' + '/set-cookie', { method: 'GET' })
    req.headers.set('Cookie', 'hoa-cookie=hoa;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D')
    const response = await app.fetch(req)
    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    cookies.forEach((c: string) => {
      if (c.includes('hoa-cookie')) {
        const parsedCookie = parse(c, 'hoa-cookie')
        expect(parsedCookie).toEqual({ 'hoa-cookie': 'hoa' })
      } else if (c.includes('signed_last_path')) {
        const parsedCookie = parse(c, 'signed_last_path')
        expect(parsedCookie).toEqual({ signed_last_path: 'z33WMw.+HQZYtat78aYvt5+6gmjdy7KPSigOJGhoR+tyvNoeyw=' })
      }
    })
  })
})
async function req (app: Hoa, method: string, path: string) {
  const r = new Request('http://localhost' + path, { method: method.toUpperCase() })
  return app.fetch(r)
}
