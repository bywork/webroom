/*
 * @Author: lmk
 * @Date: 2021-10-19 19:38:02
 * @LastEditTime: 2021-11-04 00:03:46
 * @LastEditors: lmk
 * @Description:
 */
import Axios from "axios";
import { Region } from "flat-components";
import { STORAGE_DOMAIN } from "../constants/process";
import { FileConvertStep } from "./flatServer/constants";
import { get } from "./flatServer/utils";

export interface ConvertingTaskStatus {
    uuid: string;
    type: "static" | "dynamic";
    status: "Waiting" | "Converting" | "Finished" | "Fail";
    failedReason: string;
    progress?: {
        totalPageSize: number;
        convertedPageSize: number;
        convertedPercentage: number;
        convertedFileList: Array<{
            width: number;
            height: number;
            conversionFileUrl: string;
            preview?: string;
        }>;
        currentStep: "Extracting" | "Packaging" | "GeneratingPreview" | "MediaTranscode";
    };
}
export async function queryConvertingTaskStatus({
    taskUUID,
    taskToken,
    dynamic,
}: {
    taskUUID: string;
    taskToken: string;
    dynamic: boolean;
    region: Region;
}): Promise<ConvertingTaskStatus> {
    const { data } = await Axios.get<ConvertingTaskStatus>(
        `https://api.netless.link/v5/services/conversion/tasks/${taskUUID}?type=${
            dynamic ? "dynamic" : "static"
        }`,
        { headers: { token: taskToken, region: "cn-hz" } },
    );
    let isSuccess: FileConvertStep = FileConvertStep.Converting;
    if (data.status === "Finished") {
        isSuccess = FileConvertStep.Done;
    }
    await get(`Qiniu/convert/SetStatus/${taskUUID}`, {
        uuid: taskUUID,
        convert_step: isSuccess,
        apiModule: STORAGE_DOMAIN,
    });
    return data;
}

export async function getZipData({
    baseURL,
    pptType,
    taskUUID,
}: {
    baseURL: string;
    pptType: "static" | "dynamic";
    taskUUID: string;
}): Promise<Blob> {
    const { data } = await Axios.get<Blob>(`${baseURL}/${pptType}Convert/${taskUUID}.zip`, {
        responseType: "blob",
    });

    return data;
}
