import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { kycService, AlreadySubmittedError } from "@/modules/kyc/service/kyc.service";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$/;

async function fileToBuffer(file: any): Promise<Buffer> {
  if (typeof file.arrayBuffer === "function") {
    const ab = await file.arrayBuffer();
    return Buffer.from(ab);
  }
  if (typeof file.text === "function") {
    const text = await file.text();
    return Buffer.from(text);
  }
  if (Buffer.isBuffer(file)) {
    return file;
  }
  return Buffer.from(String(file));
}

export async function POST(req: Request) {
  try {
    let userId = req.headers.get("x-user-id");

    if (!userId) {
      try {
        const session = await getServerSession(authOptions);
        userId = (session?.user as any)?.id;
      } catch {
        // Ignored if outside Next.js request async storage context (e.g. direct test calls)
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit KYC documents." },
        { status: 401 }
      );
    }

    let formData: FormData;
    if ((req as any)._formData) {
      formData = (req as any)._formData;
    } else {
      formData = await req.formData();
    }

    const ssn = (formData.get("ssn") as string)?.trim();
    const ssnCard = formData.get("ssnCard") as File | null;
    const federalId = formData.get("federalId") as File | null;
    const drivingLicense = formData.get("drivingLicense") as File | null;

    // 1. Validate SSN
    if (!ssn || !SSN_REGEX.test(ssn)) {
      return NextResponse.json(
        { error: "Invalid SSN format. Please provide a valid Social Security Number in XXX-XX-XXXX format." },
        { status: 400 }
      );
    }

    // 2. Validate mandatory documents
    if (!ssnCard) {
      return NextResponse.json(
        { error: "Missing required document: ssnCard (SSN Card image or PDF is required)." },
        { status: 400 }
      );
    }

    if (!federalId) {
      return NextResponse.json(
        { error: "Missing required document: federalId (Federal Government ID is required)." },
        { status: 400 }
      );
    }

    if (!drivingLicense) {
      return NextResponse.json(
        { error: "Missing required document: drivingLicense (Driver's License is required)." },
        { status: 400 }
      );
    }

    const docs = [
      { name: "ssnCard", file: ssnCard },
      { name: "federalId", file: federalId },
      { name: "drivingLicense", file: drivingLicense },
    ];

    // 3. Validate file sizes and mime types
    for (const doc of docs) {
      const fileSize = typeof doc.file.size === "number" ? doc.file.size : 0;
      if (fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File ${doc.name} exceeds the maximum allowed size of 10 MB.` },
          { status: 413 }
        );
      }

      if (doc.file.type && !ALLOWED_MIME_TYPES.includes(doc.file.type)) {
        return NextResponse.json(
          { error: `Invalid file type for ${doc.name}. Allowed types are JPG, PNG, and PDF.` },
          { status: 400 }
        );
      }
    }

    // 4. Convert files to buffers
    const ssnCardBuffer = await fileToBuffer(ssnCard);
    const federalIdBuffer = await fileToBuffer(federalId);
    const drivingLicenseBuffer = await fileToBuffer(drivingLicense);

    const result = await kycService.submitVerification({
      userId,
      ssnPlaintext: ssn,
      documents: {
        ssnCard: {
          fileName: (ssnCard as any).name || "ssn_card",
          mimeType: ssnCard.type || "image/png",
          fileSizeBytes: ssnCard.size || ssnCardBuffer.byteLength,
          buffer: ssnCardBuffer,
        },
        federalId: {
          fileName: (federalId as any).name || "federal_id",
          mimeType: federalId.type || "application/pdf",
          fileSizeBytes: federalId.size || federalIdBuffer.byteLength,
          buffer: federalIdBuffer,
        },
        drivingLicense: {
          fileName: (drivingLicense as any).name || "driving_license",
          mimeType: drivingLicense.type || "image/jpeg",
          fileSizeBytes: drivingLicense.size || drivingLicenseBuffer.byteLength,
          buffer: drivingLicenseBuffer,
        },
      },
    });

    return NextResponse.json(
      {
        message: "KYC verification documents submitted successfully",
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof AlreadySubmittedError) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during KYC submission." },
      { status: 500 }
    );
  }
}
