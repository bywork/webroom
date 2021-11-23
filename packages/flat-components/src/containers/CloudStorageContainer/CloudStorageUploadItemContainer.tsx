import React from "react";
import { observer } from "mobx-react-lite";
import { CloudStorageUploadItem, CloudStorageUploadItemProps } from "../../components/CloudStorage";
import { CloudStorageUploadTask } from "../../components/CloudStorage/types";

export type CloudStorageUploadItemContainerProps = {
    task: CloudStorageUploadTask;
} & Pick<CloudStorageUploadItemProps, "onCancel" | "onRetry">;

/** Reduce re-rendering */
export const CloudStorageUploadItemContainer = observer<CloudStorageUploadItemContainerProps>(
    function CloudStorageUploadItemContainer({ task, onCancel, onRetry }) {
        return (
            <CloudStorageUploadItem
                uploadID={task.uploadID}
                fileName={task.fileName}
                percent={task.percent}
                status={task.status}
                onCancel={onCancel}
                onRetry={onRetry}
            />
        );
    },
);
