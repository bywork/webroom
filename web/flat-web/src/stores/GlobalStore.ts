/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-11-04 00:18:57
 * @LastEditors: lmk
 * @Description:二开标识 全局store管理 设置用户信息
 */
import { Region } from "flat-components";
import { autoPersistStore } from "./utils";
import { LoginProcessResult } from "../api-middleware/flatServer";
import type { UID } from "agora-rtc-sdk-ng";

// clear storage if not match
const LS_VERSION = 1;

export type UserInfo = LoginProcessResult;

/**
 * Properties in Global Store are persisted and shared globally.
 */
export class GlobalStore {
    /**
     * Show tooltips for classroom record hints.
     * Hide it permanently if user close the tooltip.
     */
    public isShowRecordHintTips = true;
    public userInfo: UserInfo | null = null;
    public whiteboardRoomUUID: string | null = null;
    public whiteboardRoomToken: string | null = null;
    // public: string | null = null;
    public region: Region | null = null;
    public rtcToken: string | null = null;
    public rtcUID: string | null = null;
    public rtcShareScreen: {
        uid: number;
        token: string;
    } | null = null;
    public rtmToken: string | null = null;
    public lastLoginCheck: number | null = null;

    public get userUUID(): string | undefined {
        return this.userInfo?.userUUID;
    }

    public get userName(): string | undefined {
        return this.userInfo?.name;
    }

    public constructor() {
        autoPersistStore({ storeLSName: "GlobalStore", store: this, version: LS_VERSION });
    }

    public updateUserInfo = (userInfo: UserInfo): void => {
        const userId = userInfo.id;
        this.userInfo = {
            name: userInfo.nickname,
            avatar: userInfo.headphoto,
            userUUID: userId,
            token: userInfo.access_token,
            ...userInfo,
        };
    };
    public updateToken = (
        config: Partial<
            Pick<
                GlobalStore,
                | "whiteboardRoomUUID"
                | "whiteboardRoomToken"
                | "rtcToken"
                | "rtmToken"
                | "rtcUID"
                | "rtcShareScreen"
                | "region"
            >
        >,
    ): void => {
        const keys = [
            "whiteboardRoomUUID",
            "whiteboardRoomToken",
            "",
            "rtcToken",
            "rtmToken",
            "rtcUID",
            "rtcShareScreen",
            "region",
        ] as const;
        for (const key of keys) {
            const value = config[key];
            if (value !== null && value !== undefined) {
                this[key] = value as any;
            }
        }
    };

    public logout = (): void => {
        this.userInfo = null;
        this.lastLoginCheck = null;
    };

    public hideRecordHintTips = (): void => {
        this.isShowRecordHintTips = false;
    };

    public isShareScreenUID = (uid: UID): boolean => {
        console.log(uid, this.rtcShareScreen?.uid, "we3e23233333");
        return true; // this.rtcShareScreen?.uid === uid; // 如果这里返回true 就肯定能成功
    };
}

export const globalStore = new GlobalStore();
