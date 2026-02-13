import rawKeihoData from "../../extract/keiho.json";
import rawKenpoData from "../../extract/kenpo.json";

export type Article = {
  title: string;
  caption: string;
  text: string;
};

export const keihoArticles = rawKeihoData as Article[];
export const kenpoArticles = rawKenpoData as Article[];
