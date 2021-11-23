/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-10-24 17:20:17
 * @LastEditors: lmk
 * @Description:多人间
 */
// import "../MainRoomListPanel/MainRoomList.less";

import React from "react";
import { observer } from "mobx-react-lite";
import { MainRoomList } from "../MainRoomListPanel/MainRoomList";
import { ListRoomsType } from "../../../api-middleware/flatServer";
import { RoomList } from "flat-components";
import { useTranslation } from "react-i18next";

export const MainRoomHistoryPanel = observer<{ isLogin: boolean }>(function MainRoomHistoryPanel({
    isLogin,
}) {
    const { t } = useTranslation();
    return (
        <RoomList title={t("other-room-list")}>
            <MainRoomList listRoomsType={ListRoomsType.History} isLogin={isLogin} />
        </RoomList>
    );
});

export default MainRoomHistoryPanel;
