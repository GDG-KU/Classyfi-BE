import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs-extra";
import path from "path";
import { Readable } from "stream";


// Next.js Request → Node.js Request 변환

function toNodeRequest(req: Request): any {
  const body = Readable.from(req.body as any);
  const headers: any = {};

  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return Object.assign(body, {
    headers,
    method: req.method,
    url: req.url,
  });
}

//  AI 서버로 전송
async function sendToAI(files: any[], keywords: string[]) {
  const apiUrl = "https://httpbin.org/post"; // 테스트용 AI 서버

  const filePayload = [];

  for (const f of files) {
    const buffer = await fs.readFile(f.filepath);
    filePayload.push({
      filename: f.originalFilename,
      file: buffer.toString("base64"), 
    });
  }

  const payload = {
    files: filePayload,
    keywords,
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const aiJson = await res.json();

  return {
    status: res.status,
    receivedFileNames: filePayload.map((f) => f.filename),
    receivedKeywords: keywords,
    origin: aiJson.origin,
    url: aiJson.url,
  };
}


// 파일 업로드 + AI 전송
export async function POST(req: Request) {
  try {
    // workspace 폴더 생성
    const workspace = path.join(process.cwd(), "workspace");
    await fs.ensureDir(workspace);

    // 업로드 폴더 생성
    const uploadDir = path.join(workspace, `upload-${Date.now()}`);
    await fs.ensureDir(uploadDir);

    // Next.js Request → Node.js Request
    const nodeReq = toNodeRequest(req);

    // Formidable 설정
    const form = formidable({
      multiples: true,
      uploadDir,
      keepExtensions: true,
    });

    // FormData 파싱
    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(nodeReq, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // 키워드 처리
    let keywords: string[] = [];
    if (fields.keywords) {
      keywords = JSON.parse(fields.keywords);
    }

    if (keywords.length === 0) {
      return NextResponse.json({ error: "keywords가 필요합니다." }, { status: 400 });
    }

    //  PDF 파일 처리
    const pdfFiles = files.files;

    if (!pdfFiles || pdfFiles.length === 0) {
      return NextResponse.json({ error: "PDF 파일이 없습니다." }, { status: 400 });
    }

    const pdfArray = Array.isArray(pdfFiles) ? pdfFiles : [pdfFiles];

    //  AI로 전송
    const aiResponse = await sendToAI(pdfArray, keywords);
    
    // 프론트로 전달
    return NextResponse.json({
      message: "파일 저장 + AI 전송 완료!",
      uploadDir,
      files: pdfArray.map((f) => ({
        filename: f.originalFilename,
        size: f.size,
        path: f.filepath,
      })),
      aiResponse,
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

