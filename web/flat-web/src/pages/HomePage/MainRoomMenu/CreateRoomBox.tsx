import createSVG from "../../../assets/image/creat.svg";
import "./CreateRoomBox.less";

import React, { useContext, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import {
    Button,
    Input,
    Modal,
    Checkbox,
    Form,
    DatePicker,
    Radio,
    Space,
    RadioChangeEvent,
} from "antd";
import { RoomType } from "../../../api-middleware/flatServer/constants";
import { ConfigStoreContext, GlobalStoreContext } from "../../../components/StoreProvider";
import { useSafePromise } from "../../../utils/hooks/lifecycle";
import { ClassPicker } from "flat-components";
import { useTranslation } from "react-i18next";
import { CheckboxValueType } from "antd/lib/checkbox/Group";

interface CreateRoomFormValues {
    liveTime: any;
    room_name: string;
    room_type: RoomType;
    begin_time?: Date;
    end_time?: Date;
    open_all: boolean;
    ticket_price?: number;
    autoCameraOn: boolean;
    checkbox: string[];
}

export interface CreateRoomBoxProps {
    onCreateRoom: (payload: {
        room_name: string;
        room_type: string;
        begin_time: string;
        end_time: string;
        open_all: boolean;
        open_buyer: boolean;
        open_fans: boolean;
        open_subscriber: boolean;
        ticket_price: number;
    }) => Promise<void>;
}

export const CreateRoomBox = observer<CreateRoomBoxProps>(function CreateRoomBox({ onCreateRoom }) {
    const { t } = useTranslation();
    const sp = useSafePromise();
    const globalStore = useContext(GlobalStoreContext);
    const configStore = useContext(ConfigStoreContext);
    const [form] = Form.useForm<CreateRoomFormValues>();
    const defaultFormat = "YYYY-MM-DD HH:mm";
    const [isLoading, setLoading] = useState(false);
    const [isShowModal, showModal] = useState(false);
    const [isFormValidated, setIsFormValidated] = useState(false);
    // const [roomRegion, setRoomRegion] = useState<Region>(configStore.getRegion());
    const [classType, setClassType] = useState<RoomType>(RoomType.BigClass);
    // 二开标识 创建房间的开始时间和结束时间
    const [liveTime] = useState();
    const [open_all, setopen_all] = useState(true);
    const roomTitleInputRef = useRef<Input>(null);
    const ticketInputRef = useRef<Input>(null);
    const [plainCheckbox, setPlainCheckbox] = useState([
        { label: "粉丝进入", value: "open_fans", disabled: false },
        { label: "铁粉进入", value: "open_subscriber", disabled: false },
        { label: "购票进入", value: "open_buyer", disabled: false },
    ]);
    const defaultValues: CreateRoomFormValues = {
        room_name: globalStore.userInfo?.name
            ? t("create-room-default-title", { name: globalStore.userInfo.name })
            : "",
        room_type: RoomType.BigClass,
        autoCameraOn: configStore.autoCameraOn,
        open_all: true,
        liveTime: [],
        checkbox: [],
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

    // const regionMenu = (
    //     <Menu
    //         className="create-room-modal-menu-item"
    //         style={{ width: "auto" }}
    //         onClick={e => setRoomRegion(e.key as Region)}
    //     >
    //         <div style={{ padding: "4px 12px 0 14px", color: "gray" }}>{t("servers")}</div>
    //         {regions.map(region => (
    //             <Menu.Item key={region}>
    //                 <img src={RegionSVG[region]} alt={region} style={{ width: 22 }} />
    //                 <span style={{ paddingLeft: 8 }}>{t(`region-${region}`)}</span>
    //             </Menu.Item>
    //         ))}
    //     </Menu>
    // );
    // 公开范围切换
    const openAllChange = (e: RadioChangeEvent): void => {
        setopen_all(e.target.value);
    };
    const [showTicket, setshowTicket] = useState(false);
    // 是否显示购票中
    const open_fansChange = (e: CheckboxValueType[]): void => {
        setshowTicket(e.includes("open_buyer"));
        if (e.includes("open_fans")) {
            const setCheckbox = plainCheckbox.map(val => {
                val.disabled = val.value !== "open_fans";
                return val;
            });
            setPlainCheckbox(setCheckbox);
            const filterCheckBox = e.filter(val => val !== "open_buyer");
            form.setFieldsValue({
                checkbox: filterCheckBox,
            });
            setshowTicket(false);
            return;
        }
        if (e.includes("open_subscriber")) {
            const setCheckbox = plainCheckbox.map(val => {
                val.disabled = val.value === "open_fans";
                return val;
            });
            setPlainCheckbox(setCheckbox);
            return;
        }
        const setCheckbox = plainCheckbox.map(val => {
            val.disabled = false;
            return val;
        });
        setPlainCheckbox(setCheckbox);
    };
    return (
        <>
            <Button
                onClick={() => {
                    setopen_all(true);
                    form.setFieldsValue(defaultValues);
                    showModal(true);
                    formValidateStatus();
                }}
            >
                <img src={createSVG} alt="create room" />
                <span className="label">{t("home-page-hero-button-type.create")}</span>
            </Button>
            <Modal
                wrapClassName="create-room-box-container"
                title={t("home-page-hero-button-type.create")}
                width={500}
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
                    {/* 开播时间 */}
                    <Form.Item
                        name="liveTime"
                        label={t("live-time")}
                        rules={[{ required: true, message: t("live-time-theme") }]}
                    >
                        <DatePicker.RangePicker
                            format={defaultFormat}
                            showTime={{ format: "HH:mm" }}
                            value={liveTime}
                        />
                    </Form.Item>
                    {/* 公开范围 */}
                    <Form.Item name="open_all" label={t("scope-of-disclosure")}>
                        <Radio.Group onChange={openAllChange} value={open_all}>
                            <Space direction="vertical">
                                <Radio value={true}>完全公开</Radio>
                                <Radio value={false}>限制范围</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                    {!open_all && (
                        <Form.Item
                            style={{ paddingLeft: "20px", marginTop: "10px" }}
                            name="checkbox"
                        >
                            <Checkbox.Group options={plainCheckbox} onChange={open_fansChange} />
                            {/* <Radio.Group onChange={open_fansChange} value={open_fans}>
                                <Radio value={0}>粉丝进入</Radio>
                                <Radio value={1}>铁粉进入</Radio>
                                <Radio value={2}>购票进入</Radio>
                            </Radio.Group> */}
                        </Form.Item>
                    )}
                    {showTicket && (
                        <Form.Item
                            style={{ paddingLeft: "20px" }}
                            name="ticket_price"
                            label={t("ticket-price")}
                            rules={[
                                {
                                    required: true,
                                    message: t("ticket-price-theme"),
                                },
                            ]}
                        >
                            <Input
                                type="number"
                                placeholder={t("ticket-price-theme")}
                                ref={ticketInputRef}
                            />
                        </Form.Item>
                    )}
                    <Form.Item name="room_type" label={t("type")} valuePropName="room_type">
                        <ClassPicker value={classType} onChange={e => setClassType(RoomType[e])} />
                    </Form.Item>
                    <Form.Item label={t("join-options")}>
                        <Form.Item name="autoCameraOn" noStyle valuePropName="checked">
                            <Checkbox>{t("turn-on-the-camera")}</Checkbox>
                        </Form.Item>
                    </Form.Item>
                </Form>
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
        // setLoading(true);

        try {
            const values = form.getFieldsValue();
            configStore.updateAutoCameraOn(values.autoCameraOn);
            const begin_time = values.liveTime[0].format(defaultFormat);
            const end_time = values.liveTime[1].format(defaultFormat);
            type UsersInfoResult = {
                [key: string]: boolean;
                open_fans: boolean;
                open_subscriber: boolean;
                open_buyer: boolean;
            };
            const obj = {} as UsersInfoResult;
            const sub = ["open_fans", "open_subscriber", "open_buyer"];
            sub.forEach(
                val => (obj[val] = values.checkbox ? values.checkbox.includes(val) : false),
            );
            await sp(
                onCreateRoom({
                    room_name: values.room_name,
                    room_type: values.room_type,
                    begin_time: begin_time,
                    end_time: end_time,
                    open_all: values.open_all,
                    ...obj,
                    ticket_price: values?.ticket_price || 0,
                }),
            );
            setLoading(false);
            handleCancel();
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    function handleCancel(): void {
        showModal(false);
    }

    function formValidateStatus(): void {
        setIsFormValidated(form.getFieldsError().every(field => field.errors.length <= 0));
    }
});

export default CreateRoomBox;
