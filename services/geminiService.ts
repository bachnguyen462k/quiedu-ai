
import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, TextbookAnalysisResult } from "../types";
// @ts-ignore
import mammoth from "mammoth";
import i18n from "../i18n"; // Import i18n to get current language

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to get current language name for prompts
const getLanguageName = () => {
    return i18n.language === 'en' ? 'English' : 'Vietnamese';
};

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
    const lang = getLanguageName();
    // Use gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create a study set for the topic: "${topic}". The set should have ${count} terms. Language: ${lang}.`,
      config: {
        systemInstruction: `You are a helpful educational assistant. You create study flashcards in ${lang}. For each term, provide 4 multiple choice options (one correct, 3 distractors) AND a short explanation for the correct answer.`,
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

    // The GenerateContentResponse object features a text property (not a method, so do not call text())
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJson(text));
  } catch (error: any) {
    console.error("Error generating study set:", error);
    if (error.toString().includes("400") || error.toString().includes("API key")) {
         throw new Error("Lỗi API Key: Vui lòng kiểm tra lại cấu hình key trong file .env hoặc Vercel. (Nhớ restart server sau khi sửa .env)");
    }
    throw error;
  }
};

// Generate Study Set from File (PDF/Image) specifically for Q&A extraction
export const generateStudySetFromFile = async (base64File: string, fileName: string): Promise<{ title: string; description: string; cards: Omit<Flashcard, 'id'>[] }> => {
  try {
    const lang = getLanguageName();
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
        contentPart = { text: `File content extracted from (${fileName}):\n\n${textContent}` };
    } 
    // Handle Text files
    else if (mimeType === 'text/plain') {
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        const textContent = new TextDecoder().decode(arrayBuffer);
        contentPart = { text: `File content from (${fileName}):\n\n${textContent}` };
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

    // Use gemini-3-flash-preview for document analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          contentPart,
          {
            text: `You are a teacher's assistant. Extract ALL multiple choice questions from this document to create a Quiz and Flashcards.
            OUTPUT LANGUAGE: ${lang}.

            RULES:
            1. Extract EVERY multiple choice question found.
            2. "term": The question text.
            3. "options": Array of choices (A, B, C, D...). If no options exist, generate 3 plausible distractors.
            4. "definition": The CORRECT answer. 
               - If the file marks the answer (asterisk, bold, answer key), put it here.
               - If NO answer is found, leave it EMPTY ("") for the user to select.
            5. "explanation": Create a short explanation (under 30 words) why the answer is correct.

            Return valid JSON.`
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

  } catch (error: any) {
    console.error("Error generating from file:", error);
    if (error.toString().includes("400") || error.toString().includes("API key")) {
        throw new Error("API Key Error.");
    }
    throw error;
  }
};

// Analyze student submission (image/pdf) for grading
export const gradeSubmissionWithAI = async (base64File: string, assignmentTitle: string): Promise<string> => {
  try {
    const lang = getLanguageName();
    const mimeTypeMatch = base64File.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

    // Use gemini-3-flash-preview for analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `You are a teacher assistant. Analyze this student submission for the assignment: "${assignmentTitle}".
            LANGUAGE: ${lang}.
            
            Tasks:
            1. Extract main content written by the student.
            2. Comment on accuracy regarding the topic.
            3. Suggest a score (0-100).
            
            Return result in concise Markdown.`
          }
        ]
      }
    });

    return response.text || "Unable to analyze.";
  } catch (error) {
    console.error("Error grading submission:", error);
    return "AI Grading Error.";
  }
};

// Analyze Textbook/File content (PDF/Image)
export const analyzeTextbookWithAI = async (base64File: string): Promise<TextbookAnalysisResult> => {
    try {
        const lang = getLanguageName();
        const mimeTypeMatch = base64File.match(/^data:([^;]+);base64,/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/pdf'; 
        const base64Data = base64File.replace(/^data:([^;]+);base64,/, '');

        let contentPart: any;

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

        // Use gemini-3-pro-preview for complex reasoning tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    contentPart,
                    {
                        text: `You are an education expert. Analyze the provided document and create lesson content.
                        OUTPUT LANGUAGE: ${lang}.

                        IMPORTANT - STRICTLY FOLLOW:
                        1. Summarize main content (concise).
                        2. Extract MAX 3 important topics.
                        3. For each topic, create 10 multiple choice questions (QUIZ) and 5 essay questions (ESSAY).
                        
                        RETURN JSON ONLY.`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING, description: "Subject Name" },
                    grade: { type: Type.STRING, description: "Grade Level" },
                    overallSummary: { type: Type.STRING, description: "Concise summary" },
                    topics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          topicName: { type: Type.STRING, description: "Topic Name" },
                          summary: { type: Type.STRING, description: "Topic summary (under 50 words)" },
                          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main points" },
                          formulas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important formulas (if any)" },
                          questions: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                type: { type: Type.STRING, description: "QUIZ or ESSAY" },
                                difficulty: { type: Type.STRING, description: "Thông hiểu, Vận dụng..." },
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options (if QUIZ)" },
                                correctAnswer: { type: Type.STRING, description: "Correct choice (if QUIZ)" },
                                solutionGuide: { type: Type.STRING, description: "Explanation" },
                                knowledgeApplied: { type: Type.STRING, description: "Applied Knowledge" }
                              },
                              required: ["type", "difficulty", "question", "solutionGuide", "knowledgeApplied"]
                            }
                          }
                        },
                        required: ["topicName", "summary", "keyPoints", "questions"] // 'formulas' are optional
                      }
                    }
                  },
                  required: ["subject", "grade", "overallSummary", "topics"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        try {
            return JSON.parse(cleanJson(text));
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            throw new Error("AI response format error. Please try again.");
        }

    } catch (error: any) {
        console.error("Error analyzing textbook:", error);
        if (error.toString().includes("400") || error.toString().includes("API key")) {
            throw new Error("API Key Error.");
        }
        throw error;
    }
}
