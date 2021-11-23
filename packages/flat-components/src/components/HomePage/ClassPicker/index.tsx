/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-10-27 21:28:49
 * @LastEditors: lmk
 * @Description:
 */
import "./index.less";

import React from "react";
import { Radio } from "antd";
import classNames from "classnames";
import { ClassPickerItem, ClassPickerItemType } from "./ClassPickerItem";

export type { ClassPickerItemType } from "./ClassPickerItem";

export interface ClassPickerProps {
    value?: ClassPickerItemType;
    large?: boolean;
    disabled?: boolean;
    onChange?: (value: ClassPickerItemType) => void;
}
// 二开标识  创建房间
export const ClassPicker: React.FC<ClassPickerProps> = ({ value, onChange, large, disabled }) => {
    return (
        <Radio.Group
            disabled={disabled}
            className={classNames("class-picker-container", {
                "class-large-picker-container": large,
            })}
            value={value}
            onChange={e => onChange && e.target.value && onChange(e.target.value)}
        >
            <ClassPickerItem value="BigClass" large={large} />
            <ClassPickerItem value="SmallClass" large={large} />
            {/* <ClassPickerItem value="OneToOne" large={large} /> */}
        </Radio.Group>
    );
};
