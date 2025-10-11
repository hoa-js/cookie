import {
  parseCookie,
  parseSignedCookie,
  generateSignedCookie,
  generateCookie
} from './cookie.ts'
import type {
  Cookie,
  CookiePrefixOptions,
  CookieAdapterOptions,
  CookieOptions,
  GetCookie,
  SetCookie,
  DeleteCookie,
  SignedCookie,
} from './types/index.ts'

const DEFAULT_ADAPTER_OPTIONS: CookieAdapterOptions = {
  secret: undefined,
  defaultOptions: {
    signed: false,
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60
  }
}

export function cookie (options: CookieAdapterOptions = DEFAULT_ADAPTER_OPTIONS) {
  if ((options.defaultOptions?.signed) && !options.secret) {
    throw new Error('secret is required when signed is true')
  }

  return function cookieExtension (app: any) {
    const getCookie = async function getCookie (
      name: string,
      opts?: { prefix?: CookiePrefixOptions; signed?: boolean }
    ): Promise<string | undefined | false> {
      if (!name) return

      const cookieHeader = this.get('cookie')
      const prefixOpt = opts?.prefix
      const signed = opts?.signed === true

      const resolveNameWithPrefix = (n: string | undefined) => {
        if (prefixOpt === 'secure') return '__Secure-' + n
        if (prefixOpt === 'host') return '__Host-' + n
        return n
      }

      if (signed) {
        if (!cookieHeader || !options.secret) return undefined
        const finalName = resolveNameWithPrefix(name) as string
        const obj = await parseSignedCookie(cookieHeader, options.secret, finalName)
        return (obj as SignedCookie)[finalName]
      }

      // unsigned
      if (!cookieHeader) return undefined
      const finalName = resolveNameWithPrefix(name) as string
      const obj = parseCookie(cookieHeader, finalName)
      return (obj as Cookie)[finalName]
    } as unknown as GetCookie

    const setCookie = async function setCookie (name: string, value: string, opts?: CookieOptions) {
      if (!name || (value == null)) return

      const cookieOptions = opts || options.defaultOptions
      const isSigned = Boolean(cookieOptions?.signed)
      if (isSigned) {
        if (!options.secret) {
          throw new Error('secret is required when signed is true')
        }
        const cookie = await generateSignedCookie(name, value, options.secret, cookieOptions)
        this.append('Set-Cookie', cookie)
        return
      }
      const cookie = generateCookie(name, value, cookieOptions)
      this.append('Set-Cookie', cookie)
    } as unknown as SetCookie

    const deleteCookie = async function deleteCookie (name: string) {
      await this.setCookie(name, '', { maxAge: 0 })
    } as unknown as DeleteCookie

    // mount on both req and res prototypes
    app.HoaRequest.prototype.getCookie = getCookie
    app.HoaRequest.prototype.setCookie = setCookie
    app.HoaRequest.prototype.deleteCookie = deleteCookie

    app.HoaResponse.prototype.getCookie = getCookie
    app.HoaResponse.prototype.setCookie = setCookie
    app.HoaResponse.prototype.deleteCookie = deleteCookie
  }
}

export default cookie
