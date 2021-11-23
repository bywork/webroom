import { Region } from "flat-components";
import { globalStore } from "../../stores/GlobalStore";
import { AUTH_DOMAIN, RTMAPI_DOMAIN, WEBAPI_DOMAIN } from "../../constants/process";
import { DocsType, RoomDoc, RoomStatus, RoomType, Sex, Week } from "./constants";
import { get, post, postNotAuth } from "./utils";
import { CreateOneRoomPayload } from "src/stores/room-store";

export interface CreateOrdinaryRoomPayload {
    /** 房间主题, 最多 50 字 */
    title?: string;
    /** 上课类型 */
    type?: RoomType;
    /** YYYY-MM-DD HH:mm */
    beginTime?: number;
    // /** 区域 */
    region?: Region;
    endTime?: number;
    /** 课件 */
    docs?: Array<{
        /** 文档类型 */
        type: DocsType;
        /** 文档的 uuid */
        uuid: string;
    }>;
    /** 房间主题, 最多 50 字 */
    room_name: string;
    room_type: string;
    begin_time: string;
    end_time: string;
    apiModule?: string;
    open_all: boolean;
    open_fans?: boolean;
    open_subscriber?: boolean;
    open_buyer?: boolean;
    ticket_price?: number;
}

export interface CreateOrdinaryRoomResult {
    roomUUID: string;
    inviteCode: string;
    room_id: string;
}
// 二开标识  创建多人房间
export async function createOrdinaryRoom(payload: CreateOrdinaryRoomPayload): Promise<string> {
    const res = await post<CreateOrdinaryRoomResult>("Agora/room/create/public", payload);
    return res.room_id;
}
// 二开标识 创建单人房间
export async function createOneRoom(payload: CreateOneRoomPayload): Promise<string> {
    const res = await post<CreateOrdinaryRoomResult>("Agora/room/create/private", payload);
    return res.room_id;
}

export interface CreatePeriodicRoomPayload {
    /** 房间主题, 最多 50 字 */
    title: string;
    /** 上课类型 */
    type: RoomType;
    /** 区域 */
    region: Region;
    /** UTC时间戳 */
    beginTime: number;
    endTime: number;
    /** 重复 */
    periodic:
        | {
              /** 重复周期, 每周的周几 */
              weeks: Week[];
              /** 重复几次就结束, -1..50 */
              rate: number;
          }
        | {
              weeks: Week[];
              /** UTC时间戳, 到这个点就结束 */
              endTime: number;
          };
    /** 课件 */
    docs?: Array<{
        /** 文档类型 */
        type: DocsType;
        /** 文档的 uuid */
        uuid: string;
    }>;
}

export type CreatePeriodicRoomResult = {};

export async function createPeriodicRoom(payload: CreatePeriodicRoomPayload): Promise<void> {
    await post<CreatePeriodicRoomResult>("room/create/periodic", payload);
}

export enum ListRoomsType {
    All = "all",
    Today = "today",
    Periodic = "periodic",
    History = "history",
}

export interface FlatServerRoom {
    /** 房间的 uuid */
    room_id: string;
    /** 房间的 uuid */
    roomUUID: string;
    /** 周期性房间的 uuid */
    periodicUUID: string | null;
    /** 房间所有者的 uuid */
    owner_id: string;
    /** 房间所有者的 uuid */
    ownerUUID: string;
    /** invite code of room */
    inviteCode: string;
    /** 房间类型  */
    room_type: string;
    /** 房间所有者的名称 */
    owner_name: string;
    /** 房间标题 */
    room_name: string;
    /** 房间开始时间 */
    begin_time: string;
    /** 结束时间 */
    end_time: string;
    /** 房间状态 */
    room_status: number;
    /** 开播范围 */
    open_all: boolean;
    /** 是否允许粉丝进入 */
    open_fans: boolean;
    /** 是否允许铁粉进入 */
    open_subscriber: boolean;
    /** 门票价格 */
    ticket_price: boolean;
    /** 是否存在录制(只有历史记录才会有) */
    hasrecord?: boolean;
    /** 房间类型  */
    roomType: RoomType;
    /** 房间所有者的名称 */
    ownerUserName: string;
    /** 房间标题 */
    title: string;
    /** 房间开始时间 */
    beginTime: number;
    /** 结束时间 */
    endTime: number;
    /** 房间状态 */
    roomStatus: RoomStatus;
    /** 是否存在录制(只有历史记录才会有) */
    hasRecord?: boolean;
}

export type ListRoomsPayload = {
    page: number;
    listRoomsType?: string;
    isOther: boolean; // 是否为多人间模块请求
};

export type postRows = {
    rows: any[];
    total: number;
};
export type ListRoomsResult = FlatServerRoom[];
// 二开标识 获取我的房间列表
export async function listRooms(payload: ListRoomsPayload): Promise<ListRoomsResult> {
    const { rows } = await post<postRows>("Agora/room/self/list", {
        ...payload,
        apiModule: RTMAPI_DOMAIN,
    });
    return rows;
}
// 二开标识 获取我的房间列表
export async function listOtherRooms(payload: ListRoomsPayload): Promise<ListRoomsResult> {
    const { rows } = await post<postRows>("Agora/room/public/list", {
        ...payload,
        apiModule: RTMAPI_DOMAIN,
    });
    return rows;
}

export interface JoinRoomPayload {
    uuid: string;
}

export interface JoinRoomResult {
    allow_msg: string;
    allow_status: number;
    room?: any;
    roomType: RoomType; // 房间类型
    roomUUID: string; // 当前房间的 UUID
    ownerUUID: string; // 房间创建者的 UUID
    whiteboardRoomToken: string; // 白板的 room token
    whiteboardRoomUUID: string; // 白板的 room uuid
    rtcUID: string; // rtc 的 uid
    rtcToken: string; // rtc token
    rtcShareScreen?: {
        uid: number;
        token: string;
    };
    rtmToken?: string; // rtm token
}
// 二开标识  加入房间
export async function joinRoom(uuid: string): Promise<JoinRoomResult> {
    const res = await post<JoinRoomResult>("Agora/room/join", {
        room_id: uuid,
        plat: "web",
        apiModule: RTMAPI_DOMAIN,
    }); // 加入房间时应该返回屏幕共享的参数 如果没有返回则不能屏幕共享
    const data = { ...res, ...res.room };
    switch (data.room_type) {
        case "Big": {
            data.roomType = RoomType.BigClass;
            break;
        }
        case "Small": {
            data.roomType = RoomType.SmallClass;
            break;
        }
        case "OneToOne": {
            data.roomType = RoomType.OneToOne;
            break;
        }
        default: {
            data.roomType = data.room_type;
            break;
        }
    }
    const obj = {
        roomType: data.roomType,
        roomUUID: data.room_id,
        ownerUUID: data.owner_id,
        whiteboardRoomToken: data.whiteboard_room_token,
        whiteboardRoomUUID: data.whiteboard_room_id,
        rtcUID: data.rtc_uid,
        rtcToken: data.rtc_token,
        rtmToken: globalStore.userInfo?.chat_token,
        rtcShareScreen: res.rtcShareScreen,
        open_all: data.open_all,
        open_buyer: data.open_buyer,
        open_fans: data.open_fans,
        open_subscriber: data.open_subscriber,
        ticket_price: data.ticket_price,
        allow_msg: data.allow_msg,
        allow_status: data.allow_status,
    };
    return obj;
}

export interface UsersInfoPayload {
    room_id: string;
    usersUUID: string[]; // 要参看的用户 uuid 列表
}

export type UsersInfoResult = {
    [key in string]: {
        name: string;
        rtcUID: string;
        avatarURL: string;
    };
};
// 二开标识 获取房间用户列表
export async function usersInfo(payload: UsersInfoPayload): Promise<UsersInfoResult> {
    const data = await post<postRows>("Agora/room/info/users", {
        ...payload,
        apiModule: RTMAPI_DOMAIN,
    });
    const obj = {} as UsersInfoResult;
    data.rows.forEach(val => {
        obj[val.id] = {
            name: val.nickname,
            avatarURL: val.headphoto,
            rtcUID: `${val.id}`,
        };
    });
    return obj;
}

export interface OrdinaryRoomInfo {
    title: string;
    room_name: string;
    begin_time: string;
    end_time: string;
    beginTime: number;
    endTime: number;
    roomType: RoomType;
    room_type: string;
    roomStatus: RoomStatus;
    room_status: number;
    ownerUUID: string;
    owner_id: string;
    ownerUserName: string;
    owner_name: string;
    region: Region;
}

export interface OrdinaryRoomInfoPayload {
    roomUUID: string;
}

export interface OrdinaryRoomInfoResult {
    roomInfo: OrdinaryRoomInfo;
    docs: RoomDoc[];
    inviteCode: string;
}

export async function ordinaryRoomInfo(roomUUID: string): Promise<OrdinaryRoomInfoResult> {
    const data = await post<OrdinaryRoomInfoResult>("Agora/room/info/ordinary", {
        room_id: roomUUID,
        apiModule: RTMAPI_DOMAIN,
    });
    data.roomInfo.roomStatus = [
        RoomStatus.Idle,
        RoomStatus.Started,
        RoomStatus.Paused,
        RoomStatus.Stopped,
    ][data.roomInfo.room_status];
    // Small
    switch (data.roomInfo.room_type) {
        case "Big": {
            data.roomInfo.roomType = RoomType.BigClass;
            break;
        }
        case "Small": {
            data.roomInfo.roomType = RoomType.SmallClass;
            break;
        }
        default: {
            data.roomInfo.roomType = data.roomInfo.room_type as RoomType;
            break;
        }
    }
    return data;
}

export interface PeriodicSubRoomInfoPayload {
    periodicUUID: string;
    roomUUID: string;
    /** 是否需要上一节课和下一节课的相关时间(只对owner起作用 */
    needOtherRoomTimeInfo?: boolean;
}

export interface PeriodicSubRoomInfo {
    title: string;
    beginTime: number;
    endTime: number;
    roomType: RoomType;
    roomStatus: RoomStatus;
    ownerUUID: string;
    ownerUserName: string;
    region: Region;
}

export interface PeriodicSubRoomInfoResult {
    roomInfo: PeriodicSubRoomInfo;
    previousPeriodicRoomBeginTime: number | null; // 上一节课的开始时间
    nextPeriodicRoomEndTime: number | null; // 下一节课的结束时间
    count: number; // 当前周期性房间下一共有多少节课
    docs: RoomDoc[];
}

export function periodicSubRoomInfo(
    payload: PeriodicSubRoomInfoPayload,
): Promise<PeriodicSubRoomInfoResult> {
    return post<PeriodicSubRoomInfoResult>("room/info/periodic-sub-room", payload);
}

export interface PeriodicRoomInfoPayload {
    periodicUUID: string;
}

export type PeriodicRoomInfoResult = {
    periodic: {
        ownerUUID: string; // 创建者的 uuid
        ownerUserName: string;
        endTime: number;
        rate: number | null; // 默认为 0（即 用户选择的是 endTime）
        title: string;
        weeks: Week[];
        roomType: RoomType;
        region: Region;
        inviteCode: string;
    };
    rooms: Array<{
        roomUUID: string;
        beginTime: number;
        endTime: number;
        roomStatus: RoomStatus;
    }>;
};

export function periodicRoomInfo(periodicUUID: string): Promise<PeriodicRoomInfoResult> {
    return post<PeriodicRoomInfoResult>("room/info/periodic", {
        periodicUUID,
    });
}

export interface StartClassPayload {
    roomUUID: string;
}

export type StartClassResult = {};

export function startClass(roomUUID: string): Promise<StartClassResult> {
    return post<StartClassResult>("Agora/room/update-status/started", {
        room_id: roomUUID,
        apiModule: RTMAPI_DOMAIN,
    });
}

export interface PauseClassPayload {
    roomUUID: string;
}

export type PauseClassResult = {};

export function pauseClass(roomUUID: string): Promise<PauseClassResult> {
    return post<StartClassResult>("Agora/room/update-status/paused", {
        room_id: roomUUID,
        apiModule: RTMAPI_DOMAIN,
    });
}

export interface StopClassPayload {
    roomUUID: string;
}

export type StopClassResult = {};

export function stopClass(roomUUID: string): Promise<StopClassResult> {
    return post<StartClassResult>("Agora/room/update-status/stopped", {
        room_id: roomUUID,
        apiModule: RTMAPI_DOMAIN,
    });
}

type CancelOrdinaryRoomResult = {};

function cancelOrdinaryRoom(roomUUID: string): Promise<CancelOrdinaryRoomResult> {
    return post<CancelOrdinaryRoomResult>("Agora/room/cancel", {
        room_id: roomUUID,
        apiModule: RTMAPI_DOMAIN,
    });
}

type CancelPeriodicRoomResult = {};

export function cancelPeriodicRoom(periodicUUID: string): Promise<CancelPeriodicRoomResult> {
    return post<CancelPeriodicRoomResult>("room/cancel/periodic", {
        periodicUUID,
    });
}

type CancelPeriodicSubRoomResult = {};

interface CancelPeriodicSubRoomPayload {
    roomUUID: string;
    periodicUUID: string;
}

export function cancelPeriodicSubRoom(
    payload: CancelPeriodicSubRoomPayload,
): Promise<CancelPeriodicSubRoomResult> {
    return post<CancelPeriodicSubRoomResult>("room/cancel/periodic-sub-room", payload);
}

type CancelHistoryRoomResult = {};

function cancelHistoryRoom(roomUUID: string): Promise<CancelHistoryRoomResult> {
    return post<CancelHistoryRoomResult>("room/cancel/history", {
        roomUUID,
    });
}

export type CancelRoomResult = {};

export type CancelRoomPayload = {
    all?: boolean;
    roomUUID?: string;
    periodicUUID?: string;
    isHistory?: boolean;
};

export function cancelRoom({
    all,
    roomUUID,
    periodicUUID,
    isHistory,
}: CancelRoomPayload): Promise<
    CancelPeriodicRoomResult | CancelPeriodicSubRoomResult | CancelOrdinaryRoomResult
> | void {
    if (all && periodicUUID) {
        return cancelPeriodicRoom(periodicUUID);
    }

    if (roomUUID && periodicUUID) {
        return cancelPeriodicSubRoom({ roomUUID, periodicUUID });
    }

    if (isHistory && roomUUID) {
        return cancelHistoryRoom(roomUUID);
    }

    if (!isHistory && roomUUID) {
        return cancelOrdinaryRoom(roomUUID);
    }

    return;
}

export interface StartRecordRoomPayload {
    roomUUID: string;
}

export type StartRecordRoomResult = {};

export function startRecordRoom(roomUUID: string): Promise<StartRecordRoomResult> {
    return post<StartRecordRoomResult>("room/record/started", {
        roomUUID,
    });
}

export interface StopRecordRoomPayload {
    roomUUID: string;
}

export type StopRecordRoomResult = {};

export function stopRecordRoom(roomUUID: string): Promise<StopRecordRoomResult> {
    return post<StopRecordRoomResult>("room/record/stopped", {
        roomUUID,
    });
}

export interface UpdateRecordEndTimePayload {
    roomUUID: string;
}

export type UpdateRecordEndTimeResult = {};

export function updateRecordEndTime(roomUUID: string): Promise<UpdateRecordEndTimeResult> {
    return post<UpdateRecordEndTimeResult>("room/record/update-end-time", {
        roomUUID,
    });
}

export interface RecordInfoPayload {
    roomUUID: string;
}

export interface RecordInfoResult {
    title: string;
    ownerUUID: string;
    roomType: RoomType;
    whiteboardRoomToken: string;
    whiteboardRoomUUID: string;
    region: Region;
    rtmToken: string;
    recordInfo: Array<{
        beginTime: number;
        endTime: number;
        videoURL?: string;
    }>;
}

export function recordInfo(roomUUID: string): Promise<RecordInfoResult> {
    return post<RecordInfoResult>("room/record/info", { roomUUID });
}

export interface UpdateOrdinaryRoomPayload {
    roomUUID: string;
    beginTime: number;
    endTime: number;
    title: string;
    type: RoomType;
    docs?: Array<{
        /** 文档类型 */
        type: DocsType;
        /** 文档的 uuid */
        uuid: string;
    }>;
}

export type UpdateOrdinaryRoomResult = {};

export async function updateOrdinaryRoom(payload: UpdateOrdinaryRoomPayload): Promise<void> {
    await post<UpdateOrdinaryRoomResult>("room/update/ordinary", payload);
}
export interface UpdatePeriodicRoomPayload {
    periodicUUID: string;
    beginTime: number;
    endTime: number;
    title: string;
    type: RoomType;
    /** 重复 */
    periodic:
        | {
              /** 重复周期, 每周的周几 */
              weeks: Week[];
              /** 重复几次就结束, -1..50 */
              rate: number;
          }
        | {
              weeks: Week[];
              /** UTC时间戳, 到这个点就结束 */
              endTime: number;
          };
    docs?: Array<{
        /** 文档类型 */
        type: DocsType;
        /** 文档的 uuid */
        uuid: string;
    }>;
}

export type UpdatePeriodicRoomResult = {};

export async function updatePeriodicRoom(payload: UpdatePeriodicRoomPayload): Promise<void> {
    await post<UpdatePeriodicRoomResult>("room/update/periodic", payload);
}

export interface UpdatePeriodicSubRoomPayload {
    periodicUUID: string;
    roomUUID: string;
    beginTime: number;
    endTime: number;
}

export type UpdatePeriodicSubRoomResult = {};

export async function updatePeriodicSubRoom(payload: UpdatePeriodicSubRoomPayload): Promise<void> {
    await post<UpdatePeriodicSubRoomResult>("room/update/periodic-sub-room", payload);
}
// 二开标识 使用本地token获取用户信息
export async function loginCheck(token?: string): Promise<LoginProcessResult> {
    return await post<LoginProcessResult>("RefreshToken", {
        apiModule: AUTH_DOMAIN,
        token,
    });
}

export interface setAuthUUIDPayload {
    authUUID: string;
}

export interface setAuthUUIDResult {
    authUUID: string;
}

export async function setAuthUUID(authUUID: string): Promise<setAuthUUIDResult> {
    return await postNotAuth<setAuthUUIDPayload, setAuthUUIDResult>("login/set-auth-uuid", {
        authUUID,
    });
}

export interface LoginProcessPayload {
    authUUID: string;
}

export interface LoginProcessResult {
    name?: string;
    sex?: Sex;
    avatar?: string;
    userUUID?: string;
    token?: string;
    // 新增属性
    id: string; // 用户id
    nickname: string; // 昵称
    zone: string; // 国际区号
    headphoto: string; // 头像
    roles: string; // 权限
    access_token: string; // 用户token
    token_type: string; // 请求接口header拼接字段
    chat_token: string; // 声网rtmToken
    chat_uid: string; // 声网用户id
    expires_in: number; // 有效期
}

export async function loginProcess(authUUID: string): Promise<LoginProcessResult> {
    return await postNotAuth<LoginProcessPayload, LoginProcessResult>("login/process", {
        authUUID,
    });
}
export type userSearchResult = {
    rows: any[];
    total: number;
};
export interface userSearchPayload {
    page: number;
    rows: number;
    keyword?: string;
}
// 二开标识 获取用户列表
export async function userSearch(payload: userSearchPayload): Promise<userSearchResult> {
    const data = await post<postRows>("Users/Search", {
        ...payload,
        apiModule: WEBAPI_DOMAIN,
    });
    return data;
}

// 二开标识 获取用户的订单
export async function userOrder(payload: string): Promise<userSearchResult> {
    const data = await get<postRows>(`Biz/Order/both/${payload}`, {
        apiModule: WEBAPI_DOMAIN,
    });
    return data;
}
// 二开标识 关注
export function followUser(payload: { master_uid: string }): Promise<CancelOrdinaryRoomResult> {
    return post<CancelOrdinaryRoomResult>("Profile/relation/Follow", {
        apiModule: AUTH_DOMAIN,
        ...payload,
    });
}

// 二开标识 购票
export function buyTicket(payload: {
    room_id: string;
    plat: string;
}): Promise<CancelOrdinaryRoomResult> {
    return post<CancelOrdinaryRoomResult>("Agora/room/buyTicket", {
        apiModule: RTMAPI_DOMAIN,
        ...payload,
    });
}
// 二开标识 获取我的余额
interface userResult {
    goldnum: number;
}
export function getUserSync(): Promise<userResult> {
    return get<userResult>("Profile/getUserSync", {
        apiModule: AUTH_DOMAIN,
    });
}
// 二开标识 获取创客订阅单价

export interface priceResult {
    price: number;
    skill_id: string;
    skill_name: string;
    skill_unit: string;
    user_id: number;
}
export function monthPrice(user_id: string): Promise<priceResult> {
    return get<priceResult>(`Profile/Subscribe/MonthPrice/${user_id}`, {
        apiModule: AUTH_DOMAIN,
    });
}
export interface subscriberPayload {
    buyer_id: string;
    seller_id: string;
    price: number;
    quantity: number;
    plat: string;
}
// 二开标识 订阅铁粉
export function subscriberSave(payload: subscriberPayload): Promise<priceResult> {
    return post<priceResult>("Biz/Subscriber/Save", {
        apiModule: WEBAPI_DOMAIN,
        ...payload,
    });
}
