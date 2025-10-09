import { HoaContext, Application, NextFunction, HoaMiddleware } from "hoa";
import {
  parse,
  parseSigned,
  Cookie,
  CookiePrefixOptions,
  CookieAdapterOptions,
  generateSignedCookie,
  SignedCookie,
  CookieOptions,
  generateCookie,
  setSignAlgorithm,
} from "./cookie.ts";
export { CookieOptions, CookieAdapterOptions };
export interface GetCookie {
  (): Cookie;
  (name: string): string | undefined;
  (name: string, prefixOptions?: CookiePrefixOptions): string | undefined;
}
export interface SetCookie {
  (name: string, value: string, options?: CookieOptions): void;
}
export interface DeleteCookie {
  (name: string, options?: CookieOptions): string | undefined;
}
export interface GetSignedCookie {
  (secret: CookieAdapterOptions["secret"]): Promise<SignedCookie>;
  (secret: CookieAdapterOptions["secret"], name: string): Promise<
    string | undefined | false
  >;
  (
    secret: CookieAdapterOptions["secret"],
    name: string,
    prefixOptions?: CookiePrefixOptions
  ): Promise<string | undefined | false>;
}

export interface SetSignedCookie {
  (
    name: string,
    value: string,
    secret: CookieAdapterOptions["secret"],
    opt?: CookieOptions
  ): Promise<void>;
}

const DEFAULT_ADAPTER_OPTIONS: CookieAdapterOptions = {
  secret: undefined,
  signed: false,
  algorithm: { name: "HMAC", hash: "SHA-256" },
  defaultOptions: {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60,
  },
};

export function cookie(
  options: CookieAdapterOptions = DEFAULT_ADAPTER_OPTIONS
) {
  if (options.signed) {
    if (!options.secret) {
      throw new Error("secret is required when signed is true");
    }
    setSignAlgorithm(options.algorithm);
  }
  return function (app: Application) {
    const cookieMiddleware: HoaMiddleware = async (
      ctx: HoaContext,
      next: NextFunction
    ) => {
      const getCookie = ((
        name?: string,
        prefixOptions?: CookiePrefixOptions
      ): string | undefined | Cookie => {
        const cookie = ctx.req.get("cookie");
        if (typeof name === "string") {
          if (!cookie) return undefined;
          let finalName = name;
          if (prefixOptions === "secure") {
            finalName = "__Secure-" + name;
          } else if (prefixOptions === "host") {
            finalName = "__Host-" + name;
          }
          const obj = parse(cookie, finalName);
          return obj[finalName];
        }
        if (!cookie) return {};
        return parse(cookie);
      }) as GetCookie;
      const setSignedCookie: SetSignedCookie = async (
        name: string,
        value: string,
        secret: CookieAdapterOptions["secret"],
        opt?: CookieOptions
      ) => {
        const cookie = await generateSignedCookie(name, value, secret, opt);
        ctx.res.append("Set-cookie", cookie);
      };
      const getSignedCookie: GetSignedCookie = async (
        secret: CookieAdapterOptions["secret"],
        name?: string,
        prefixOptions?: CookiePrefixOptions
      ) => {
        const cookie = ctx.req.get("cookie");
        if (typeof name === "string") {
          if (!cookie) return undefined;
          let finalName = name;
          if (prefixOptions === "secure") {
            finalName = "__Secure-" + name;
          } else if (prefixOptions === "host") {
            finalName = "__Host-" + name;
          }
          const obj = await parseSigned(cookie, finalName);
          return obj[finalName];
        }
        if (!cookie) {
          return {};
        }
        return await parseSigned(cookie, secret);
      };
      const setCookie: SetCookie = (
        name: string,
        value: string,
        opt: CookieOptions = options.defaultOptions
      ) => {
        const cookie = generateCookie(name, value, opt);
        ctx.res.append("Set-cookie", cookie);
      };
      const deleteCookie: DeleteCookie = (
        name: string,
        opt?: CookieOptions
      ): string | undefined => {
        const deletedCookie = getCookie(name, opt?.prefix);
        setCookie(name, "", { ...opt, maxAge: 0 });
        return deletedCookie;
      };
      ctx.req["getCookie"] = getCookie;
      ctx.req["getSignedCookie"] = getSignedCookie;
      ctx.res["setCookie"] = setCookie;
      ctx.res["setSignedCookie"] = setSignedCookie;
      ctx.res["deleteCookie"] = deleteCookie;
      return next();
    };
    app.use(cookieMiddleware);
    return app;
  };
}

export default cookie;
