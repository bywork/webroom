/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-10-29 14:52:10
 * @LastEditors: lmk
 * @Description: 首页头部三个按钮
 */
import "./MainRoomMenu.less";

import React, { FC, useContext } from "react";
// import { Region } from "flat-components";
import { RoomStoreContext } from "../../../components/StoreProvider";
import { usePushHistory } from "../../../utils/routes";
import { CreateRoomBox } from "./CreateRoomBox";
import { CreateOneRoomBox } from "./CreateOneRoomBox";
import { JoinRoomBox } from "./JoinRoomBox";
// import { ScheduleRoomBox } from "./ScheduleRoomBox";
import { joinRoomHandler } from "../../utils/join-room-handler";
import { errorTips } from "../../../components/Tips/ErrorTips";
import { RTMAPI_DOMAIN } from "../../../constants/process";

export const MainRoomMenu: FC = () => {
    const roomStore = useContext(RoomStoreContext);
    const pushHistory = usePushHistory();

    return (
        <div className="main-room-menu-container">
            <JoinRoomBox onJoinRoom={roomUUID => joinRoomHandler(roomUUID, pushHistory)} />
            <CreateRoomBox onCreateRoom={createOrdinaryRoom} />
            <CreateOneRoomBox onCreateRoom={createOneRoom} />
            {/* <ScheduleRoomBox /> */}
        </div>
    );

    async function createOrdinaryRoom(payload: {
        room_name: string;
        room_type: string;
        begin_time: string;
        end_time: string;
        open_all: boolean;
        open_buyer: boolean;
        open_fans: boolean;
        open_subscriber: boolean;
        ticket_price: number;
    }): Promise<void> {
        try {
            // 二开标识 创建房间的api
            switch (payload.room_type) {
                case "BigClass": {
                    payload.room_type = "Big";
                    break;
                }
                case "SmallClass": {
                    payload.room_type = "Small";
                    break;
                }
            }
            const roomUUID = await roomStore.createOrdinaryRoom({
                ...payload,
                apiModule: RTMAPI_DOMAIN,
                // TODO docs:[]
            });
            await joinRoomHandler(roomUUID, pushHistory);
        } catch (e) {
            if (e instanceof Error) {
                errorTips(e);
            }
        }
    }
    async function createOneRoom(
        title: string,
        peer_id: string,
        plat: string,
        order_id?: string,
        order_total?: string,
    ): Promise<void> {
        try {
            // 二开标识 创建单人房间的api
            console.log({
                room_name: title,
                peer_id: peer_id,
                plat: plat,
                order_id: order_id,
                order_total: order_total,
                apiModule: RTMAPI_DOMAIN,
            });
            const roomUUID = await roomStore.createOneRoom({
                room_name: title,
                peer_id: peer_id,
                plat: plat,
                order_id: order_id,
                order_total: order_total,
                apiModule: RTMAPI_DOMAIN,
            });
            await joinRoomHandler(roomUUID, pushHistory);
        } catch (e) {
            if (e instanceof Error) {
                errorTips(e);
            }
        }
    }
};
export default MainRoomMenu;
