/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-10-25 11:43:19
 * @LastEditors: lmk
 * @Description:二开标识 请求地址api配置文件
 */
import Axios, { AxiosRequestConfig } from "axios";
import { globalStore } from "../../stores/GlobalStore";
import { FLAT_SERVER_VERSIONS, qqyyStatus, Status } from "./constants";
import {
    ServerRequestError,
    ServerRequestErrorMessage,
} from "../../utils/error/server-request-error";
import { RequestErrorCode } from "../../constants/error-code";

export type FlatServerResponse<T> =
    | {
          status: Status.Success | boolean;
          message: qqyyStatus.Success;
          result: T;
          rows?: any[];
          total?: number;
      }
    | {
          status: Status.Failed | boolean;
          code?: RequestErrorCode;
          message: qqyyStatus.Failed;
      };
export async function post<Result>(
    action: string,
    payload: AxiosRequestConfig["data"],
    params?: AxiosRequestConfig["params"],
): Promise<Result> {
    const config: AxiosRequestConfig = {
        params,
    };

    const Authorization = payload?.token || globalStore.userInfo?.token;
    if (!Authorization) {
        throw new ServerRequestError(RequestErrorCode.NeedLoginAgain);
    }

    config.headers = {
        Authorization: `${globalStore.userInfo?.token_type || "Bearer"} ${Authorization}`,
    };
    const domain = params?.apiModule || payload?.apiModule || FLAT_SERVER_VERSIONS.V1;
    // 二开标识 配置完成后删除apiModule
    if (params?.apiModule) {
        delete params.apiModule;
    }
    if (payload?.apiModule) {
        delete payload.apiModule;
    }
    if (payload?.token) {
        delete payload.token;
    }
    const { data: res } = await Axios.post<FlatServerResponse<Result>>(
        `${domain}/${action}`,
        payload,
        config,
    );

    if (res.message !== qqyyStatus.Success) {
        throw new ServerRequestErrorMessage(res.message);
    }
    // 如果没有res.result 则封装返回
    if (res.rows) {
        res.result = { rows: res.rows, total: res.total } as unknown as Result;
    }
    return res.result;
}

export async function get<Result>(
    action: string,
    params?: AxiosRequestConfig["params"],
): Promise<Result> {
    const config: AxiosRequestConfig = {
        params,
    };

    const Authorization = globalStore.userInfo?.token;
    if (!Authorization) {
        throw new ServerRequestError(RequestErrorCode.NeedLoginAgain);
    }

    config.headers = {
        Authorization: `${globalStore.userInfo?.token_type} ${Authorization}`,
    };
    const domain = params?.apiModule || FLAT_SERVER_VERSIONS.V1;
    // 二开标识 配置完成后删除apiModule
    if (params?.apiModule) {
        delete params.apiModule;
    }
    const { data: res } = await Axios.get<FlatServerResponse<Result>>(
        `${domain}/${action}`,
        config,
    );
    if (res.message !== qqyyStatus.Success) {
        throw new ServerRequestErrorMessage(res.message);
    }
    // 如果没有res.result 则封装返回
    if (res.rows) {
        res.result = { rows: res.rows, total: res.total } as unknown as Result;
    }
    return res.result;
}

export async function postNotAuth<Payload, Result>(
    action: string,
    payload: Payload,
    params?: AxiosRequestConfig["params"],
): Promise<Result> {
    const config: AxiosRequestConfig = {
        params,
    };

    const { data: res } = await Axios.post<FlatServerResponse<Result>>(
        `${FLAT_SERVER_VERSIONS.V1}/${action}`,
        payload,
        config,
    );

    if (res.message !== qqyyStatus.Success) {
        throw new ServerRequestErrorMessage(res.message);
    }
    return res.result;
}

export async function getNotAuth<Result>(
    action: string,
    params?: AxiosRequestConfig["params"],
): Promise<Result> {
    const config: AxiosRequestConfig = {
        params,
    };

    const { data: res } = await Axios.get<FlatServerResponse<Result>>(
        `${FLAT_SERVER_VERSIONS.V1}/${action}`,
        config,
    );

    if (res.message !== qqyyStatus.Success) {
        throw new ServerRequestErrorMessage(res.message);
    }
    return res.result;
}
