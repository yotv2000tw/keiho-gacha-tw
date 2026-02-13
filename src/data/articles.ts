import rawKeihoData from "../../extract/keiho.json";
import rawKenpoData from "../../extract/kenpo.json";
// 臺灣資料（轉換後）
import rawTwKeihoData from "../../extract/tw_keiho.json";
import rawTwKenpoData from "../../extract/tw_kenpo.json";
import rawTwKenpoAddData from "../../extract/tw_kenpo_add.json";

export type Article = {
  title: string;
  caption: string;
  text: string;
  doc?: string; // 可選：表示來源文件（例如 中華民國憲法 / 增修條文）
};

export const keihoArticles = rawKeihoData as Article[];
export const kenpoArticles = rawKenpoData as Article[];

// 臺灣版本匯出：可在 App 中切換使用
export const twKeihoArticles = rawTwKeihoData as Article[];
export const twKenpoArticles = rawTwKenpoData as Article[];
export const twKenpoAddArticles = rawTwKenpoAddData as Article[];

// 範例：合併憲法主文與增修條文（如需單一陣列）
export const twKenpoCombined = [...twKenpoArticles, ...twKenpoAddArticles];
