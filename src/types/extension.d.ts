import { GetCookie, SetCookie, DeleteCookie } from './index'

declare module 'hoa' {
  interface HoaRequest {
    getCookie: GetCookie
    setCookie: SetCookie
    deleteCookie: DeleteCookie
  }

  interface HoaResponse {
    getCookie: GetCookie
    setCookie: SetCookie
    deleteCookie: DeleteCookie
  }
}
