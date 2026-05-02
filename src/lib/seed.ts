import { db } from "./firebase";
import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";

export async function seedDatabase() {
  const menuSnap = await getDocs(collection(db, "menu"));
  if (menuSnap.size > 0) return; // Already seeded

  const batch = writeBatch(db);

  // Category Settings
  const settings = [
    { id: "MENU", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800" },
    { id: "SUPPLEMENTS", image: "https://images.unsplash.com/photo-1593095191071-837c59846171?w=800" },
    { id: "BASIL", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800" }
  ];

  settings.forEach(s => {
    const ref = doc(db, "category_settings", s.id);
    batch.set(ref, s);
  });

  // Store Items (Menu)
  const storeItems = [
    {
      name: { ar: "سلطة السلمون والأفوكادو", en: "Salmon Avocado Salad" },
      description: { ar: "سلمون مشوي مع قطع الأفوكادو الطازجة، الكينوا، والخضروات الورقية بصلصة الليمون والأعشاب.", en: "Grilled salmon with fresh avocado, quinoa, and greens with herb lemon sauce." },
      price: 7.5,
      currency: "JOD",
      calories: 450,
      protein: 32,
      carbs: 18,
      fats: 22,
      ingredients: ["Salmon", "Avocado", "Quinoa"],
      category: "MENU",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: { ar: "واي بروتين (شوكولاتة)", en: "Whey Protein (Chocolate)" },
      description: { ar: "مكمل غذائي غني بالبروتين لدعم نمو العضلات.", en: "High-protein supplement to support muscle growth." },
      price: 45.0,
      currency: "JOD",
      calories: 120,
      protein: 24,
      carbs: 3,
      fats: 1.5,
      category: "SUPPLEMENTS",
      image: "https://images.unsplash.com/photo-1593095191071-837c59846171?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: { ar: "عبوة زيت الريحان المركز", en: "Concentrated Basil Oil" },
      description: { ar: "زيت ريحان طبيعي بجودة عالية جداً للطهي الصحي.", en: "Hyper-natural basil oil for healthy cooking." },
      price: 12.0,
      currency: "JOD",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 14,
      category: "BASIL",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400"
    }
  ];

  storeItems.forEach(item => {
    const ref = doc(collection(db, "menu"));
    batch.set(ref, item);
  });

  // Lab Tests
  const labTests = [
    {
      name: { ar: "تحليل فيتامين د", en: "Vitamin D Test" },
      description: { ar: "فحص شامل لمستوى فيتامين د في الدم لضمان صحة العظام والمناعة.", en: "A comprehensive check for vitamin D levels in the blood for bone health." },
      price: 15.0,
      currency: "JOD",
      category: "VITAMINS",
      image: "https://images.unsplash.com/photo-1579154235602-3c375276277a?auto=format&fit=crop&q=80&w=400"
    }
  ];

  labTests.forEach(test => {
    const ref = doc(collection(db, "labs"));
    batch.set(ref, test);
  });

  await batch.commit();
}
