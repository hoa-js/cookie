import { HoaContext, Application, NextFunction, HoaMiddleware } from 'hoa'
import {
  parse,
  parseSigned,
  generateSignedCookie,
  generateCookie,
  setSignConfig
} from './cookie.ts'
import type {
  Cookie,
  CookiePrefixOptions,
  CookieAdapterOptions,
  CookieOptions,
  GetCookie,
  SetCookie,
  DeleteCookie,
  GetSignedCookie,
  SetSignedCookie,
} from './types/index.ts'

export {
  generateSignedCookie,
  generateCookie,
}

const DEFAULT_ADAPTER_OPTIONS: CookieAdapterOptions = {
  secret: undefined,
  signed: false,
  defaultOptions: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60,
  }
}

export function cookie (options: CookieAdapterOptions = DEFAULT_ADAPTER_OPTIONS) {
  if (options.signed && !options.secret) {
    throw new Error('secret is required when signed is true')
  }
  setSignConfig(options.secret)
  return function (app: Application) {
    const cookieMiddleware: HoaMiddleware = async (ctx: HoaContext, next: NextFunction) => {
      const getCookie = ((
        name?: string,
        prefixOptions?: CookiePrefixOptions
      ): string | undefined | Cookie => {
        const cookie = ctx.req.get('cookie')
        if (typeof name === 'string') {
          if (!cookie) return undefined
          let finalName = name
          if (prefixOptions === 'secure') {
            finalName = '__Secure-' + name
          } else if (prefixOptions === 'host') {
            finalName = '__Host-' + name
          }
          const obj = parse(cookie, finalName)
          return obj[finalName]
        }
        if (!cookie) return {}
        return parse(cookie)
      }) as GetCookie
      const setSignedCookie: SetSignedCookie = async (name: string, value: string, opt?: CookieOptions) => {
        const cookie = await generateSignedCookie(name, value, options.secret, opt)
        ctx.res.append('Set-Cookie', cookie)
      }
      const getSignedCookie = (async (name?: string, prefixOptions?: CookiePrefixOptions) => {
        const cookie = ctx.req.get('cookie')
        if (typeof name === 'string') {
          if (!cookie) return undefined
          let finalName = name
          if (prefixOptions === 'secure') {
            finalName = '__Secure-' + name
          } else if (prefixOptions === 'host') {
            finalName = '__Host-' + name
          }
          const obj = await parseSigned(cookie, options.secret, finalName)
          return obj[finalName]
        }
        if (!cookie) {
          return {}
        }
        return await parseSigned(cookie, options.secret)
      }) as GetSignedCookie
      const setCookie: SetCookie = (name: string, value: string, opt: CookieOptions = options.defaultOptions) => {
        const cookie = generateCookie(name, value, opt)
        ctx.res.append('Set-Cookie', cookie)
      }
      const deleteCookie: DeleteCookie = (name: string, opt?: CookieOptions): string | undefined => {
        const deletedCookie = getCookie(name, opt?.prefix)
        setCookie(name, '', { ...opt, maxAge: 0 })
        return deletedCookie
      }
      ctx.req['getCookie'] = getCookie
      ctx.req['getSignedCookie'] = getSignedCookie
      ctx.res['setCookie'] = setCookie
      ctx.res['setSignedCookie'] = setSignedCookie
      ctx.res['deleteCookie'] = deleteCookie
      return next()
    }
    app.use(cookieMiddleware)
    return app
  }
}

export default cookie
