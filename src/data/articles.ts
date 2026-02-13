import rawData from "../../extract/keiho.json";

export type KeihoArticle = {
  title: string;
  caption: string;
  text: string;
};

export const keihoArticles = rawData as KeihoArticle[];
