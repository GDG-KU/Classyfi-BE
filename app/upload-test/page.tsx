"use client";

import { useState } from "react";

export default function UploadTestPage() {
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [files, setFiles] = useState<File[]>([]);
  const [response, setResponse] = useState<any>(null);

  // 키워드 추가
  const addKeywordInput = () => {
    setKeywords([...keywords, ""]);
  };

  // 개별 키워드 값 변경
  const updateKeyword = (index: number, value: string) => {
    const copy = [...keywords];
    copy[index] = value;
    setKeywords(copy);
  };

  // 파일 추가
  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles([...files, ...Array.from(fileList)]);
  };

  // 업로드 실행
  const handleUpload = async () => {
    const trimmedKeywords = keywords.map((k) => k.trim()).filter((k) => k !== "");
    if (trimmedKeywords.length === 0 || files.length === 0) {
      alert("키워드와 파일을 모두 입력해주세요!");
      return;
    }

    const formData = new FormData();
    formData.append("keywords", JSON.stringify(trimmedKeywords));

    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResponse(data);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>📤 PDF 업로드 테스트</h1>

      {/* 🔵 키워드 입력 */}
      <div style={{ marginTop: "20px" }}>
        <h2>🏷 키워드 입력</h2>

        {keywords.map((k, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <input
              type="text"
              value={k}
              onChange={(e) => updateKeyword(index, e.target.value)}
              placeholder="예: 해부학"
              style={{ width: "300px", padding: "8px" }}
            />
          </div>
        ))}

        <button
          onClick={addKeywordInput}
          style={{
            padding: "5px 10px",
            background: "#444",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginTop: "5px"
          }}
        >
          + 키워드 추가
        </button>
      </div>

      {/* 🔵 파일 업로드 */}
      <div style={{ marginTop: "20px" }}>
        <h2>📂 PDF 파일 추가</h2>

        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => handleAddFiles(e.target.files)}
        />

        <div style={{ marginTop: "10px" }}>
          {files.length > 0 && <strong>선택된 파일 목록:</strong>}
          <ul>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "blue",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        업로드 실행
      </button>

      {/* 서버 응답 */}
      {response && (
        <div style={{ marginTop: "30px" }}>
          <h2>📡 서버 응답</h2>
          <pre
            style={{
                background: "#eee",
                padding: "20px",
                borderRadius: "10px",
                maxWidth: "700px",
                maxHeight: "400px",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
            }}
        >

            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
