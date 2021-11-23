import createSVG from "../../../assets/image/creat.svg";
import "./CreateRoomBox.less";

import React, { useContext, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Button,
    Input,
    Modal,
    Form,
    Select,
    Radio,
    Space,
    RadioChangeEvent,
    Avatar,
    Pagination,
    Empty,
} from "antd";
import { ConfigStoreContext, GlobalStoreContext } from "../../../components/StoreProvider";
import { useSafePromise } from "../../../utils/hooks/lifecycle";
import { useTranslation } from "react-i18next";
import { RightCircleOutlined } from "@ant-design/icons";
import { roomStore } from "../../../stores/room-store";
import { errorTips } from "../../../components/Tips/ErrorTips";

interface CreateRoomFormValues {
    room_name: string;
    order_id?: string;
    order_total?: string;
    autoCameraOn: boolean;
    notOrder: boolean;
}

export interface CreateRoomBoxProps {
    onCreateRoom: (
        title: string,
        peer_id: string,
        plat: string,
        order_id?: string,
        order_total?: string,
    ) => Promise<void>;
}
interface orderItem {
    id: string;
    item_name: string;
}
export const CreateOneRoomBox = observer<CreateRoomBoxProps>(function CreateRoomBox({
    onCreateRoom,
}) {
    const { t } = useTranslation();
    const sp = useSafePromise();
    const globalStore = useContext(GlobalStoreContext);
    const configStore = useContext(ConfigStoreContext);
    const [form] = Form.useForm<CreateRoomFormValues>();
    const [isLoading, setLoading] = useState(false);
    const [isShowModal, showModal] = useState(false);
    const [isFormValidated, setIsFormValidated] = useState(false);
    const roomTitleInputRef = useRef<Input>(null);
    const roomPriceInputRef = useRef<Input>(null);
    const [notOrder, setnotOrder] = useState(false);
    const [showUserModal, setshowUserModal] = useState(false);
    const [userList, setuserList] = useState<any[]>([]);
    const [page, setpage] = useState(1);
    const [total, settotal] = useState(0);
    const [orderList, setorderList] = useState<orderItem[]>([]);
    const [selectUserObj, setselectUserObj] = useState<{
        [key: string]: string;
    }>({});
    const defaultValues: CreateRoomFormValues = {
        room_name: globalStore.userInfo?.name
            ? t("create-room-default-title", { name: globalStore.userInfo.name })
            : "",
        order_total: "",
        notOrder: true,
        autoCameraOn: configStore.autoCameraOn,
    };

    useEffect(() => {
        let ticket = NaN;
        if (isShowModal) {
            // wait a cycle till antd modal updated
            ticket = window.setTimeout(() => {
                if (roomTitleInputRef.current) {
                    roomTitleInputRef.current.focus();
                    roomTitleInputRef.current.select();
                }
            }, 0);
        }
        return () => {
            window.clearTimeout(ticket);
        };
    }, [isShowModal]);
    const orderChange = (e: RadioChangeEvent): void => {
        setnotOrder(e.target.value);
    };
    const getList = (page: number, keyword?: string): void => {
        void roomStore.getUserList({ page, rows: 5, keyword: keyword }).then(res => {
            setuserList(res.rows);
            settotal(res.total);
        });
    };
    useEffect(() => {
        if (!globalStore.userInfo?.token) {
            return;
        }
        getList(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => {
            // setpage(1);
        };
    }, [globalStore.userInfo?.token, page]);
    const showUser = (): void => {
        setshowUserModal(!showUserModal);
    };
    const onSearch = (e: string): void => {
        getList(page, e);
    };
    const selectUser = (val: any): void => {
        setselectUserObj(val);
        showUser();
    };
    useEffect(() => {
        if (!selectUserObj.id) {
            return;
        }
        void roomStore.getUserOrder(selectUserObj.id).then(({ rows }) => {
            setorderList(rows);
        });
        return () => {
            setselectUserObj({});
        };
    }, [selectUserObj.id]);
    return (
        <>
            <Button
                onClick={() => {
                    form.setFieldsValue(defaultValues);
                    showModal(true);
                    formValidateStatus();
                }}
            >
                <img src={createSVG} alt="create room" />
                <span className="label">{t("home-page-hero-button-type.createOnebyOne")}</span>
            </Button>
            <Modal
                wrapClassName="create-room-box-container"
                title={t("home-page-hero-button-type.createOnebyOne")}
                width={350}
                visible={isShowModal}
                destroyOnClose
                onOk={handleOk}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        {t("cancel")}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={isLoading}
                        onClick={handleOk}
                        disabled={!isFormValidated}
                    >
                        {t("create")}
                    </Button>,
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    name="createRoom"
                    className="main-room-menu-form"
                    initialValues={defaultValues}
                    onFieldsChange={formValidateStatus}
                >
                    <Form.Item
                        name="room_name"
                        label={t("theme")}
                        rules={[
                            { required: true, message: t("enter-room-theme") },
                            { max: 50, message: t("theme-can-be-up-to-50-characters") },
                        ]}
                    >
                        <Input placeholder={t("enter-room-theme")} ref={roomTitleInputRef} />
                    </Form.Item>
                    <Form.Item name="peer_id" label={t("select-person")}>
                        <div className="flex">
                            <div className="peer-select">
                                {selectUserObj.id && (
                                    <span>
                                        {selectUserObj.nickname}({selectUserObj.id})
                                    </span>
                                )}
                            </div>
                            <RightCircleOutlined
                                style={{ fontSize: "20px", color: "#348FFC", cursor: "pointer" }}
                                onClick={showUser}
                            />
                        </div>
                    </Form.Item>
                    <Form.Item label={t("is-order")}>
                        <Radio.Group onChange={orderChange} value={notOrder}>
                            <Space direction="vertical">
                                <Radio value={true}>有创建的订单</Radio>
                                <Radio value={false}>无订单</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                    {notOrder && (
                        <Form.Item
                            name="order_id"
                            label={t("select-order")}
                            rules={[{ required: true, message: t("select-order") }]}
                        >
                            <Select placeholder={t("select-order")}>
                                {orderList.map(val => (
                                    <Select.Option key={val.id} value={val.id}>
                                        {val.item_name} {val.id}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                    {!notOrder && (
                        <Form.Item
                            name="order_total"
                            label={t("order-price")}
                            rules={[{ required: true, message: t("enter-room-price") }]}
                        >
                            <Input
                                placeholder={t("order-price")}
                                type="number"
                                ref={roomPriceInputRef}
                            />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
            <Modal
                title={t("select-person")}
                visible={showUserModal}
                width={400}
                zIndex={1200}
                footer={null}
                onCancel={handleUserCancel}
            >
                <Input.Search
                    placeholder={t("please-enter")}
                    enterButton={t("search")}
                    onSearch={onSearch}
                />
                <div style={{ marginTop: "10px" }}>
                    {userList.length ? (
                        <div>
                            {userList.map((val, index) => (
                                <div key={index} className="userList-item">
                                    <div className="userlist-left">
                                        <Avatar size={50} src={val.headphoto}></Avatar>
                                        <span className="nickname">
                                            {val.nickname}({val.id})
                                        </span>
                                    </div>
                                    <Button onClick={() => selectUser(val)}>{t("select")}</Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty></Empty>
                    )}
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                    <Pagination
                        current={page}
                        onChange={page => setpage(page)}
                        total={total}
                        simple
                        showSizeChanger={false}
                    ></Pagination>
                </div>
            </Modal>
        </>
    );

    async function handleOk(): Promise<void> {
        console.log(form.validateFields());
        try {
            await sp(form.validateFields());
        } catch (e) {
            // errors are displayed on the form
            console.log(e, "e");
            return;
        }
        setLoading(true);

        try {
            const values = form.getFieldsValue();
            configStore.updateAutoCameraOn(values.autoCameraOn);
            console.log(values, selectUserObj.id);
            if (!selectUserObj.id) {
                setLoading(false);
                errorTips(new Error("请选择用户"));
                return Promise.reject();
            }
            // const begin_time = values.liveTime[0].format(defaultFormat);
            // const end_time = values.liveTime[1].format(defaultFormat);
            // const open = ["open_fans", "open_subscriber", "open_buyer"][values.open_fans || 0];
            await sp(
                onCreateRoom(
                    values.room_name,
                    selectUserObj.id,
                    "web",
                    values.order_id,
                    values.order_total,
                ),
            );
            setLoading(false);
            handleCancel();
        } catch (e) {
            console.error(e);
            const a = e as Error;
            errorTips(a);
            setLoading(false);
        }
    }
    function handleCancel(): void {
        showModal(false);
    }

    function handleUserCancel(): void {
        setshowUserModal(false);
    }

    function formValidateStatus(): void {
        setIsFormValidated(form.getFieldsError().every(field => field.errors.length <= 0));
    }
});

export default CreateOneRoomBox;
