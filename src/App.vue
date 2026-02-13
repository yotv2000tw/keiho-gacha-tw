<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  keihoArticles,
  kenpoArticles,
  twKeihoArticles,
  twKenpoCombined,
  type Article,
} from "./data/articles";
import { randBetween } from "./math";

type GachaResult = {
  roll: number;
  type: "keiho" | "kenpo";
  article: Article;
  source: "jp" | "tw";
  id: string;
};

type GachaLog = {
  id: number;
  count: number;
  lawLabel: string;
  source: "jp" | "tw";
  results: GachaResult[];
};

const results = ref<GachaResult[]>([]);
const logs = ref<GachaLog[]>([]);
const isKenpoMode = ref(false);
const dataSource = ref<"jp" | "tw">("jp");
let nextLogId = 1;
const targetLawLabel = computed(() => (isKenpoMode.value ? "憲法" : "刑法"));
const dataSourceLabel = computed(() => (dataSource.value === "tw" ? "台灣" : "日本"));
const localeIsTW = computed(() => dataSource.value === "tw");

const ui = {
  headerTitle: computed(() =>
    localeIsTW.value
      ? `廢除 ${targetLawLabel.value} 隨機條文黨`
      : `${targetLawLabel.value}のランダムな条文を廃止する党`,
  ),
  subText: computed(() =>
    localeIsTW.value
      ? `按下按鈕抽取並廢除 ${targetLawLabel.value} 吧！`
      : `ボタンを押して${targetLawLabel.value}を廃止しよう！`,
  ),
  authorLabel: computed(() => (localeIsTW.value ? "作者：" : "作った人：")),
  toolsSuffix: computed(() => (localeIsTW.value ? "（與 Codex CLI）" : "（とCodex CLI）")),
  sourceCodeLabel: computed(() => (localeIsTW.value ? "原始碼：" : "ソースコード：")),
  originalLabel: computed(() => (localeIsTW.value ? "靈感來源：" : "元ネタ：")),
  // Fork notice / repo info
  forkNoticeTitle: computed(() =>
    localeIsTW.value
      ? "本項目 Fork 自 sevenc-nanashi/keiho-gacha"
      : "本プロジェクトは sevenc-nanashi/keiho-gacha をフォークしています。",
  ),
  forkRepoLabel: computed(() => (localeIsTW.value ? "原始碼：" : "ソースコード：")),
  noteText: computed(() =>
    localeIsTW.value
      ? "※這是個娛樂用的小程式，與實際修法並無任何關聯。"
      : "※これはジョークアプリです。実際の法改正には関係ありません。",
  ),
  copyButton: computed(() => (localeIsTW.value ? "複製" : "コピー")),
  docPrefix: computed(() => (localeIsTW.value ? "（來源：" : "（出典：")),
  historyLabel: computed(() => (localeIsTW.value ? "過去的抽取記錄" : "過去のガチャログ")),
  targetLawLabelLocal: computed(() => (localeIsTW.value ? targetLawLabel.value : targetLawLabel.value)),
  selectorLabel: computed(() => (localeIsTW.value ? "資料來源" : "データソース")),
  sourceOptionLabel: (val: "jp" | "tw") =>
    dataSource.value === "tw" ? (val === "jp" ? "日本" : "台灣") : val === "jp" ? "日本" : "台湾",
  switchLabel: computed(() => (localeIsTW.value ? "選擇法令" : "対象法令")),
  emptyHint: computed(() => (localeIsTW.value ? "尚未抽取" : "まだ引いていません")),
  shareLabel: computed(() => (localeIsTW.value ? "分享宣言：" : "マニフェストを共有する：")),
  copySuccess: computed(() => (localeIsTW.value ? "已複製到剪貼簿！" : "マニフェストの内容をクリップボードにコピーしました！")),
  copyFail: computed(() => (localeIsTW.value ? "複製失敗。" : "クリップボードへのコピーに失敗しました。")),
  errorDataFetch: computed(() => (localeIsTW.value ? "無法取得法令條文資料。" : "法令条文データの取得に失敗しました")),
};
const targetArticles = computed(() => {
  if (dataSource.value === "tw") {
    return isKenpoMode.value ? twKenpoCombined : twKeihoArticles;
  }
  return isKenpoMode.value ? kenpoArticles : keihoArticles;
});

const twitterLink = computed(() => {
  const baseUrl = "https://twitter.com/intent/tweet";
  const target = isKenpoMode.value ? "憲法" : "刑法";
  let text = "";

  const sourcePrefix = dataSource.value === 'tw'
    ? (localeIsTW.value ? '廢除台灣的' : '台湾の')
    : (localeIsTW.value ? '廢除日本的' : '日本国の');

  if (localeIsTW.value && isKenpoMode.value) {
    const groups: Record<string, GachaResult[]> = {};
    for (const r of results.value) {
      const key = r.article.doc ?? "中華民國憲法";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    const parts: string[] = [];
    const mainKey = "中華民國憲法";
    if (groups[mainKey] && groups[mainKey].length > 0) {
      const sorted = sortResultsByOrder(groups[mainKey]);
      parts.push(`#中華民國憲法 ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
    }
    const addKey = "中華民國憲法增修條文";
    if (groups[addKey] && groups[addKey].length > 0) {
      const sorted = sortResultsByOrder(groups[addKey]);
      parts.push(`#中華民國憲法增修條文 ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
    }
    for (const k of Object.keys(groups)) {
      if (k !== mainKey && k !== addKey) {
        const sorted = sortResultsByOrder(groups[k]);
        parts.push(`#${k} ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
      }
    }
    if (parts.length > 0) {
      text = `${sourcePrefix} #${target} 隨機條文黨，在此宣告廢止 ${parts.join("，以及 ")}`;
    } else {
      text = `${sourcePrefix} #${target} 隨機條文黨，在此宣告廢止`;
    }
  } else if (localeIsTW.value) {
    const sorted = sortResultsByOrder(results.value);
    text = `${sourcePrefix} #${target} 隨機條文黨，在此宣告廢止 ${sorted.map((r) => formatArticleForLocale(r.article)).join("、")}`;
  } else {
    const jpPrefix = dataSource.value === 'tw' ? '台湾の' : '日本国の';
    const sorted = sortResultsByOrder(results.value);
    text = `${jpPrefix}#${target}のランダムな条文を廃止する党 は、${target}の${sorted
      .map((r) => (r.article.caption ? `${r.article.title}（${r.article.caption}）` : r.article.title))
      .join("、")}を廢止することを宣言いたします。`;
  }

  const url = encodeURIComponent(location.href);
  return `${baseUrl}?text=${encodeURIComponent(text)}&url=${url}`;
});
const clipboardText = computed(() => {
  const target = isKenpoMode.value ? "憲法" : "刑法";
  const sourcePrefix = dataSource.value === 'tw' ? (localeIsTW.value ? '台灣' : '台湾の') : (localeIsTW.value ? '日本' : '日本の');

  if (localeIsTW.value && isKenpoMode.value) {
    const groups: Record<string, GachaResult[]> = {};
    for (const r of results.value) {
      const key = r.article.doc ?? "中華民國憲法";
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    const parts: string[] = [];
    const mainKey = "中華民國憲法";
    if (groups[mainKey] && groups[mainKey].length > 0) {
      const sorted = sortResultsByOrder(groups[mainKey]);
      parts.push(`#中華民國憲法 ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
    }
    const addKey = "中華民國憲法增修條文";
    if (groups[addKey] && groups[addKey].length > 0) {
      const sorted = sortResultsByOrder(groups[addKey]);
      parts.push(`#中華民國憲法增修條文 ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
    }
    for (const k of Object.keys(groups)) {
      if (k !== mainKey && k !== addKey) {
        const sorted = sortResultsByOrder(groups[k]);
        parts.push(`#${k} ${sorted.map((g) => formatArticleForLocale(g.article)).join("、")}`);
      }
    }
    if (parts.length > 0) {
      return `#廢除${sourcePrefix}${target}隨機條文黨，在此宣告廢止 ${parts.join("，以及 ")}。`;
    }
    return `#廢除${sourcePrefix}${target}隨機條文黨，在此宣告廢止。`;
  }

  if (localeIsTW.value) {
    const sorted = sortResultsByOrder(results.value);
    return `#廢除${sourcePrefix}${target}隨機條文黨，在此宣告廢止 ${sorted.map((r) => formatArticleForLocale(r.article)).join("、")}。`;
  }

  const jpPrefix = dataSource.value === 'tw' ? '台湾の' : '日本の';
  const sorted = sortResultsByOrder(results.value);
  return `${jpPrefix} #${target}のランダムな条文を廃止する党 は、${target}の${sorted
    .map((r) => (r.article.caption ? `${r.article.title}（${r.article.caption}）` : r.article.title))
    .join("、")}を廢止することを宣言いたします。`;
});
// helper: convert kanji numerals to number (supports 万/億/千/百/十)
const kanjiToNumber = (s: string): number => {
  if (!s) return 0;
  const map: Record<string, number> = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000, 万: 10000, 萬: 10000, 億: 100000000 };

  // remove non-kanji numerals
  let num = 0;
  let section = 0;
  let number = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (map[ch] !== undefined) {
      number = map[ch];
    } else if (units[ch] !== undefined) {
      const unit = units[ch];
      if (unit >= 10000) {
        section = (section + (number || 1)) * unit;
        num += section;
        section = 0;
      } else {
        section += (number || 1) * unit;
      }
      number = 0;
    } else {
      // ignore
    }
  }
  return num + section + number;
};

const extractNumericOrder = (title: string): number => {
  if (!title) return 0;
  // try arabic digits first, support ranges like 91-1 -> use 91 or 91-1 numeric value by removing hyphen
  const m = title.match(/(\d+[\-\d]*)/);
  if (m) {
    const raw = m[1];
    // for ranges like 91-1, remove non-digits and use leading number as order
    const leading = raw.split("-")[0];
    return parseInt(leading, 10) || 0;
  }
  // try extracting kanji between 第 and 条/條
  const m2 = title.match(/第([^条條]+)[条條]/);
  if (m2) {
    return kanjiToNumber(m2[1]);
  }
  // fallback: try any continuous kanji numerals
  const onlyKanji = title.replace(/[^零〇一二三四五六七八九十百千萬万億]/g, "");
  if (onlyKanji) return kanjiToNumber(onlyKanji);
  return 0;
};

const getArticleOrder = (article: Article): number => {
  // prefer explicit order field if present
  // @ts-ignore
  if ((article as any).order !== undefined) return (article as any).order as number;
  return extractNumericOrder(article.title || "");
};

const formatArticleForLocale = (article: Article): string => {
  const order = getArticleOrder(article);
  if (localeIsTW.value) {
    // Taiwan style: 第 N 條 (use Arabic numerals)
    if (order > 0) return `第 ${order} 條` + (article.caption ? `（${article.caption}）` : "");
    return article.title + (article.caption ? `（${article.caption}）` : "");
  }
  // Japanese: keep original title and caption
  return article.caption ? `${article.title}（${article.caption}）` : article.title;
};

const sortResultsByOrder = (arr: GachaResult[]) => {
  return [...arr].sort((a, b) => getArticleOrder(a.article) - getArticleOrder(b.article));
};
const misskeyLink = computed(() => {
  const baseUrl = "https://misskeyshare.link/share.html";
  const text = clipboardText.value;
  return `${baseUrl}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(
    location.href,
  )}`;
});
const copyToClipboard = (): void => {
  navigator.clipboard.writeText(clipboardText.value).then(
    () => {
      alert(ui.copySuccess.value);
    },
    () => {
      alert(ui.copyFail.value);
    },
  );
};

const draw = (count: number): void => {
  const nextResults: GachaResult[] = [];

  for (let i = 0; i < count; i += 1) {
    const randomIndex = Math.floor(Math.random() * targetArticles.value.length);
    const article = targetArticles.value[randomIndex];

    if (article === undefined) {
      const errMsg = ui.errorDataFetch.value;
      alert(errMsg);
      throw new Error(errMsg);
    }

    nextResults.push({
      roll: i + 1,
      type: isKenpoMode.value ? "kenpo" : "keiho",
      source: dataSource.value,
      article,
      id: crypto.randomUUID(),
    });
  }

  results.value = nextResults;
  // vueはunshiftをリアクティブに検知しないため、新しい配列を作成して代入する
  logs.value = [
    {
      id: nextLogId,
      count,
      lawLabel: targetLawLabel.value,
      source: dataSource.value,
      results: nextResults,
    },
    ...logs.value,
  ];
  nextLogId += 1;
};

// 切換資料來源時清空目前的抽取紀錄，避免混淆
watch(dataSource, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    results.value = [];
    logs.value = [];
    nextLogId = 1;
  }
});

// 切換法令（刑法 <-> 憲法）時，只清空上方當前的抽出結果，但保留歷史紀錄
watch(isKenpoMode, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    results.value = [];
  }
});

const keihoMultiGachaTextsJP = ["激アツ！", "出血大サービス！", "法改正の嵐！"];
const kenpoMultiGachaTextsJP = ["激アツ！", "出血大サービス！", "国民投票の嵐！"];
const kenpoWithout96GachaTextsJP = ["激アツ！", "出血大サービス！", "憲法改正の嵐！"];

const keihoMultiGachaTextsTW = ["超激熱！", "大放送！", "修法風暴！"];
const kenpoMultiGachaTextsTW = ["超激熱！", "大放送！", "公投風暴！"];
const kenpoWithout96GachaTextsTW = ["超激熱！", "大放送！", "憲法修正風暴！"];

const multiGachaText = ref(keihoMultiGachaTextsJP[0]);
watch(
  [isKenpoMode, logs],
  () => {
      const texts = (() => {
        if (isKenpoMode.value) {
          const has96 = logs.value.some((log) =>
            log.results.some(
              (result) => result.type === "kenpo" && result.article.title === "第九十六条",
            ),
          );
          if (dataSource.value === "tw") {
            return has96 ? kenpoWithout96GachaTextsTW : kenpoMultiGachaTextsTW;
          }
          return has96 ? kenpoWithout96GachaTextsJP : kenpoMultiGachaTextsJP;
        }

        return dataSource.value === "tw" ? keihoMultiGachaTextsTW : keihoMultiGachaTextsJP;
      })();
      multiGachaText.value = texts[randBetween(0, texts.length - 1)];
  },
  { immediate: true },
);
</script>

<template>
  <main class="container">
    <header class="hero">
      <h1>{{ ui.headerTitle.value }}</h1>
      <p>{{ ui.subText.value }}</p>
      <div class="original-info" aria-label="original-info">
        <p>
          <strong>{{ ui.authorLabel.value }}</strong>
          Nanashi.<span class="tools-suffix">{{ ui.toolsSuffix.value }}</span>
        </p>
        <p>
          <strong>{{ ui.sourceCodeLabel.value }}</strong>
          <a href="https://github.com/sevenc-nanashi/keiho-gacha" target="_blank" rel="noopener noreferrer">sevenc-nanashi/keiho-gacha</a>
        </p>
        <p>
          <strong>{{ ui.originalLabel.value }}</strong>
          <a href="https://twitter.com/windymelt/status/2021908111066632317" target="_blank" rel="noopener noreferrer">Windymelt</a>
        </p>
        <p class="note">{{ ui.noteText.value }}</p>
      </div>

      <div class="fork-info" aria-label="fork-notice">
        <p>
          <strong>{{ ui.forkNoticeTitle.value }}</strong>
        </p>
        <p>
          <strong>{{ ui.forkRepoLabel.value }}</strong>
          <a href="https://github.com/yotv2000tw/keiho-gacha-tw" target="_blank" rel="noopener noreferrer">yotv2000tw/keiho-gacha-tw</a>
        </p>
      </div>
      
    </header>
        <section class="source-selector" :aria-label="ui.selectorLabel.value">
          <label>
              <strong>{{ ui.selectorLabel.value }}</strong>
              <select v-model="dataSource">
                <option value="jp">{{ ui.sourceOptionLabel('jp') }}</option>
                <option value="tw">{{ ui.sourceOptionLabel('tw') }}</option>
              </select>
            </label>
        </section>

    <section class="law-selector" :aria-label="ui.switchLabel.value">
      <label class="switch">
      <span class="switch-label">{{ ui.switchLabel.value }}</span>
        <input
          v-model="isKenpoMode"
          class="switch-input"
          type="checkbox"
          role="switch"
          :aria-checked="isKenpoMode"
          :aria-label="localeIsTW ? `切換選擇法令為 ${targetLawLabel}` : `対象法令を${targetLawLabel}に切り替え`"
        />
        <span class="switch-slider" aria-hidden="true"></span>
        <span class="switch-value">{{ targetLawLabel }}</span>
      </label>
    </section>

    <section class="actions" aria-label="ガチャ操作">
      <button type="button" class="button" @click="draw(1)">1連</button>
      <button type="button" class="button primary" @click="draw(10)">
        {{ multiGachaText }} 10連
      </button>
    </section>

    <section class="results" aria-live="polite">
      <p v-if="results.length === 0" class="hint">{{ ui.emptyHint.value }}</p>
      <template v-else>
        <div class="share-results">
          {{ ui.shareLabel.value }}
          <a
            :href="twitterLink"
            target="_blank"
            rel="noopener noreferrer"
            class="twitter-button"
          >
            Twitter
          </a>
          <a
            :href="misskeyLink"
            target="_blank"
            rel="noopener noreferrer"
            class="misskey-button"
          >
            Misskey
          </a>
          <button type="button" class="copy-button" @click="copyToClipboard">
            {{ ui.copyButton.value }}
          </button>
        </div>
        <ol>
          <li v-for="result in results" :key="result.id">
            <article class="card latest-result">
              <p class="roll">{{ localeIsTW ? `第${result.roll}抽` : `${result.roll}連目` }}</p>
              <h2>
                {{ result.article.title }}
                <span v-if="result.article.caption" class="caption"
                  >- {{ result.article.caption }}
                </span>
                <span v-if="isKenpoMode && result.article.doc" class="caption">{{ ui.docPrefix.value }}{{ result.article.doc }}）</span>
                <span class="source-badge">
                  {{ result.source === 'tw' ? (localeIsTW ? '台灣' : '台湾') : (localeIsTW ? '日本' : '日本') }}
                </span>
              </h2>
              <p class="result-content">{{ result.article.text }}</p>
            </article>
          </li>
        </ol>
      </template>
    </section>

      <section
      v-if="logs.length > 0"
      class="history"
      :aria-label="ui.historyLabel.value"
    >
      <h2>{{ ui.historyLabel.value }}</h2>
      <ol class="history-list">
        <li v-for="log in logs" :key="log.id" class="history-item">
          <p class="history-meta">
            {{ localeIsTW ? `第${log.id}次（${log.lawLabel} / ${log.count}抽 / 資料來源：${log.source === 'tw' ? '台灣' : '日本'}）` : `第${log.id}回（${log.lawLabel} / ${log.count}連 / データソース：${log.source === 'tw' ? '台灣' : '日本'}）` }}
          </p>
          <ul class="history-results">
            <li v-for="result in log.results" :key="result.id">
              {{ localeIsTW ? `第${result.roll}抽：` : `${result.roll}連目:` }} {{ result.article.title }}
              {{ result.article.caption ? "- " + result.article.caption : "" }}
            </li>
          </ul>
        </li>
      </ol>
    </section>
  </main>
</template>

<style scoped>
.latest-result {
  transition: border-color 0.3s ease-in-out;

  @starting-style {
    border-color: #ff9800;
  }
}

.share-results {
  margin-bottom: 1rem;

  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  a,
  button {
    display: block;
    box-sizing: border-box;
    text-decoration: none;
    align-content: center;
    padding: 0 1rem;
    border: none;
    border-radius: 4px;
    height: 2.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
}
.twitter-button {
  background-color: #1da1f2;
  color: #ffffff;
}
.misskey-button {
  background-color: #4caf50;
  color: #ffffff;
}
.copy-button {
  background-color: #cccc44;
  color: #ffffff;
}
.source-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: #ff9800;
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.08);
}
.fork-info {
  margin-top: 0.5rem;
  padding: 0.6rem 0.8rem;
  background: #f7f7f8;
  border-left: 4px solid #ff9800;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #333;
}
.fork-info p {
  margin: 0.25rem 0;
}
.fork-info a {
  color: #1a73e8;
  text-decoration: none;
}
.fork-info .note-small {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}
.tools-suffix {
  margin-left: 0.4rem;
  color: #444;
  font-weight: 500;
}
</style>
