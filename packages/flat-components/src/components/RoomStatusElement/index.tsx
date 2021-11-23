/*
 * @Author: lmk
 * @Date: 2021-10-19 19:38:02
 * @LastEditTime: 2021-10-27 21:21:47
 * @LastEditors: lmk
 * @Description:
 */
import "./index.less";

import React from "react";
import { RoomInfo, RoomStatus } from "../../types/room";
import { useTranslation } from "react-i18next";

export interface RoomStatusElementProps {
    room: RoomInfo;
}

export const RoomStatusElement: React.FC<RoomStatusElementProps> = ({ room }) => {
    const { t } = useTranslation();
    console.log(room.roomStatus);
    switch (room.roomStatus) {
        case RoomStatus.Started:
        case RoomStatus.Paused: {
            return <span className="room-status-started">{t("room-status.running")}</span>;
        }
        case RoomStatus.Stopped: {
            return <span className="room-status-stopped">{t("room-status.stopped")}</span>;
        }
        default: {
            return <span className="room-status-idle">{t("room-status.upcoming")}</span>;
        }
    }
};
