/* eslint-disable no-redeclare */
import { makeAutoObservable, observable, runInAction } from "mobx";
import { Region } from "flat-components";
import {
    buyTicket,
    cancelRoom,
    CancelRoomPayload,
    createOneRoom,
    createOrdinaryRoom,
    CreateOrdinaryRoomPayload,
    createPeriodicRoom,
    CreatePeriodicRoomPayload,
    followUser,
    getUserSync,
    joinRoom,
    JoinRoomResult,
    listOtherRooms,
    listRooms,
    ListRoomsPayload,
    monthPrice,
    ordinaryRoomInfo,
    periodicRoomInfo,
    PeriodicRoomInfoResult,
    periodicSubRoomInfo,
    PeriodicSubRoomInfoPayload,
    priceResult,
    recordInfo,
    subscriberPayload,
    subscriberSave,
    userOrder,
    userSearch,
    userSearchPayload,
} from "../api-middleware/flatServer";
import { DocsType, RoomDoc, RoomStatus, RoomType } from "../api-middleware/flatServer/constants";
import { globalStore } from "./GlobalStore";
import { configStore } from "./config-store";

// Sometime we may only have pieces of the room info
/** Ordinary room + periodic sub-room */
export interface RoomItem {
    open_buyer: boolean;
    open_fans: boolean;
    ticket_price: number;
    open_all: boolean;
    /** 普通房间或周期性房间子房间的 uuid */
    roomUUID: string;
    /** 房间所有者的 uuid */
    ownerUUID: string;
    /** invite code of room */
    inviteCode?: string;
    /** 房间类型 */
    roomType?: RoomType;
    /** 子房间隶属的周期性房间 uuid */
    periodicUUID?: string;
    /** 房间所有者的名称 */
    ownerUserName?: string;
    /** 房间标题 */
    title?: string;
    /** 房间状态 */
    roomStatus?: RoomStatus;
    /** 区域 */
    region?: Region;
    /** 房间开始时间 */
    beginTime?: number;
    /** 结束时间 */
    endTime?: number;
    /** 上一节课的开始时间 */
    previousPeriodicRoomBeginTime?: number;
    /** 下一节课的结束时间 */
    nextPeriodicRoomEndTime?: number;
    /** 当前周期性房间下一共有多少节课 */
    count?: number;
    /** 课件 */
    docs?: RoomDoc[];
    /** 是否存在录制(只有历史记录才会有) */
    hasRecord?: boolean;
    /** 录制记录 */
    recordings?: Array<{
        beginTime: number;
        endTime: number;
        videoURL?: string;
    }>;
}

// Only keep sub-room ids. sub-room info are stored in ordinaryRooms.
export interface PeriodicRoomItem {
    periodicUUID: string;
    periodic: PeriodicRoomInfoResult["periodic"];
    rooms: string[];
    inviteCode: string;
}

interface userSearchResult {
    rows: any[];
    total: number;
}
export interface CreateOneRoomPayload {
    room_name: string;
    peer_id: string;
    plat: string;
    order_id?: string;
    order_total?: string;
    /** 课件 */
    docs?: Array<{
        /** 文档类型 */
        type: DocsType;
        /** 文档的 uuid */
        uuid: string;
    }>;
    apiModule?: string;
}
/**
 * Caches all the visited rooms.
 * This should be the only central store for all the room info.
 */
export class RoomStore {
    public rooms = observable.map<string, RoomItem>();
    public periodicRooms = observable.map<string, PeriodicRoomItem>();

    public constructor() {
        makeAutoObservable(this);
    }

    /**
     * @returns roomUUID
     */
    public async createOrdinaryRoom(payload: CreateOrdinaryRoomPayload): Promise<string> {
        if (!globalStore.userUUID) {
            throw new Error("cannot create room: user not login.");
        }

        const roomUUID = await createOrdinaryRoom(payload);
        // configStore.setRegion(payload.region);
        const { docs, ...restPayload } = payload;
        this.updateRoom(roomUUID, globalStore.userUUID, {
            ...restPayload,
            docs:
                docs &&
                docs.map(doc => ({ docType: doc.type, docUUID: doc.uuid, isPreload: false })),
            roomUUID,
        });
        return roomUUID;
    }
    // 二开标识 创建一对一房间
    public async createOneRoom(payload: CreateOneRoomPayload): Promise<string> {
        if (!globalStore.userUUID) {
            throw new Error("cannot create room: user not login.");
        }
        const roomUUID = await createOneRoom(payload);
        // configStore.setRegion(payload.region);
        const { docs, ...restPayload } = payload;
        this.updateRoom(roomUUID, globalStore.userUUID, {
            ...restPayload,
            docs:
                docs &&
                docs.map(doc => ({ docType: doc.type, docUUID: doc.uuid, isPreload: false })),
            roomUUID,
        });
        return roomUUID;
    }
    /**
     * @returns 获取用户账号列表
     */
    public async getUserList(payload: userSearchPayload): Promise<userSearchResult> {
        return await userSearch(payload);
    }
    /**
     * @returns 获取选择的用户的订单列表
     */
    public async getUserOrder(payload: string): Promise<userSearchResult> {
        return await userOrder(payload);
    }
    public async createPeriodicRoom(payload: CreatePeriodicRoomPayload): Promise<void> {
        await createPeriodicRoom(payload);
        configStore.setRegion(payload.region);
        // need roomUUID and periodicUUID from server to cache the payload
    }

    /**
     * @returns 二开标识 加入房间
     */
    public async joinRoom(roomUUID: string): Promise<JoinRoomResult> {
        const data = await joinRoom(roomUUID);
        globalStore.updateToken(data);
        this.updateRoom(roomUUID, data.ownerUUID, {
            roomUUID,
            ownerUUID: data.ownerUUID,
            roomType: data.roomType,
        });
        return data;
    }

    /**
     * @returns 二开标识  获取用户创建的房间列表
     */
    public async listRooms(payload: ListRoomsPayload): Promise<string[]> {
        const rooms = !payload.isOther ? await listRooms(payload) : await listOtherRooms(payload);
        const roomUUIDs: string[] = [];
        runInAction(() => {
            for (const room of rooms) {
                room.roomUUID = room.room_id;
                room.ownerUUID = room.owner_id;
                room.beginTime = new Date(room.begin_time).getTime();
                room.endTime = new Date(room.end_time).getTime();
                room.hasRecord = room.hasrecord;
                room.ownerUserName = room.owner_name;
                room.title = room.room_name;
                room.roomStatus = [
                    RoomStatus.Idle,
                    RoomStatus.Started,
                    RoomStatus.Paused,
                    RoomStatus.Stopped,
                ][room.room_status];
                switch (room.room_type) {
                    case "Big": {
                        room.roomType = RoomType.BigClass;
                        break;
                    }
                    case "Small": {
                        room.roomType = RoomType.SmallClass;
                        break;
                    }
                    case "OneToOne": {
                        room.roomType = RoomType.OneToOne;
                        break;
                    }
                    default: {
                        room.roomType = room.room_type as RoomType;
                        break;
                    }
                }
                roomUUIDs.push(room.roomUUID);
                this.updateRoom(room.roomUUID, room.ownerUUID, {
                    ...room,
                    periodicUUID: room.periodicUUID || void 0,
                });
            }
        });
        return roomUUIDs;
    }

    public async cancelRoom(payload: CancelRoomPayload): Promise<void> {
        await cancelRoom(payload);
    }

    public async syncOrdinaryRoomInfo(roomUUID: string): Promise<void> {
        const { roomInfo, ...restInfo } = await ordinaryRoomInfo(roomUUID);
        roomInfo.ownerUUID = roomInfo.owner_id;
        roomInfo.title = roomInfo.room_name;
        roomInfo.beginTime = new Date(roomInfo.begin_time).getTime();
        roomInfo.endTime = new Date(roomInfo.begin_time).getTime();
        // roomInfo.roomType = roomInfo.room_type;
        roomInfo.ownerUserName = roomInfo.owner_name;
        this.updateRoom(roomUUID, roomInfo.owner_id, {
            ...restInfo,
            ...roomInfo,
            roomUUID,
        });
    }

    public async syncPeriodicRoomInfo(periodicUUID: string): Promise<void> {
        this.updatePeriodicRoom(periodicUUID, await periodicRoomInfo(periodicUUID));
    }

    public async syncPeriodicSubRoomInfo(payload: PeriodicSubRoomInfoPayload): Promise<void> {
        const { roomInfo, previousPeriodicRoomBeginTime, nextPeriodicRoomEndTime, ...restInfo } =
            await periodicSubRoomInfo(payload);
        this.updateRoom(payload.roomUUID, roomInfo.ownerUUID, {
            ...restInfo,
            ...roomInfo,
            previousPeriodicRoomBeginTime: previousPeriodicRoomBeginTime ?? void 0,
            nextPeriodicRoomEndTime: nextPeriodicRoomEndTime ?? void 0,
            roomUUID: payload.roomUUID,
            periodicUUID: payload.periodicUUID,
        });
    }

    public async syncRecordInfo(roomUUID: string): Promise<void> {
        const roomInfo = await recordInfo(roomUUID);
        const {
            ownerUUID,
            title,
            roomType,
            recordInfo: recordings,
            whiteboardRoomToken,
            whiteboardRoomUUID,
            region,
            rtmToken,
        } = roomInfo;
        this.updateRoom(roomUUID, ownerUUID, {
            title,
            roomType,
            recordings,
            roomUUID,
            region,
        });
        globalStore.updateToken({
            whiteboardRoomToken,
            whiteboardRoomUUID,
            rtmToken,
            region,
        });
    }

    public updateRoom(roomUUID: string, ownerUUID: string, roomInfo: Partial<RoomItem>): void {
        const room = this.rooms.get(roomUUID);
        if (room) {
            const keys = Object.keys(roomInfo) as unknown as Array<keyof RoomItem>;
            for (const key of keys) {
                if (key !== "roomUUID") {
                    (room[key] as any) = roomInfo[key];
                }
            }
        } else {
            this.rooms.set(roomUUID, { ...roomInfo, roomUUID, ownerUUID });
        }
    }

    public updatePeriodicRoom(periodicUUID: string, roomInfo: PeriodicRoomInfoResult): void {
        roomInfo.rooms.forEach(room => {
            this.updateRoom(room.roomUUID, roomInfo.periodic.ownerUUID, {
                ...room,
                inviteCode: roomInfo.periodic.inviteCode,
                title: roomInfo.periodic.title,
                roomType: roomInfo.periodic.roomType,
                periodicUUID: periodicUUID,
            });
        });
        this.periodicRooms.set(periodicUUID, {
            periodicUUID,
            periodic: roomInfo.periodic,
            rooms: roomInfo.rooms.map(room => room.roomUUID),
            inviteCode: roomInfo.periodic.inviteCode,
        });
    }
    // 关注
    public async followUser(master_uid: string): Promise<void> {
        await followUser({ master_uid });
    }
    // 购票
    public async buyTicket(room_id: string): Promise<void> {
        await buyTicket({ room_id, plat: "web" });
    }
    // 我的余额
    public async getUserSync(): Promise<number> {
        const { goldnum } = await getUserSync();
        return goldnum;
    }
    // 主播订阅价格
    public async monthPrice(user_id: string): Promise<priceResult> {
        const data = await monthPrice(user_id);
        return data;
    }
    // 订阅
    public async subscriberSave(payload: subscriberPayload): Promise<priceResult> {
        const data = await subscriberSave(payload);
        return data;
    }
}

export const roomStore = new RoomStore();
