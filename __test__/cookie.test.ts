import { parseCookie, parseSignedCookie, serialize, serializeSigned, generateSignedCookie, generateCookie, tryDecode } from '../src/cookie.js'
import type { Cookie, SignedCookie } from '../src/types/index.js'

describe('Parse cookie', () => {
  it('Should parse cookies', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
  })

  it('Should parse quoted cookie values', () => {
    const cookieString =
      'hoa_cookie="apple"; user_name = " strawberry " ; best_cookie="%20sugar%20";'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe(' strawberry ')
    expect(cookie['best_cookie']).toBe(' sugar ')
  })

  it('Should not throw a URIError when parsing an invalid string', () => {
    const cookieString = 'hoa_cookie="apple%2";'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple%2')
  })

  it('Should parse empty cookies', () => {
    const cookie: Cookie = parseCookie('')
    expect(Object.keys(cookie).length).toBe(0)
  })

  it('Should parse one cookie specified by name', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa '
    const cookie: Cookie = parseCookie(cookieString, 'hoa_cookie')
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse one cookie specified by name even if it is not found', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa '
    const cookie: Cookie = parseCookie(cookieString, 'no_such_cookie')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse cookies with no value', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;last_path=;'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
    expect(cookie['last_path']).toBe('')
  })

  it('Should parse cookies but not process signed cookies', () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBe('apple')
    expect(cookie['user_name']).toBe('hoa')
    expect(cookie['signed_last_path']).toBe('z33WMw.+HQZYtat78aYvt5+6gmjdy7KPSigOJGhoR+tyvNoeyw=')
  })

  it('Should ignore invalid cookie names', () => {
    const cookieString = 'hoa cookie=apple;hoa_m=banana; user_name\\ = hoa ;=AS9+01;'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa cookie']).toBeUndefined()
    expect(cookie['hoa_m']).toBe('banana')
    expect(cookie['user_name\\']).toBeUndefined()
    expect(cookie['']).toBeUndefined()
  })

  it('Should ignore invalid cookie values', () => {
    const cookieString = 'hoa_cookie=apple\\npen;hoa_m=banana;'
    const cookie: Cookie = parseCookie(cookieString)
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['hoa_m']).toBe('banana')
  })

  it('Should parse signed cookies and ignore unsigned cookie', async () => {
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const secret = '123456'
    const cookie: SignedCookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['signed_last_path']).toBe('z33WMw')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse signed cookies with binary secret and ignore unsigned cookie', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'hoa_cookie=apple; user_name = hoa ;signed_last_path=z33WMw.%2BHQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: SignedCookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['signed_last_path']).toBe('z33WMw')
    expect(cookie['hoa_cookie']).toBeUndefined()
    expect(cookie['user_name']).toBeUndefined()
  })

  it('Should parse signed cookies containing the signature separator', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;'
    const cookie: SignedCookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['sign_last_path_dot']).toBe('z33WMw.demo')
  })

  it('Should parse signed cookies and return "false" for wrong signature', async () => {
    const secret = new TextEncoder().encode('123456')
    const cookieString = 'sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;signed_last_path=z33WMw.%2BQZYtat78aYvt5%2B6gmjdy7KPSigOJGhoR%2BtyvNoeyw%3D;'
    const cookie: SignedCookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['sign_last_path_dot']).toBe('z33WMw.demo')
    expect(cookie['signed_last_path']).toBeFalsy()
  })

  it('Should parse one signed cookie specified by name', async () => {
    const secret = '123456'
    const cookieString =
      'hoa_cookie=apple;sign_last_path_dot=z33WMw.demo.PMsCGD5H8eqSD9NPII8WRtIcUrfdE9nt%2FsNpPYaIStU%3D;'
    const cookie: SignedCookie = await parseSignedCookie(cookieString, secret, 'sign_last_path_dot')
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

describe('Cookie constraints and errors', () => {
  it('Should throw on __Secure- cookie without Secure attribute', () => {
    expect(() => serialize('__Secure-a', 'v', { path: '/' } as any)).toThrow('__Secure- Cookie must have Secure attributes')
  })

  it('Should throw on __Host- cookie without Secure attribute', () => {
    expect(() => serialize('__Host-a', 'v', { path: '/' } as any)).toThrow('__Host- Cookie must have Secure attributes')
  })

  it('Should throw on __Host- cookie with non-root path', () => {
    expect(() => serialize('__Host-a', 'v', { path: '/abc', secure: true } as any)).toThrow('__Host- Cookie must have Path attributes with "/"')
  })

  it('Should throw on __Host- cookie with Domain attribute', () => {
    expect(() => serialize('__Host-a', 'v', { path: '/', secure: true, domain: 'example.com' } as any)).toThrow('__Host- Cookie must not have Domain attributes')
  })

  it('Should throw on Expires beyond 400 days into the future', () => {
    const farFuture = new Date(Date.now() + 34560000_000 + 60_000)
    expect(() => serialize('a', 'v', { expires: farFuture })).toThrow('Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.')
  })

  it('Should normalize lowercase SameSite values', () => {
    expect(serialize('a', 'v', { sameSite: 'strict' })).toContain('SameSite=Strict')
    expect(serialize('b', 'v', { sameSite: 'lax' })).toContain('SameSite=Lax')
    expect(serialize('c', 'v', { sameSite: 'none' })).toContain('SameSite=None')
  })
})

describe('Signed cookie format edge cases', () => {
  it('Should skip signed cookie with invalid signature format (not 44 chars or not ending with "=")', async () => {
    const secret = '123456'
    const cookieString = 's=z33WMw.bad;'
    const cookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['s']).toBeUndefined()
  })

  it('Should set value to false when signature base64 is invalid (verifySignature catch path)', async () => {
    const secret = '123456'
    const invalidSig = '###########################################='
    const cookieString = `s=z33WMw.${invalidSig};`
    const cookie = await parseSignedCookie(cookieString, secret)
    expect(cookie['s']).toBe(false)
  })

  it('Should reject parseSignedCookie when secret is undefined', async () => {
    const cookieString = 's=z33WMw.###########################################='
    await expect(parseSignedCookie(cookieString, undefined as any)).rejects.toThrow('secret is required to sign/verify cookies')
  })

  it('Should reject serializeSigned when secret is undefined', async () => {
    await expect(serializeSigned('a', 'v', undefined as any)).rejects.toThrow('secret is required to sign/verify cookies')
  })
})

describe('generateSignedCookie prefixes', () => {
  it('Should generate signed cookie with __Secure- prefix and enforce Secure and Path=/', async () => {
    const secret = '123456'
    const c = await generateSignedCookie('n', 'val', secret, { prefix: 'secure' })
    expect(c).toContain('__Secure-n=')
    expect(c).toContain('Path=/')
    expect(c).toContain('Secure')
  })

  it('Should generate signed cookie with __Host- prefix enforcing Path=/, Secure and no Domain', async () => {
    const secret = '123456'
    const c = await generateSignedCookie('n', 'val', secret, { prefix: 'host', domain: 'example.com' })
    expect(c).toContain('__Host-n=')
    expect(c).toContain('Path=/')
    expect(c).toContain('Secure')
    expect(c).not.toContain('Domain=')
  })
})

describe('Additional cookie.ts edge cases for coverage', () => {
  it('Should decode valid percent sequences while preserving invalid ones via tryDecode fallback', () => {
    const cookieString = 'mix="bad%2 good%20X%ZZ";'
    const cookie: Cookie = parseCookie(cookieString, 'mix')
    expect(cookie['mix']).toBe('bad%2 good X%ZZ')
  })

  it('Should floor fractional maxAge values', () => {
    const serialized = serialize('age', 'v', { maxAge: 1.9 })
    expect(serialized).toBe('age=v; Max-Age=1')
  })

  it('tryDecode should fallback to keep invalid percent sequences when decoder throws on chunk', () => {
    // Build a string with a mix of valid and invalid percent sequences
    const str = 'A%20B%GGC%ZZD%2E' // %20 and %2E are valid; %GG and %ZZ are invalid-like chunks
    // decoder that throws for any input containing 'GG' or 'ZZ', succeeds otherwise using decodeURIComponent
    const decoder = (s: string) => {
      if (s.includes('GG') || s.includes('ZZ')) throw new Error('bad percent seq')
      return decodeURIComponent(s)
    }
    const out = tryDecode(str, decoder)
    // Expected behavior:
    // - Whole-string decode fails, so we enter fallback replace
    // - For each contiguous percent sequence chunk:
    //   * valid ones (%20, %2E) are decoded
    //   * invalid-like ones cause decoder(match) to throw and should be kept as-is
    // Result should be: 'A B%GGC%ZZD.'
    expect(out).toBe('A B%GGC%ZZD.')
  })

  it('tryDecode should keep valid percent sequences when decoder throws on chunk', () => {
    const str = 'X%20Y%2EZ'
    // decoder that always throws so inner decoder(match) triggers catch and returns match
    const decoder = (_s: string) => { throw new Error('fail') }
    const out = tryDecode(str, decoder)
    expect(out).toBe('X%20Y%2EZ')
  })

  it('Should floor fractional maxAge values', () => {
    const serialized = serialize('age', 'v', { maxAge: 1.9 })
    expect(serialized).toBe('age=v; Max-Age=1')
  })

  it('generateCookie should enforce Secure and Path for secure prefix and keep Domain', () => {
    const serialized = generateCookie('n', 'val', { prefix: 'secure', secure: false, path: '/x', domain: 'example.com' })
    expect(serialized).toContain('__Secure-n=val')
    expect(serialized).toContain('Path=/')
    expect(serialized).toContain('Secure')
    expect(serialized).toContain('Domain=example.com')
  })

  it('generateCookie should enforce Path=/ and Secure for host prefix and strip Domain', () => {
    const serialized = generateCookie('n', 'val', { prefix: 'host', secure: false, path: '/x', domain: 'example.com' })
    expect(serialized).toContain('__Host-n=val')
    expect(serialized).toContain('Path=/')
    expect(serialized).toContain('Secure')
    expect(serialized).not.toContain('Domain=')
  })
})
