import { prisma } from "@/lib/prisma";
import { KycDocument, KycDocumentType } from "@prisma/client";

export interface SaveDocumentParams {
  userVerificationId: string;
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  buffer: Buffer;
}

export interface IDocumentStorage {
  save(params: SaveDocumentParams): Promise<KycDocument>;
  retrieve(kycDocumentId: string): Promise<Buffer>;
  delete(kycDocumentId: string): Promise<void>;
}

export class PostgresDocumentStorageService implements IDocumentStorage {
  async save(params: SaveDocumentParams): Promise<KycDocument> {
    const base64Data = params.buffer.toString("base64");

    return prisma.kycDocument.upsert({
      where: {
        userVerificationId_documentType: {
          userVerificationId: params.userVerificationId,
          documentType: params.documentType,
        },
      },
      update: {
        originalFileName: params.fileName,
        mimeType: params.mimeType,
        fileSizeBytes: params.fileSizeBytes,
        storageBackend: "postgres",
        storageRef: "db-embedded",
        base64Data,
        uploadedAt: new Date(),
      },
      create: {
        userVerificationId: params.userVerificationId,
        documentType: params.documentType,
        originalFileName: params.fileName,
        mimeType: params.mimeType,
        fileSizeBytes: params.fileSizeBytes,
        storageBackend: "postgres",
        storageRef: "db-embedded",
        base64Data,
      },
    });
  }

  async retrieve(kycDocumentId: string): Promise<Buffer> {
    const doc = await prisma.kycDocument.findUnique({
      where: { id: kycDocumentId },
    });

    if (!doc || !doc.base64Data) {
      throw new Error(`Document with ID ${kycDocumentId} not found or missing binary data.`);
    }

    return Buffer.from(doc.base64Data, "base64");
  }

  async delete(kycDocumentId: string): Promise<void> {
    await prisma.kycDocument.delete({
      where: { id: kycDocumentId },
    });
  }
}

export const documentStorageService: IDocumentStorage = new PostgresDocumentStorageService();
