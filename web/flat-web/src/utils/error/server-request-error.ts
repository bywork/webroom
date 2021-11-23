/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-10-23 12:32:30
 * @LastEditors: lmk
 * @Description:二开标识 全局错误处理
 */
import { RequestError } from "./request-error";
import { RequestErrorCode, RequestErrorMessage } from "../../constants/error-code";

export class ServerRequestError extends RequestError {
    public errorCode: RequestErrorCode;
    public errorMessage: string;

    public constructor(errorCode: RequestErrorCode) {
        super(`request failed: ${errorCode}`);
        this.errorCode = errorCode;
        this.errorMessage = RequestErrorMessage[errorCode];
    }
}

export class ServerRequestErrorMessage extends RequestError {
    public errorMessage: string;

    public constructor(errorMessage: string) {
        super(`request failed: ${errorMessage}`);
        this.errorMessage = errorMessage;
    }
}
