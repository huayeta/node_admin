import fse from 'fs-extra';
import fs from 'fs';
import path from 'path';
import configs from '../config';
const { upload_dir } = configs;
// 判断参数是否存在
export const judgeParams = (
    fields: string[],
    obj: { [propName: string]: any }
) => {
    const results: string[] = [];
    fields.forEach(field => {
        if (!obj[field]) results.push(`${field}不存在`);
    });
    return results;
};
// 合并文件
export const mergeFileChunk = async ({
    fileHash,
    exit
}: {
    fileHash: string;
    exit: string;
}): Promise<boolean> => {
    const chunkDir = path.join(upload_dir, './caches', fileHash);
    const chunks = await fse.readdir(chunkDir);
    const filePath = path.join(upload_dir, `${fileHash}.${exit}`);
    await fse.remove(filePath);
    await fse.outputFile(filePath, '');
    chunks.forEach(chunk => {
        const chunkPath = path.join(chunkDir, `./${chunk}`);
        fse.appendFileSync(filePath, fs.readFileSync(chunkPath));
        fse.unlinkSync(chunkPath);
    });
    fse.rmdirSync(chunkDir);
    return true;
};
// 提取文件扩展名
export const extractExt = (fileName: string) => {
    return fileName.slice(fileName.lastIndexOf('.') + 1, fileName.length);
};
