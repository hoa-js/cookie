/// <reference path="./extension.d.ts" />

export interface GetCookie {
  (name: string): Promise<string | undefined | false>;
  (name: string, opts: { prefix?: CookiePrefixOptions; signed?: boolean }): Promise<string | undefined | false>;
}

export interface SetCookie {
  (name: string, value: string, options?: CookieOptions): Promise<void>;
}

export interface DeleteCookie {
  (name: string): Promise<void>;
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
  signed?: boolean
} & PartitionedCookieConstraint

export type CookieConstraint<Name> = Name extends `__Secure-${string}`
  ? CookieOptions & SecureCookieConstraint
  : Name extends `__Host-${string}`
    ? CookieOptions & HostCookieConstraint
    : CookieOptions

export type Decoder = (str: string) => string
