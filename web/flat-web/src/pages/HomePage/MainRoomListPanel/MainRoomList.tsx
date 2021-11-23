import { Input, message, Modal } from "antd";
import React, {
    Fragment,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { observer, useLocalStore } from "mobx-react-lite";
import { isSameDay } from "date-fns";
import {
    InviteModal,
    RemoveHistoryRoomModal,
    RemoveRoomModal,
    RoomListAlreadyLoaded,
    RoomListDate,
    RoomListEmpty,
    RoomListItem,
    RoomListItemButton,
    RoomListSkeletons,
    RoomStatusType,
} from "flat-components";
// import { ListRoomsType } from "../../../api-middleware/flatServer";
import { RoomStatus, RoomType } from "../../../api-middleware/flatServer/constants";
import { GlobalStoreContext, RoomStoreContext } from "../../../components/StoreProvider";
import { errorTips } from "../../../components/Tips/ErrorTips";
import { RoomItem } from "../../../stores/room-store";
import { useSafePromise } from "../../../utils/hooks/lifecycle";
import { RouteNameType, usePushHistory } from "../../../utils/routes";
import { joinRoomHandler } from "../../utils/join-room-handler";
import { INVITE_BASEURL } from "../../../constants/process";
import { useTranslation } from "react-i18next";
import { subscriberPayload } from "src/api-middleware/flatServer";

export interface MainRoomListProps {
    // listRoomsType: ListRoomsType;
    isLogin: boolean;
    isOther: boolean;
}

export const MainRoomList = observer<MainRoomListProps>(function MainRoomList({
    // listRoomsType,
    isLogin,
    isOther,
}) {
    const { t } = useTranslation();
    const roomStore = useContext(RoomStoreContext);
    const [roomUUIDs, setRoomUUIDs] = useState<string[]>();
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [removeHistoryVisible, setRemoveHistoryVisible] = useState(false);
    const [removeHistoryLoading, setRemoveHistoryLoading] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<RoomItem | undefined>(undefined);
    const pushHistory = usePushHistory();
    const sp = useSafePromise();
    const globalStore = useContext(GlobalStoreContext);
    const isHistoryList = false;
    const openNotification = (
        description: string,
        confirmTxt: string,
        comfirm: () => void,
    ): void => {
        void Modal.confirm({
            onOk: () => {
                comfirm();
            },
            okText: confirmTxt,
            title: "温馨提示",
            content: <div dangerouslySetInnerHTML={{ __html: description }}></div>,
            icon: "",
        });
    };
    const subscriberValue = useLocalStore(() => ({ goldnum: 0, subscriberPrice: 0 }));
    // const [goldnum, setgoldnum] = useState<number>(0); // 余额
    const subscriberRef = useRef<Input>(null); // 月份数量
    // const [subscriberPrice, setsubscriberPrice] = useState<number>(0); // 订阅单价
    // 获取余额
    const getUserSync = async (): Promise<void> => {
        const res = await roomStore.getUserSync();
        subscriberValue.goldnum = res;
        // setgoldnum(res);
    };
    // 获取订阅的主播单月多少单价
    const monthPrice = async (ownerUUID: string): Promise<void> => {
        const { price } = await roomStore.monthPrice(ownerUUID);
        subscriberValue.subscriberPrice = price;
        // setsubscriberPrice(price);
    };
    // 订阅铁粉弹框
    const subscriberContent = (): ReactNode => {
        return (
            <div>
                <p>每月单价：{subscriberValue.subscriberPrice}</p>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1em" }}>
                    订阅多少个月：
                    <Input
                        ref={subscriberRef}
                        style={{ width: "240px" }}
                        placeholder="1-24"
                        type="number"
                    />
                </div>
                <p>余额：{subscriberValue.goldnum}</p>
            </div>
        );
    };
    const subscriberDialog = async (
        subscriber: (payload: subscriberPayload) => Promise<void>,
        ownerUUID: string,
    ): Promise<void> => {
        await getUserSync();
        await monthPrice(ownerUUID);
        void Modal.confirm({
            onOk: () => {
                const current = subscriberRef.current;
                if (current?.state.value <= 0) {
                    void message.error("月份数量不能小于1");
                    return Promise.reject();
                }
                const totalPrice = subscriberValue.subscriberPrice * current?.state.value;
                if (current?.state.value > 0 && totalPrice > subscriberValue.goldnum) {
                    void message.error("余额不足，请充值");
                    return Promise.reject();
                }
                const userid = globalStore?.userUUID as string;
                return subscriber({
                    buyer_id: userid,
                    seller_id: ownerUUID,
                    price: subscriberValue.subscriberPrice,
                    quantity: current?.state.value,
                    plat: "web",
                });
            },
            title: "成为主创铁粉",
            content: subscriberContent(),
            icon: "",
        });
    };
    // 铁粉内容弹框
    const refreshRooms = useCallback(
        async function refreshRooms(): Promise<void> {
            try {
                const roomUUIDs = await sp(roomStore.listRooms({ page: 1, isOther: isOther }));
                setRoomUUIDs(roomUUIDs);
            } catch (e) {
                const a = e as Error;
                setRoomUUIDs([]);
                errorTips(a);
            }
        },
        [isOther, roomStore, sp],
    );

    useEffect(() => {
        if (!isLogin) {
            return;
        }

        void refreshRooms();

        const ticket = window.setInterval(refreshRooms, 30 * 1000);

        return () => {
            window.clearInterval(ticket);
        };
    }, [refreshRooms, isLogin]);

    if (!roomUUIDs) {
        return <RoomListSkeletons />;
    }

    if (roomUUIDs.length <= 0) {
        return <RoomListEmpty isHistory={isHistoryList} />;
    }

    const periodicInfo = currentRoom?.periodicUUID
        ? roomStore.periodicRooms.get(currentRoom?.periodicUUID)
        : undefined;

    return (
        <>
            {customSort(roomUUIDs.map(roomUUID => roomStore.rooms.get(roomUUID))).map(
                (room, index, rooms) => {
                    if (!room) {
                        return null;
                    }

                    const lastRoom = index > 0 ? rooms[index - 1] : void 0;
                    // const nextRoom = index < rooms.length - 1 ? rooms[index + 1] : void 0;

                    // show date title when two adjacent rooms are not the same day
                    const shouldShowDate = !(
                        room.beginTime &&
                        lastRoom?.beginTime &&
                        isSameDay(room.beginTime, lastRoom.beginTime)
                    );

                    // show divider when two adjacent rooms are not the same day
                    // const shouldShowDivider = !(
                    //     room.beginTime &&
                    //     nextRoom?.beginTime &&
                    //     isSameDay(room.beginTime, nextRoom.beginTime)
                    // );

                    const beginTime = room.beginTime ? new Date(room.beginTime) : void 0;
                    const endTime = room.endTime ? new Date(room.endTime) : void 0;

                    const primaryAction: RoomListItemButton<"replay" | "join"> = isHistoryList
                        ? { key: "replay", text: t("replay"), disabled: !room.hasRecord }
                        : { key: "join", text: t("join") };
                    const btns = [getSubActions(room), primaryAction];
                    return (
                        <Fragment key={room.roomUUID}>
                            {shouldShowDate && beginTime && <RoomListDate date={beginTime} />}
                            <RoomListItem
                                title={room.title!}
                                beginTime={beginTime}
                                endTime={endTime}
                                status={getRoomStatus(room.roomStatus)}
                                isPeriodic={!!room.periodicUUID}
                                buttons={btns}
                                onClickMenu={key => {
                                    switch (key) {
                                        case "details": {
                                            pushHistory(RouteNameType.RoomDetailPage, {
                                                roomUUID: room.roomUUID,
                                                periodicUUID: room.periodicUUID,
                                            });
                                            break;
                                        }
                                        case "modify": {
                                            pushHistory(RouteNameType.ModifyOrdinaryRoomPage, {
                                                roomUUID: room.roomUUID,
                                                periodicUUID: room.periodicUUID,
                                            });
                                            break;
                                        }
                                        case "cancel": {
                                            setCurrentRoom(room);
                                            setCancelModalVisible(true);
                                            break;
                                        }
                                        case "invite": {
                                            setCurrentRoom(room);
                                            setInviteModalVisible(true);
                                            break;
                                        }
                                        case "delete-history": {
                                            setCurrentRoom(room);
                                            setRemoveHistoryVisible(true);
                                            break;
                                        }
                                        case "replay": {
                                            replayRoom({
                                                ownerUUID: room.ownerUUID,
                                                roomUUID: room.roomUUID,
                                                roomType: room.roomType || RoomType.OneToOne,
                                            });
                                            break;
                                        }
                                        case "join": {
                                            void joinRoomHandler(
                                                room.roomUUID,
                                                pushHistory,
                                                openNotification,
                                                isOther,
                                                subscriberDialog,
                                            );
                                            break;
                                        }
                                        default:
                                    }
                                }}
                                open_all={room.open_all}
                                open_buyer={room.open_buyer}
                                open_fans={room.open_fans}
                                ticket_price={room.ticket_price}
                            />
                        </Fragment>
                    );
                },
            )}
            <RoomListAlreadyLoaded />
            {currentRoom && (
                <RemoveRoomModal
                    cancelModalVisible={cancelModalVisible}
                    onCancel={hideCancelModal}
                    isCreator={currentRoom.ownerUUID === globalStore.userUUID}
                    onCancelRoom={removeRoomHandler}
                    roomUUID={currentRoom.roomUUID}
                    periodicUUID={currentRoom.periodicUUID}
                    isPeriodicDetailsPage={false}
                />
            )}
            {currentRoom && (
                <InviteModal
                    baseUrl={INVITE_BASEURL}
                    visible={inviteModalVisible}
                    room={currentRoom}
                    userName={globalStore.userName ?? ""}
                    periodicWeeks={periodicInfo?.periodic.weeks}
                    onCopy={onCopy}
                    onCancel={hideInviteModal}
                />
            )}
            {/* TODO: add removeHistoryLoading to flat-component */}
            {currentRoom && (
                <RemoveHistoryRoomModal
                    visible={removeHistoryVisible}
                    onConfirm={removeConfirm}
                    onCancel={hideRemoveHistoryModal}
                    loading={removeHistoryLoading}
                />
            )}
        </>
    );

    function replayRoom(config: { roomUUID: string; ownerUUID: string; roomType: RoomType }): void {
        const { roomUUID, ownerUUID, roomType } = config;
        window.open(`${INVITE_BASEURL}/replay/${roomType}/${roomUUID}/${ownerUUID}/`, "_blank");
    }

    function hideCancelModal(): void {
        setCancelModalVisible(false);
    }

    function hideInviteModal(): void {
        setInviteModalVisible(false);
    }

    function hideRemoveHistoryModal(): void {
        setRemoveHistoryVisible(false);
    }

    async function onCopy(text: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            void message.success(t("copy-success"));
        } catch {
            void message.error(t("copy-fail"));
        } finally {
            hideInviteModal();
        }
    }

    async function removeRoomHandler(isCancelAll: boolean): Promise<void> {
        const { ownerUUID, roomUUID, periodicUUID } = currentRoom!;
        const isCreator = ownerUUID === globalStore.userUUID;
        try {
            if (!isCreator && periodicUUID) {
                await roomStore.cancelRoom({
                    all: true,
                    periodicUUID,
                });
            } else {
                await roomStore.cancelRoom({
                    all: isCancelAll || (!roomUUID && !!periodicUUID),
                    roomUUID,
                    periodicUUID,
                });
            }
            setCancelModalVisible(false);
            void refreshRooms();
            const content = isCreator
                ? t("the-room-has-been-cancelled")
                : t("the-room-has-been-removed");
            void message.success(content);
        } catch (e) {
            console.error(e);
            const a = e as Error;
            errorTips(a);
        }
    }

    async function removeConfirm(): Promise<void> {
        setRemoveHistoryLoading(true);
        try {
            await sp(
                roomStore.cancelRoom({
                    isHistory: true,
                    roomUUID: currentRoom!.roomUUID,
                }),
            );
            hideRemoveHistoryModal();
            void refreshRooms();
        } catch (e) {
            console.error(e);
            const a = e as Error;
            errorTips(a);
        } finally {
            setRemoveHistoryLoading(false);
        }
    }

    type SubActions =
        | Array<{ key: "details" | "delete-history"; text: string }>
        | Array<{ key: "details" | "modify" | "cancel" | "invite"; text: string }>;

    function getSubActions(room: RoomItem): SubActions {
        const result = [{ key: "details", text: t("room-detail") }];
        if (isHistoryList) {
            if (room.roomUUID) {
                result.push({ key: "delete-history", text: t("delete-records") });
            }
        } else {
            const ownerUUID = room.ownerUUID;
            const isCreator = ownerUUID === globalStore.userUUID;
            if (
                (room.roomUUID || room.periodicUUID) &&
                isCreator &&
                room.roomStatus === RoomStatus.Idle
            ) {
                result.push({ key: "modify", text: t("modify-room") });
            }
            if (!isCreator || room.roomStatus === RoomStatus.Idle) {
                result.push({
                    key: "cancel",
                    text: isCreator ? t("cancel-room") : t("remove-room"),
                });
            }
            if (room.roomUUID) {
                result.push({ key: "invite", text: t("copy-invitation") });
            }
        }
        return result as SubActions;
    }

    function customSort(rooms: Array<RoomItem | undefined>): Array<RoomItem | undefined> {
        if (isHistoryList) {
            return rooms.sort((a, b) => (a && b ? Number(b.beginTime) - Number(a.beginTime) : 0));
        } else {
            return rooms;
        }
    }

    function getRoomStatus(roomStatus?: RoomStatus): RoomStatusType {
        switch (roomStatus) {
            case RoomStatus.Idle: {
                return "upcoming";
            }
            case RoomStatus.Started:
            case RoomStatus.Paused: {
                return "running";
            }
            case RoomStatus.Stopped: {
                return "stopped";
            }
            default: {
                return "upcoming";
            }
        }
    }
});
