import { GetCookie, SetCookie, DeleteCookie, GetSignedCookie, SetSignedCookie, } from '../src/index'

declare module hoa {
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
