/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-11-02 11:00:28
 * @LastEditors: lmk
 * @Description: 二开标识 配置请求地址
 */
export const NODE_ENV = process.env.NODE_ENV;

export const NETLESS = Object.freeze({
    APP_IDENTIFIER: process.env.NETLESS_APP_IDENTIFIER,
});

export const CLOUD_STORAGE_OSS_ALIBABA_CONFIG = Object.freeze({
    accessKey: process.env.CLOUD_STORAGE_OSS_ALIBABA_ACCESS_KEY,
    bucket: process.env.CLOUD_STORAGE_OSS_ALIBABA_BUCKET,
    region: process.env.CLOUD_STORAGE_OSS_ALIBABA_REGION,
});

export const AGORA = Object.freeze({
    APP_ID: process.env.AGORA_APP_ID,
});

export const WECHAT = Object.freeze({
    APP_ID: process.env.WECHAT_APP_ID,
});

export const GITHUB = Object.freeze({
    CLIENT_ID: process.env.GITHUB_CLIENT_ID,
});

export const FLAT_SERVER_DOMAIN = process.env.FLAT_SERVER_DOMAIN;
export const FLAT_WEB_DOMAIN = process.env.FLAT_WEB_DOMAIN;
// 二开标识  分享链接
export const INVITE_BASEURL = "https://nhclub.sirthink.cn";

// TODO: english version is WIP
export const PRIVACY_URL_CN = "https://flat.whiteboard.agora.io/privacy.html";
export const PRIVACY_URL = "https://flat.whiteboard.agora.io/privacy.html";

export const SERVICE_URL_CN = "https://flat.whiteboard.agora.io/service.html";
export const SERVICE_URL = "https://flat.whiteboard.agora.io/service.html";

// 二开标识
const API_DOMAIN = "qingqingyuyin.com";

// 登录地址
export const AUTH_DOMAIN = `https://authapi.${API_DOMAIN}/api`;
// 获取订单
export const WEBAPI_DOMAIN = `https://webapi.${API_DOMAIN}/api`;
// 创建房间
export const RTMAPI_DOMAIN = `https://rtmapi.${API_DOMAIN}/api`;
// 我的云盘
export const STORAGE_DOMAIN = `https://storageapi.${API_DOMAIN}/api`;
