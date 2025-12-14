import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, TextbookAnalysisResult } from "../types";

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

// Generate a study set based on a topic
export const generateStudySetWithAI = async (topic: string, count: number = 10): Promise<{ title: string; description: string; cards: Omit<Flashcard, 'id'>[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a study set for the topic: "${topic}". The set should have ${count} terms. Language: Vietnamese.`,
      config: {
        systemInstruction: "You are a helpful educational assistant. You create study flashcards with clear, concise terms and definitions.",
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
                  term: { type: Type.STRING, description: "The word, concept, or question" },
                  definition: { type: Type.STRING, description: "The explanation, answer, or translation" }
                },
                required: ["term", "definition"]
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

        // Remove data header
        const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

        // We use a simplified approach without strict responseSchema for the PDF analysis
        // because huge documents can cause schema validation to truncate or fail.
        // Instead, we force JSON via mimeType and prompt engineering.
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
                        text: `Bạn là chuyên gia giáo dục. Hãy phân tích tài liệu đính kèm và tạo nội dung ôn tập.

                        YÊU CẦU:
                        1. Tóm tắt nội dung chính của tài liệu (ngắn gọn).
                        2. Trích xuất TỐI ĐA 3 chủ đề (Topics) quan trọng nhất.
                        3. Với mỗi chủ đề, tạo 10 câu hỏi trắc nghiệm (QUIZ) và 5 câu hỏi tự luận (ESSAY).
                        
                        TRẢ VỀ JSON DUY NHẤT (Không Markdown) theo mẫu:
                        {
                          "subject": "Tên môn học",
                          "grade": "Lớp",
                          "overallSummary": "Tóm tắt chung",
                          "topics": [
                            {
                              "topicName": "Tên chủ đề",
                              "summary": "Tóm tắt chủ đề (ngắn)",
                              "keyPoints": ["Ý chính 1", "Ý chính 2"],
                              "formulas": ["Công thức nếu có"],
                              "questions": [
                                {
                                  "type": "QUIZ",
                                  "difficulty": "Thông hiểu",
                                  "question": "Nội dung câu hỏi",
                                  "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
                                  "correctAnswer": "A. Đáp án 1",
                                  "solutionGuide": "Hướng dẫn giải ngắn gọn",
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
                // responseSchema is removed to prevent truncation errors on large inputs
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        try {
            return JSON.parse(cleanJson(text));
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            console.log("Raw Text:", text);
            throw new Error("Dữ liệu trả về bị lỗi. Vui lòng thử lại với file nhỏ hơn hoặc rõ nét hơn.");
        }

    } catch (error) {
        console.error("Error analyzing textbook:", error);
        throw error;
    }
}