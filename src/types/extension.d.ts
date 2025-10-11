import { GetCookie, SetCookie, DeleteCookie, GetSignedCookie, SetSignedCookie, } from './index'

declare module 'hoa' {
  interface HoaRequest {
    getCookie: GetCookie
    getSignedCookie: GetSignedCookie
  }

  interface HoaResponse {
    setCookie: SetCookie
    setSignedCookie: SetSignedCookie
    deleteCookie: DeleteCookie
  }

}
