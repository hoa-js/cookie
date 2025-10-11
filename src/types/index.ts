/// <reference path="./extension.d.ts" />

export interface GetCookie {
  (): Cookie;
  (name: string): string | undefined;
  (name: string, prefixOptions: CookiePrefixOptions): string | undefined;
}

export interface SetCookie {
  (name: string, value: string, options?: CookieOptions): void;
}

export interface DeleteCookie {
  (name: string, options?: CookieOptions): string | undefined;
}

export interface GetSignedCookie {
  (): Promise<SignedCookie>;
  (name: string): Promise<string | undefined | false>;
  (name: string, prefixOptions: CookiePrefixOptions): Promise<string | undefined | false>;
}

export interface SetSignedCookie {
  (
    name: string,
    value: string,
    opt?: CookieOptions
  ): Promise<void>;
}

export type Cookie = Record<string, string>

export type SignedCookie = Record<string, string | false>

type PartitionedCookieConstraint =
  | { partitioned: true; secure: true }
  | { partitioned?: boolean; secure?: boolean }

type SecureCookieConstraint = { secure: true }

type HostCookieConstraint = { secure: true; path: '/'; domain?: undefined }

export type CookiePrefixOptions = 'host' | 'secure'

export type Secret = string | BufferSource

export type CookieAdapterOptions = {
  secret?: Secret
  signed?: boolean
  defaultOptions?: CookieOptions
}

export type CookieOptions = {
  domain?: string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None' | 'strict' | 'lax' | 'none'
  partitioned?: boolean
  priority?: 'Low' | 'Medium' | 'High' | 'low' | 'medium' | 'high'
  prefix?: CookiePrefixOptions
} & PartitionedCookieConstraint

export type CookieConstraint<Name> = Name extends `__Secure-${string}`
  ? CookieOptions & SecureCookieConstraint
  : Name extends `__Host-${string}`
    ? CookieOptions & HostCookieConstraint
    : CookieOptions

export type Decoder = (str: string) => string
