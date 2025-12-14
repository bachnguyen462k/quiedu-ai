import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, TextbookAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating study set:", error);
    throw error;
  }
};

// Analyze student submission (image) for grading
export const gradeSubmissionWithAI = async (base64Image: string, assignmentTitle: string): Promise<string> => {
  try {
    // Remove data:image/png;base64, prefix if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png for simplicity
              data: base64Data
            }
          },
          {
            text: `Bạn là trợ lý giáo viên. Hãy phân tích hình ảnh bài làm của học sinh cho bài tập chủ đề: "${assignmentTitle}". 
            
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

// Analyze Textbook/File content
export const analyzeTextbookWithAI = async (base64Image: string): Promise<TextbookAnalysisResult> => {
    try {
        const base64Data = base64Image.split(',')[1] || base64Image;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Data
                        }
                    },
                    {
                        text: `Hãy đóng vai một trợ lý giáo viên chuyên nghiệp. Nhiệm vụ của bạn là phân tích trang sách giáo khoa/tài liệu này và trích xuất thông tin để soạn bài giảng.
                        
                        Yêu cầu đầu ra (JSON):
                        1. lessonTitle: Tên bài học.
                        2. summary: Tóm tắt nội dung chính (khoảng 2-3 câu).
                        3. difficultyLevel: Đánh giá độ khó (Dễ, Trung bình, Khó, Rất khó).
                        4. difficultyReasoning: Giải thích ngắn gọn tại sao lại đánh giá độ khó như vậy (dựa trên từ vựng, độ phức tạp kiến thức).
                        5. keyPoints: Danh sách các ý chính/kiến thức trọng tâm (array of strings).
                        6. examples: Danh sách các ví dụ minh họa có trong bài hoặc ví dụ tương tự (array of strings).
                        7. generatedQuestions: Tạo ra 5 câu hỏi trắc nghiệm (quiz) dựa trên nội dung này để kiểm tra học sinh. Mỗi câu hỏi cần có: question, options (4 lựa chọn), correctAnswer, và explanation (giải thích).`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lessonTitle: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        difficultyLevel: { type: Type.STRING, enum: ["Dễ", "Trung bình", "Khó", "Rất khó"] },
                        difficultyReasoning: { type: Type.STRING },
                        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        examples: { type: Type.ARRAY, items: { type: Type.STRING } },
                        generatedQuestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                },
                                required: ["question", "options", "correctAnswer", "explanation"]
                            }
                        }
                    },
                    required: ["lessonTitle", "summary", "difficultyLevel", "difficultyReasoning", "keyPoints", "examples", "generatedQuestions"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text);

    } catch (error) {
        console.error("Error analyzing textbook:", error);
        throw error;
    }
}