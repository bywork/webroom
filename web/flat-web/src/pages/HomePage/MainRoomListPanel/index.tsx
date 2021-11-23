/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-11-01 10:31:09
 * @LastEditors: lmk
 * @Description:二开标识 我的房间
 */
import "./style.less";

import React from "react";
import { observer } from "mobx-react-lite";
import { RoomList } from "flat-components";
import { MainRoomList } from "./MainRoomList";
// import { ListRoomsType } from "../../../api-middleware/flatServer";
import { useTranslation } from "react-i18next";

export const MainRoomListPanel = observer<{ isLogin: boolean; isOther: boolean }>(
    function MainRoomListPanel({ isLogin, isOther }) {
        const { t } = useTranslation();
        // const [activeTab, setActiveTab] = useState<"all" | "today" | "periodic">("all");
        // const filters = useMemo<Array<{ key: "all" | "today" | "periodic"; title: string }>>(
        //     () => [
        //         {
        //             key: "all",
        //             title: t("all"),
        //         },
        //         {
        //             key: "today",
        //             title: t("today"),
        //         },
        //         {
        //             key: "periodic",
        //             title: t("periodic"),
        //         },
        //     ],
        //     [t],
        // );

        return (
            <RoomList title={t(!isOther ? "my-room" : "other-room-list")}>
                <MainRoomList isLogin={isLogin} isOther={isOther} />
            </RoomList>
        );
    },
);

export default MainRoomListPanel;
