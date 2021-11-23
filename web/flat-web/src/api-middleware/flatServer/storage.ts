import { Region } from "flat-components";
import { STORAGE_DOMAIN } from "../../constants/process";
import { FileConvertStep } from "./constants";
import { get, post } from "./utils";

// 二开标识 apiModule:给公用方法配置请求地址
export interface ListFilesPayload {
    page: number;
    file_type?: string;
    apiModule?: string;
}
interface ListFilesResponse {
    total: number;
    rows: Array<Omit<CloudFile, "createAt"> & { file_time: number }>;
}

export interface CloudFile {
    file_memo: string;
    fileUUID: string;
    file_uuid: string;
    fileName: string;
    file_name: string;
    fileSize: number;
    file_size: number;
    fileURL: string;
    file_url: string;
    task_uuid: string;
    task_token: string;
    convertStep: FileConvertStep;
    convert_step: FileConvertStep;
    /** Query courseware converting status */
    taskUUID: string;
    taskToken: string;
    createAt: Date;
    region: Region;
}

export interface ListFilesResult {
    totalUsage: number;
    files: CloudFile[];
}
// 二开标识 云盘列表请求地址
export async function listFiles(payload: ListFilesPayload): Promise<ListFilesResult> {
    const { rows, total } = await post<ListFilesResponse>("Qiniu/User/List", payload);
    return {
        totalUsage: total,
        files: rows.map(file => ({
            ...file,
            createAt: new Date(file.file_time),
            fileName: file.file_name,
            fileUUID: file.file_uuid,
            fileSize: file.file_size,
            fileURL: file.file_url,
            taskToken: file.task_token,
            taskUUID: file.task_uuid,
            convert: file.convert_step,
        })),
    };
}

export interface UploadStartPayload {
    fileName?: string;
    fileSize?: number;
    region?: Region;
    apiModule?: string;
}

export interface UploadStartResult {
    fileUUID: string;
    filePath: string;
    policy: string;
    policyURL: string;
    signature: string;
}
// 二开标识 获取上传凭证
export async function uploadStart(payload: UploadStartPayload): Promise<string> {
    return await get("Qiniu/GetUploadToken", payload);
}
interface UploadFinishPayload {
    fileUUID: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    region?: string;
    apiModule?: string;
}
// 上传文件到七牛云后保存到自己服务器
export async function uploadFinish(payload: UploadFinishPayload): Promise<void> {
    await post("Qiniu/Uploaded/save", payload);
}

export interface RenameFilePayload {
    file_uuid: string;
    file_name: string;
}
// 二开标识 重命名
export async function renameFile(payload: RenameFilePayload): Promise<void> {
    await post("Qiniu/User/rename", {
        ...payload,
        apiModule: STORAGE_DOMAIN,
    });
}

export interface RemoveFilesPayload {
    file_uuids: string;
}
// 二开标识 删除数据
export async function removeFiles(payload: RemoveFilesPayload): Promise<void> {
    await post("Qiniu/User/remove", {
        ...payload,
        apiModule: STORAGE_DOMAIN,
    });
}
export interface FileMemoPayload {
    file_uuid: string;
    file_memo: string;
}
// 二开标识 删除数据
export async function fileMemo(payload: FileMemoPayload): Promise<void> {
    await post("Qiniu/User/memo", {
        ...payload,
        apiModule: STORAGE_DOMAIN,
    });
}

export interface ConvertStartPayload {
    fileUUID: string;
}

export interface ConvertStartResult {
    taskUUID: string;
    taskToken: string;
}
// 二开标识 这三个接口都得改
export async function convertStart(payload: ConvertStartPayload): Promise<ConvertStartResult> {
    return await post("Qiniu/convert/start", {
        file_uuid: payload.fileUUID,
        apiModule: STORAGE_DOMAIN,
    });
}

export interface ConvertFinishPayload {
    fileUUID: string;
}

export interface ConvertFinishResult { }

export async function convertFinish(payload: ConvertFinishPayload): Promise<ConvertFinishResult> {
    return await post("Qiniu/convert/finish", {
        ...payload,
        file_uuid: payload.fileUUID,
        apiModule: STORAGE_DOMAIN,
    });
}

export interface CancelUploadPayload {
    fileUUIDs?: string[];
}

export async function cancelUpload(payload?: CancelUploadPayload): Promise<void> {
    await post("Qiniu/upload/cancel", {
        file_uuids: payload?.fileUUIDs ? payload.fileUUIDs.join(",") : "",
        apiModule: STORAGE_DOMAIN,
    });
}
