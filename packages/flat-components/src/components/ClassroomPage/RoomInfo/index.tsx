/*
 * @Author: lmk
 * @Date: 2021-10-19 19:38:02
 * @LastEditTime: 2021-10-27 21:29:27
 * @LastEditors: lmk
 * @Description:
 */
import "./style.less";

import classNames from "classnames";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import { RoomStatus, RoomType } from "../../../types/room";
import { roomStatusToI18nKey } from "../../../utils/room";

export interface RoomInfoProps {
    roomStatus: RoomStatus;
    roomType?: RoomType;
}

export const RoomInfo: FC<RoomInfoProps> = ({ roomStatus, roomType }) => {
    const { t } = useTranslation();
    return (
        <div className="room-info">
            <span>
                {t("current-status")}
                <span
                    className={classNames("room-info-progress", {
                        "is-active": roomStatus !== RoomStatus.Idle,
                    })}
                >
                    {t(`room-status.${roomStatusToI18nKey(roomStatus)}`)}
                </span>
            </span>
            <span>
                {t("current-mode")}
                <span className="room-info-mode">
                    {t(`class-room-type.${roomType || RoomType.BigClass}`)}
                </span>
            </span>
        </div>
    );
};
