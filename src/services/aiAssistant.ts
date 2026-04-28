import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function getAiHealthAdvice(userPrompt: string, history: any[] = []) {
  try {
    // Fetch menu data
    const menuSnap = await getDocs(collection(db, "menu"));
    const menuData = menuSnap.docs.map(d => {
      const data = d.data();
      return `- ${data.name?.ar || data.name?.en || 'وجبة'}: السعرات: ${data.calories || 0}، بروتين: ${data.protein || 0}، كارب: ${data.carbs || 0}، دهون: ${data.fats || 0}، السعر: ${data.price || 0} JOD. الوصف: ${data.description?.ar || data.description?.en || ''}`;
    }).join("\n");

    // Fetch lab tests
    const labsSnap = await getDocs(collection(db, "labs"));
    const labsData = labsSnap.docs.map(d => {
      const data = d.data();
      return `- ${data.name?.ar || data.name?.en || 'فحص'}: السعر: ${data.price || 0} JOD. الفئة: ${data.category || ''}`;
    }).join("\n");

    // Fetch manual training data from Admin
    const kbSnap = await getDocs(collection(db, "knowledge_base"));
    const kbData = kbSnap.docs.map(d => `السؤال: ${d.data().question}\nالجواب: ${d.data().answer}`).join("\n\n");

    const systemInstruction = `أنت "المساعد الصحي الذكي" لتطبيق NY11 RESTAURANT. 
    مهمتك هي تقديم نصائح صحية ودقيقة بناءً على أحدث الأبحاث العلمية، والإجابة على استفسارات المستخدمين حول الوجبات المتاحة في المطعم والفحوصات المخبرية.
    تحدث بلهجة ودودة واحترافية باللغة العربية. 

    إليك قائمة الوجبات المتاحة حالياً في المطعم:
    ${menuData}

    إليك قائمة الفحوصات المخبرية المتاحة حالياً:
    ${labsData}
    
    استخدم المعلومات التالية كمرجع إضافي عند الرد:
    ${kbData}

    إذا سُئلت عن وجبات، اقترح وجبات صحية من قائمة المطعم المذكورة أعلاه.
    إذا سُئلت عن تحاليل، اقترح التحاليل المناسبة من القائمة أعلاه بناءً على حالة المستخدم.
    لا تقدم نصائح طبية حرجة، وجه المستخدم دائماً لاستشارة الطبيب المختص عند الحاجة.`;

    // Map history to OpenAI format if needed
    const mappedHistory = history.map(item => ({
      role: item.role === "model" ? "assistant" : item.role,
      content: typeof item.parts?.[0]?.text === 'string' ? item.parts[0].text : (item.content || "")
    })).filter(item => item.content);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          ...mappedHistory,
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error: any) {
    console.error("AI Error:", error);
    
    // Handle rate limits (429)
    if (error.message?.includes("429") || error.status === 429) {
      return "عذراً، لقد تم استهلاك الحصة المتاحة للمساعد الذكي حالياً. يرجى المحاولة بعد قليل.";
    }

    return "عذراً، أواجه مشكلة في الاتصال حالياً. حاول مرة أخرى لاحقاً.";
  }
}

