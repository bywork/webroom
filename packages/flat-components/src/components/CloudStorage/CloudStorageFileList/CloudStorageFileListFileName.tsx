/*
 * @Author: lmk
 * @Date: 2021-10-23 00:06:10
 * @LastEditTime: 2021-11-14 21:37:57
 * @LastEditors: lmk
 * @Description:
 */
import fileMenusSVG from "./icons/file-menus.svg";

import React from "react";
import { Button, Dropdown, Menu } from "antd";
import { CloudStorageFileTitle } from "../CloudStorageFileTitle";
import { CloudStorageFile, CloudStorageFileName } from "../types";

export interface CloudStorageFileListFileNameProps {
    file: CloudStorageFile;
    index: number;
    /** Is title clickable */
    titleClickable?: boolean;
    getPopupContainer: () => HTMLElement;
    /** Render file menus item base on fileUUID */
    fileMenus?: (
        file: CloudStorageFile,
        index: number,
    ) => Array<{ key: React.Key; name: React.ReactNode }> | void | undefined | null;
    /** When file menu item clicked */
    onItemMenuClick?: (fileUUID: string, menuKey: React.Key) => void;
    /** When title is clicked */
    onItemTitleClick?: (fileUUID: string) => void;
    /** UUID of file that is under renaming */
    renamingFileUUID?: string;
    /** Rename file. Empty name for cancelling */
    onRename?: (fileUUID: string, fileName?: CloudStorageFileName) => void;
}
export interface CloudStorageFileListFileNameItemProps {
    file: CloudStorageFile;
    index: number;
    /** Is title clickable */
    titleClickable?: boolean;
    getPopupContainer: () => HTMLElement;
    /** Render file menus item base on fileUUID */
    fileMenus?: (
        file: CloudStorageFile,
        index: number,
    ) => Array<{ key: React.Key; name: React.ReactNode }> | void | undefined | null;
    /** When file menu item clicked */
    onItemMenuClick?: (fileUUID: string, menuKey: React.Key) => void;
    /** When title is clicked */
    onItemTitleClick?: (fileUUID: string) => void;
    /** UUID of file that is under renaming */
    renamingFileUUID?: string;
    /** Rename file. Empty name for cancelling */
    onRename?: (fileUUID: string, fileName?: CloudStorageFileName) => void;
}
export interface CloudStorageFileListFileMemoItemProps {
    file: CloudStorageFile;
    index: number;
    /** Is title clickable */
    titleClickable?: boolean;
    getPopupContainer: () => HTMLElement;
    /** Render file menus item base on fileUUID */
    fileMenus?: (
        file: CloudStorageFile,
        index: number,
    ) => Array<{ key: React.Key; name: React.ReactNode }> | void | undefined | null;
    /** When file menu item clicked */
    onItemMenuClick?: (fileUUID: string, menuKey: React.Key) => void;
    /** When title is clicked */
    onItemTitleClick?: (fileUUID: string) => void;
    /** UUID of file that is under renaming */
    renamingFileUUID?: string;
    /** Rename file. Empty name for cancelling */
    onRename?: (fileUUID: string, fileName?: CloudStorageFileName) => void;
}
export const CloudStorageFileListFileName = React.memo<CloudStorageFileListFileNameItemProps>(
    function CloudStorageFileListFileName({
        file,
        titleClickable,
        onItemTitleClick,
        renamingFileUUID,
        onRename,
    }) {
        return (
            <div className="cloud-storage-file-list-filename-container">
                <CloudStorageFileTitle
                    fileUUID={file.fileUUID}
                    fileName={file.fileName}
                    convertStatus={file.convert}
                    titleClickable={titleClickable}
                    onTitleClick={onItemTitleClick}
                    renamingFileUUID={renamingFileUUID}
                    onRename={onRename}
                />
            </div>
        );
    },
);
export const CloudStorageFileListFileMemo = React.memo<CloudStorageFileListFileNameProps>(
    function CloudStorageFileListFileName({
        file,
        index,
        getPopupContainer,
        fileMenus,
        onItemMenuClick,
    }) {
        const menuItems = fileMenus && fileMenus(file, index);

        return (
            <div className="cloud-storage-file-list-filename-container">
                {/* <CloudStorageFileTitle
                    fileUUID={file.fileUUID}
                    fileName={file.file_memo}
                    titleClickable={titleClickable}
                    convertStatus={file.convert}
                    onTitleClick={onItemTitleClick}
                    renamingFileUUID={renamingFileUUID}
                    onRename={onRename}
                /> */}
                <span>{file.file_memo}</span>
                {menuItems && menuItems.length > 0 && (
                    <div className="cloud-storage-file-list-menu-btn-wrap">
                        <Dropdown
                            className="cloud-storage-file-list-menu-btn"
                            getPopupContainer={getPopupContainer}
                            overlay={
                                <Menu
                                    onClick={({ key }) =>
                                        onItemMenuClick && onItemMenuClick(file.fileUUID, key)
                                    }
                                >
                                    {menuItems.map(({ key, name }) => (
                                        <Menu.Item key={key}>{name}</Menu.Item>
                                    ))}
                                </Menu>
                            }
                            overlayClassName="cloud-storage-file-list-menu"
                        >
                            <Button>
                                <img src={fileMenusSVG} width={22} height={22} aria-hidden />
                            </Button>
                        </Dropdown>
                    </div>
                )}
            </div>
        );
    },
);
