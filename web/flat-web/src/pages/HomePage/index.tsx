/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-11-01 10:26:41
 * @LastEditors: lmk
 * @Description:二开标识 主页
 */
import "./style.less";

import React, { useContext, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { MainRoomMenu } from "./MainRoomMenu";
import { MainRoomListPanel } from "./MainRoomListPanel";
import { GlobalStoreContext, PageStoreContext } from "../../components/StoreProvider";
import { loginCheck, LoginProcessResult } from "../../api-middleware/flatServer";
import { errorTips } from "../../components/Tips/ErrorTips";
import { useHistory } from "react-router";
import { message } from "antd";

export const HomePage = observer(function HomePage() {
    const globalStore = useContext(GlobalStoreContext);
    const pageStore = useContext(PageStoreContext);
    const [isLogin, setIsLogin] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => pageStore.configure(), []);
    const history = useHistory();
    const urlToJson = (
        url = window.location.href,
    ): {
        [key: string]: string;
    } => {
        const obj = {} as Record<string, string>,
            index = url.indexOf("?"),
            params = url.substr(index + 1);
        if (index !== -1) {
            // 有参数时
            const parr = params.split("&");
            for (const i of parr) {
                // 遍历数组
                const arr = i.split("=");
                obj[arr[0]] = arr[1];
            }
        }

        return obj;
    };
    useEffect(() => {
        let isUnMount = false;
        async function checkLogin(): Promise<boolean> {
            // 本地未登录且url没有token
            if (!globalStore.userInfo?.token && !history.location.search) {
                return false;
            }
            if (globalStore.lastLoginCheck) {
                if (Date.now() - globalStore.lastLoginCheck < 2 * 60 * 60 * 1000) {
                    return true;
                }
            }

            try {
                let search: { [key: string]: string };
                let userInfo: LoginProcessResult;
                if (history.location.search) {
                    search = urlToJson(history.location.search);
                    userInfo = await loginCheck(search.token);
                } else {
                    userInfo = await loginCheck();
                }
                globalStore.updateUserInfo(userInfo);
                globalStore.lastLoginCheck = Date.now();
                return true;
            } catch (e) {
                globalStore.lastLoginCheck = null;
                console.error(e);
                setIsLogin(false);
                errorTips(e as Error);
            }

            return false;
        }

        void checkLogin().then(isLoggedIn => {
            if (!isUnMount) {
                setIsLogin(isLoggedIn);
                if (!isLoggedIn) {
                    // 判断是否登录 如果没有登录则跳转至登录页面 https://nhapp.sirthink.cn/auth/login
                    // replaceHistory(RouteNameType.LoginPage);
                    void message.error("登录失效，正在跳转登录", 2);
                    setTimeout(() => {
                        window.location.href = "https://nhapp.sirthink.cn/auth/login";
                    }, 2000);
                }
            }
        });

        return () => {
            isUnMount = true;
        };
        // Only check login once on start
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="homepage-layout-horizontal-container">
            <MainRoomMenu />
            <div className="homepage-layout-horizontal-content">
                <MainRoomListPanel isLogin={isLogin} isOther={false} />
                <MainRoomListPanel isLogin={isLogin} isOther={true} />
            </div>
        </div>
    );
});

export default HomePage;
