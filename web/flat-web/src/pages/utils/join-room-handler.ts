/*
 * @Author: lmk
 * @Date: 2021-10-29 21:55:48
 * @LastEditTime: 2021-11-04 23:49:27
 * @LastEditors: lmk
 * @Description:
 */
import { RouteNameType, usePushHistory } from "../../utils/routes";
import { roomStore } from "../../stores/room-store";
import { RoomType } from "../../api-middleware/flatServer/constants";
import { errorTips } from "../../components/Tips/ErrorTips";
import { JoinRoomResult, subscriberPayload } from "src/api-middleware/flatServer";
import { message } from "antd";

interface txtResult {
    desc: string;
    confirmTxt: string;
}
// 返回显示内容
const txtObj = (allow_status: number): txtResult => {
    let desc = "message";
    let confirmTxt = "确定";
    switch (allow_status) {
        case 2: {
            // 粉丝进入
            desc = "关注对方，成为粉丝可进入";
            confirmTxt = "关注&进入";
            break;
        }
        case 3: {
            // 铁粉进入
            desc = "仅允许铁粉进入，是否订阅对方？";
            confirmTxt = "订阅&进入";
            break;
        }
        case 4: {
            // 铁粉购票进入
            desc = "应许铁粉、购票进入，去购票<br>注：成为铁粉，免门票。";
            confirmTxt = "购票&进入";
            break;
        }
        case 5: {
            // 购票进入
            desc = "应许购票进入，去购票";
            confirmTxt = "购票&进入";
            break;
        }
    }
    return { desc, confirmTxt };
};
// 点击加入
const joinRoomFn = async (
    isBuy: boolean,
    roomUUID: string,
    formatRoomUUID: string,
    pushHistory: ReturnType<typeof usePushHistory>,
): Promise<void> => {
    try {
        isBuy && (await buy(roomUUID));
        const roomData = await roomStore.joinRoom(formatRoomUUID);
        joinRoom(roomData, pushHistory);
    } catch (error) {
        return Promise.reject();
    }
};
export const joinRoomHandler = async (
    roomUUID: string,
    pushHistory: ReturnType<typeof usePushHistory>,
    openNotification?: (description: string, confirmTxt: string, comfirm: () => void) => void,
    isOther?: boolean,
    subscriberDialog?: (
        subscriber: (payload: subscriberPayload) => Promise<void>,
        ownerUUID: string,
    ) => void,
): Promise<void> => {
    try {
        const formatRoomUUID = roomUUID.replace(/\s+/g, "");
        const data = await roomStore.joinRoom(formatRoomUUID);
        console.log(data);
        const txt = txtObj(data.allow_status);
        const desc: string = txt.desc;
        const confirmTxt = txt.confirmTxt;
        // await follow(data.ownerUUID);
        const comfirm = async (): Promise<void> => {
            switch (data.allow_status) {
                case 2: {
                    // 粉丝进入
                    await follow(data.ownerUUID);
                    void joinRoomFn(false, roomUUID, formatRoomUUID, pushHistory);
                    break;
                }
                case 3: {
                    // 铁粉进入
                    subscriberDialog!(subscriber, data.ownerUUID);
                    break;
                }
                case 4: {
                    // 铁粉购票进入
                    subscriberDialog!(subscriber, data.ownerUUID);
                    break;
                }
                case 5: {
                    // 购票进入
                    void joinRoomFn(true, roomUUID, formatRoomUUID, pushHistory);
                    break;
                }
            }
        };
        // 订阅
        const subscriber = async (payload: subscriberPayload): Promise<void> => {
            try {
                await roomStore.subscriberSave(payload);
                void joinRoomFn(false, roomUUID, formatRoomUUID, pushHistory);
                return Promise.resolve();
            } catch (error) {
                return Promise.reject();
            }
        };
        // 不是直接进入的需要弹框
        if (data.allow_status !== 1 && isOther) {
            openNotification!(desc, confirmTxt, comfirm);
            return;
        }
        // 直接进入则直接进入了
        joinRoom(data, pushHistory);
    } catch (e) {
        const a = e as Error;
        errorTips(a);
    }
};
// 加入房间
const joinRoom = (data: JoinRoomResult, pushHistory: ReturnType<typeof usePushHistory>): void => {
    switch (data.roomType) {
        case RoomType.BigClass: {
            pushHistory(RouteNameType.BigClassPage, data);
            break;
        }
        case RoomType.SmallClass: {
            pushHistory(RouteNameType.SmallClassPage, data);
            break;
        }
        case RoomType.OneToOne: {
            pushHistory(RouteNameType.OneToOnePage, data);
            break;
        }
        default: {
            new Error("failed to join room: incorrect room type");
        }
    }
};
// 关注
const follow = async (master_uid: string): Promise<boolean> => {
    try {
        await roomStore.followUser(master_uid);
        void message.success("关注成功");
        return true;
    } catch (error) {
        return false;
    }
};
// 购票
const buy = async (room_id: string): Promise<boolean> => {
    try {
        await roomStore.buyTicket(room_id);
        void message.success("购票成功");
        return true;
    } catch (error) {
        return false;
    }
};
// 铁粉订阅
