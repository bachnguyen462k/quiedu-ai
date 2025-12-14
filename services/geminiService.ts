import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, TextbookAnalysisResult } from "../types";
// @ts-ignore
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJson = (text: string) => {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

  // Extract the JSON object if there's surrounding text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned.trim();
};

const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Generate a study set based on a topic
export const generateStudySetWithAI = async (topic: string, count: number = 10): Promise<{ title: string; description: string; cards: Omit<Flashcard, 'id'>[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a study set for the topic: "${topic}". The set should have ${count} terms. Language: Vietnamese.`,
      config: {
        systemInstruction: "You are a helpful educational assistant. You create study flashcards. For each term, provide 4 multiple choice options (one correct, 3 distractors) AND a short explanation for the correct answer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy title for the study set" },
            description: { type: Type.STRING, description: "A short description of what this set covers" },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: "The question or concept" },
                  definition: { type: Type.STRING, description: "The CORRECT answer" },
                  options: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "List of 4 options including the correct answer"
                  },
                  explanation: { type: Type.STRING, description: "Brief explanation why the answer is correct" }
                },
                required: ["term", "definition", "options"]
              }
            }
          },
          required: ["title", "description", "cards"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJson(text));
  } catch (error) {
    console.error("Error generating study set:", error);
    throw error;
  }
};

// Generate Study Set from File (PDF/Image) specifically for Q&A extraction
export const generateStudySetFromFile = async (base64File: string, fileName: string): Promise<{ title: string; description: string; cards: Omit<Flashcard, 'id'>[] }> => {
  try {
    // Extract mime type dynamically
    const mimeTypeMatch = base64File.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/pdf';
    const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

    let contentPart: any;

    // Handle DOCX (Not supported natively by Gemini Inline Data)
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        // Extract raw text using mammoth
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const textContent = result.value;
        contentPart = { text: `Đây là nội dung được trích xuất từ file Word (${fileName}):\n\n${textContent}` };
    } 
    // Handle Text files
    else if (mimeType === 'text/plain') {
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        const textContent = new TextDecoder().decode(arrayBuffer);
        contentPart = { text: `Đây là nội dung từ file văn bản (${fileName}):\n\n${textContent}` };
    }
    // Handle PDF / Images (Native Support)
    else {
        contentPart = {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
        };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          contentPart,
          {
            text: `Bạn là trợ lý giáo viên. Hãy trích xuất TẤT CẢ các câu hỏi trắc nghiệm từ tài liệu này để tạo thành bộ đề thi (Quiz) và Flashcards.

            QUY TẮC NHẬN DIỆN QUAN TRỌNG:
            1. Trích xuất MỌI câu hỏi trắc nghiệm tìm thấy, KHÔNG bỏ qua câu nào.
            2. "term": Nội dung câu hỏi.
            3. "options": Mảng chứa các lựa chọn (A, B, C, D...). Nếu trong file không có lựa chọn, hãy tự tạo ra 3 phương án nhiễu hợp lý.
            4. "definition": Là đáp án ĐÚNG. 
               - Nếu file có đánh dấu (dấu *, in đậm, gạch chân, hoặc bảng đáp án), hãy điền đáp án đúng vào đây.
               - Nếu KHÔNG tìm thấy dấu hiệu đáp án đúng, hãy ĐỂ TRỐNG chuỗi này ("") để người dùng tự chọn sau.
            5. "explanation": Hãy tạo ra một lời giải thích ngắn gọn (dưới 30 từ) giải thích tại sao đáp án đó đúng, hoặc tóm tắt kiến thức liên quan.

            Yêu cầu trả về JSON hợp lệ.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                  },
                  explanation: { type: Type.STRING }
                },
                required: ["term", "definition", "options"]
              }
            }
          },
          required: ["title", "description", "cards"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(cleanJson(text));

  } catch (error) {
    console.error("Error generating from file:", error);
    throw error;
  }
};

// Analyze student submission (image/pdf) for grading
export const gradeSubmissionWithAI = async (base64File: string, assignmentTitle: string): Promise<string> => {
  try {
    // Extract mime type dynamically
    const mimeTypeMatch = base64File.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    
    // Remove data prefix if present
    const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Bạn là trợ lý giáo viên. Hãy phân tích bài làm của học sinh (được cung cấp dưới dạng file) cho bài tập chủ đề: "${assignmentTitle}". 
            
            Nhiệm vụ:
            1. Đọc và trích xuất nội dung chính mà học sinh đã viết.
            2. Nhận xét về độ chính xác so với chủ đề.
            3. Đề xuất số điểm (trên thang 100) dựa trên nội dung.
            
            Hãy trả về kết quả dưới dạng Markdown ngắn gọn, dễ đọc.`
          }
        ]
      }
    });

    return response.text || "Không thể phân tích bài làm.";
  } catch (error) {
    console.error("Error grading submission:", error);
    return "Có lỗi xảy ra khi AI chấm bài. Vui lòng thử lại.";
  }
};

// Analyze Textbook/File content (PDF/Image)
export const analyzeTextbookWithAI = async (base64File: string): Promise<TextbookAnalysisResult> => {
    try {
        // Extract mime type dynamically
        const mimeTypeMatch = base64File.match(/^data:([^;]+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/pdf'; // Default to PDF if generic
        const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

        let contentPart: any;

        // Handle DOCX for Textbook Analysis too
        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
             const arrayBuffer = base64ToArrayBuffer(base64Data);
             const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
             contentPart = { text: result.value };
        } else {
             contentPart = {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
             };
        }

        // Use a more restrictive prompt to ensure JSON validity and manage token usage
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    contentPart,
                    {
                        text: `Bạn là chuyên gia giáo dục. Hãy phân tích tài liệu được cung cấp và tạo nội dung bài học.

                        QUAN TRỌNG - TUÂN THỦ NGHIÊM NGẶT:
                        1. Tóm tắt nội dung chính của tài liệu (ngắn gọn).
                        2. Trích xuất TỐI ĐA 3 chủ đề (Topics) quan trọng nhất.
                        3. Với mỗi chủ đề, tạo 10 câu hỏi trắc nghiệm (QUIZ) và 5 câu hỏi tự luận (ESSAY).
                        
                        TRẢ VỀ JSON DUY NHẤT theo định dạng sau (đảm bảo JSON hợp lệ):
                        {
                          "subject": "Tên môn học (Ngắn gọn)",
                          "grade": "Lớp/Trình độ",
                          "overallSummary": "Tóm tắt chung ngắn gọn",
                          "topics": [
                            {
                              "topicName": "Tên chủ đề",
                              "summary": "Tóm tắt chủ đề (dưới 50 từ)",
                              "keyPoints": ["Ý chính 1", "Ý chính 2", "Ý chính 3"],
                              "formulas": ["Công thức quan trọng (nếu có)"],
                              "questions": [
                                {
                                  "type": "QUIZ",
                                  "difficulty": "Thông hiểu",
                                  "question": "Câu hỏi ngắn gọn",
                                  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                                  "correctAnswer": "A. ...",
                                  "solutionGuide": "Giải thích ngắn",
                                  "knowledgeApplied": "Kiến thức áp dụng"
                                }
                              ]
                            }
                          ]
                        }`
                    }
                ]
            },
            config: {
                // Force JSON response to minimize formatting errors
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        try {
            return JSON.parse(cleanJson(text));
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            console.log("Raw Text Sample:", text.substring(0, 500) + "..."); // Log start of text for debug
            throw new Error("Dữ liệu trả về từ AI không đúng định dạng. Vui lòng thử lại hoặc dùng file nhỏ hơn.");
        }

    } catch (error) {
        console.error("Error analyzing textbook:", error);
        throw error;
    }
}