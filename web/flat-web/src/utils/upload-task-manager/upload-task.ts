import { makeAutoObservable, observable } from "mobx";
import { v4 as v4uuid } from "uuid";
import Axios from "axios";
import { cancelUpload, uploadFinish, uploadStart } from "../../api-middleware/flatServer/storage";
import { STORAGE_DOMAIN } from "../../constants/process";
import { ServerRequestError } from "../error/server-request-error";
import { RequestErrorCode } from "../../constants/error-code";
import * as qiniu from "qiniu-js";
export enum UploadStatusType {
    Pending = 1,
    Starting,
    Uploading,
    Success,
    Failed,
    Cancelling,
    Cancelled,
}

export class UploadTask {
    public uploadID = v4uuid();

    public fileParams = {
        file_name: "",
        file_type: "",
        file_size: 0,
        file_url: "",
        region: "",
    };

    public status = UploadStatusType.Pending;

    public percent = 0;

    public file: File;

    public fileUUID?: string;

    private _cancelTokenSource?: {
        unsubscribe: () => void;
    };

    public constructor(file: File) {
        this.file = file;

        makeAutoObservable<this, "_cancelTokenSource">(this, {
            file: observable.ref,
            _cancelTokenSource: false,
        });
    }
    // 二开标识 获取上传凭证
    public async getUpLoadVoucher(): Promise<string> {
        return await uploadStart({
            apiModule: STORAGE_DOMAIN,
        });
    }
    // 上传文件
    public uploadFile(voucher: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const { name: fileName } = this.file;
            const config = {
                useCdnDomain: true,
            };
            const putExtra: any = {
                fname: fileName, // 文件原文件名
            };
            const fileUUID = v4uuid();
            this.updateFileUUID(fileUUID);
            const fileType = fileName.substr(fileName.lastIndexOf("."));
            const name = `${fileUUID}${fileType}`;
            const observable = qiniu.upload(this.file, name, voucher, putExtra, config);
            this._cancelTokenSource = observable.subscribe({
                next: ({ total }) => {
                    this.updatePercent(Math.floor((100 * total.loaded) / total.size));
                    this.updateStatus(UploadStatusType.Uploading);
                },
                error: _ => {
                    this.updateStatus(UploadStatusType.Failed);
                    reject(_);
                },
                complete: e => {
                    if (e.key) {
                        this.updateFileParams({
                            file_type: fileType,
                            file_name: name,
                            file_size: this.file.size,
                            file_url: e.key,
                            region: "qiniu_east",
                        });
                        resolve(e);
                    }
                },
            });
        });
    }
    public async upload(): Promise<void> {
        if (this.getStatus() !== UploadStatusType.Pending) {
            return;
        }

        // const { name: fileName } = this.file;
        try {
            this.updateStatus(UploadStatusType.Starting);

            let voucher: string;

            try {
                voucher = await this.getUpLoadVoucher();
            } catch (e) {
                // max concurrent upload count limit
                if (
                    e instanceof ServerRequestError &&
                    e.errorCode === RequestErrorCode.UploadConcurrentLimit
                ) {
                    console.warn("[cloud-storage]: hit max concurrent upload count limit");
                    await cancelUpload();
                    voucher = await this.getUpLoadVoucher();
                } else {
                    throw e;
                }
            }

            if (this.getStatus() !== UploadStatusType.Starting) {
                return;
            }
            await this.uploadFile(voucher);
            // this.updateFileUUID(fileUUID);

            // const formData = new FormData();
            // const encodeFileName = encodeURIComponent(fileName);
            // formData.append("key", filePath);
            // formData.append("name", fileName);
            // formData.append("policy", policy);
            // formData.append("OSSAccessKeyId", CLOUD_STORAGE_OSS_ALIBABA_CONFIG.accessKey);
            // formData.append("success_action_status", "200");
            // formData.append("callback", "");
            // formData.append("signature", signature);
            // formData.append(
            //     "Content-Disposition",
            //     `attachment; filename="${encodeFileName}"; filename*=UTF-8''${encodeFileName}`,
            // );
            // formData.append("file", this.file);

            // this._cancelTokenSource = Axios.CancelToken.source();

            // this.updateStatus(UploadStatusType.Uploading);

            // await Axios.post(policyURL, formData, {
            //     headers: {
            //         "Content-Type": "multipart/form-data",
            //     },
            //     onUploadProgress: (e: ProgressEvent) => {
            //         this.updatePercent(Math.floor((100 * e.loaded) / e.total));
            //     },
            //     cancelToken: this._cancelTokenSource.token,
            // });
        } catch (e) {
            if (e instanceof Axios.Cancel) {
                this.updateStatus(UploadStatusType.Cancelled);
            } else {
                console.error(e);
                if (this.fileUUID) {
                    try {
                        await cancelUpload({ fileUUIDs: [this.fileUUID] });
                    } catch (e) {
                        console.error(e);
                    }
                }
                this.updateStatus(UploadStatusType.Failed);
            }
        }

        this._cancelTokenSource = void 0;

        if (this.getStatus() === UploadStatusType.Uploading) {
            await this.finish();
            this.updateStatus(UploadStatusType.Success);
        }
    }

    public async finish(): Promise<void> {
        if (this.fileUUID) {
            try {
                console.log(this.fileParams);
                await uploadFinish({
                    fileUUID: this.fileUUID,
                    apiModule: STORAGE_DOMAIN,
                    ...this.getFileParams(),
                });
            } catch (e) {
                console.error(e);
            }
        }
    }

    public cancelUploadProgress(): void {
        if (this._cancelTokenSource) {
            this._cancelTokenSource.unsubscribe();
            this._cancelTokenSource = void 0;
        }
    }

    public async cancelUpload(): Promise<void> {
        if (this.getStatus() === UploadStatusType.Cancelling || !this.fileUUID) {
            return;
        }

        this.updateStatus(UploadStatusType.Cancelling);

        try {
            this.cancelUploadProgress();
            await cancelUpload({ fileUUIDs: [this.fileUUID] });
        } catch (e) {
            console.error(e);
        }

        this.updateStatus(UploadStatusType.Cancelled);
    }

    public updateFileUUID(fileUUID: string): void {
        this.fileUUID = fileUUID;
    }

    public updatePercent(percent: number): void {
        this.percent = percent;
    }

    public updateStatus(status: UploadStatusType): void {
        this.status = status;
    }

    public getStatus(): UploadStatusType {
        return this.status;
    }

    public updateFileParams(params: {
        file_name: string;
        file_type: string;
        file_size: number;
        file_url: string;
        region: string;
    }): void {
        this.fileParams = params;
    }

    public getFileParams(): {
        file_name: string;
        file_type: string;
        file_size: number;
        file_url: string;
        region: string;
    } {
        return this.fileParams;
    }
}
