import { Injectable } from "@nestjs/common";
import { Client } from "minio";
import { randomUUID } from "crypto";

@Injectable()
export class MinioService {
  private client: Client;
  private bucket = process.env.MINIO_BUCKET ?? "samadokita";

  constructor() {
    const raw = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").replace(/^https?:\/\//, "");
    const hostPort = raw.split("/")[0];
    const [host, portStr] = hostPort.split(":");
    this.client = new Client({
      endPoint: host,
      port: Number(portStr ?? 9000),
      useSSL: (process.env.MINIO_ENDPOINT ?? "").startsWith("https"),
      accessKey: process.env.MINIO_ROOT_USER ?? process.env.MINIO_ACCESS_KEY ?? "minioadmin",
      secretKey: process.env.MINIO_ROOT_PASSWORD ?? process.env.MINIO_SECRET_KEY ?? "minioadmin",
    });
    void this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) await this.client.makeBucket(this.bucket, "af");
    } catch {
      /* MinIO démarré après l'app: les uploads retenteront */
    }
  }

  async upload(objectName: string, buffer: Buffer, contentType = "application/octet-stream"): Promise<string> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectName, buffer, {
      "Content-Type": contentType,
    });
    return `${process.env.MINIO_ENDPOINT}/${this.bucket}/${objectName}?v=${randomUUID().slice(0, 8)}`;
  }

  async getObject(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectName);
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  async remove(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }

  async ping(): Promise<void> {
    await this.client.bucketExists(this.bucket);
  }
}
