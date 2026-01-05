# デザインシステム仕様書

Apple Human Interface Guidelines に基づいた、洗練されたUIデザインシステム

## 目次

1. [カラーシステム](#カラーシステム)
2. [タイポグラフィ](#タイポグラフィ)
3. [余白・間隔](#余白間隔)
4. [角丸](#角丸)
5. [影の効果](#影の効果)
6. [コンポーネント設計](#コンポーネント設計)
7. [アクセシビリティ](#アクセシビリティ)

---

## カラーシステム

### 基本原則

Apple HIG に基づき、視覚的な階層と明瞭性を重視したカラーシステムを採用します。

### セマンティックカラー

```css
/* Primary Colors - ブランドアイデンティティ */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6; /* Main Primary */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;

/* Neutral Colors - テキスト、背景 */
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;
--neutral-950: #020617;

/* Success Colors */
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-700: #15803d;

/* Warning Colors */
--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-700: #b45309;

/* Error Colors */
--error-50: #fef2f2;
--error-500: #ef4444;
--error-700: #b91c1c;
```

### Tailwind CSS クラス

- **Primary**: `bg-blue-500`, `text-blue-500`, `border-blue-500`
- **Neutral**: `bg-slate-500`, `text-slate-500`, `border-slate-500`
- **Success**: `bg-green-500`, `text-green-500`
- **Warning**: `bg-amber-500`, `text-amber-500`
- **Error**: `bg-red-500`, `text-red-500`

---

## タイポグラフィ

### フォントファミリー

Apple のサンセリフフォント哲学に基づき、読みやすさを重視

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
--font-mono: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
```

### フォントスケール

```css
/* Display - 大見出し */
--text-display: 3.75rem; /* 60px */
--text-display-line: 1.1;

/* Heading 1 */
--text-h1: 3rem; /* 48px */
--text-h1-line: 1.2;

/* Heading 2 */
--text-h2: 2.25rem; /* 36px */
--text-h2-line: 1.25;

/* Heading 3 */
--text-h3: 1.875rem; /* 30px */
--text-h3-line: 1.3;

/* Heading 4 */
--text-h4: 1.5rem; /* 24px */
--text-h4-line: 1.4;

/* Body Large */
--text-body-lg: 1.125rem; /* 18px */
--text-body-lg-line: 1.6;

/* Body Default */
--text-body: 1rem; /* 16px */
--text-body-line: 1.6;

/* Body Small */
--text-body-sm: 0.875rem; /* 14px */
--text-body-sm-line: 1.5;

/* Caption */
--text-caption: 0.75rem; /* 12px */
--text-caption-line: 1.4;
```

### フォントウェイト

- **Regular**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Tailwind CSS クラス

```tsx
// Display
<h1 className="text-6xl font-bold leading-tight tracking-tight">

// Heading 1
<h1 className="text-5xl font-bold leading-tight">

// Heading 2
<h2 className="text-4xl font-semibold leading-tight">

// Heading 3
<h3 className="text-3xl font-semibold leading-snug">

// Body
<p className="text-base font-normal leading-relaxed">

// Small
<span className="text-sm font-normal leading-normal">

// Caption
<span className="text-xs font-medium leading-tight text-slate-500">
```

---

## 余白・間隔

### 8ポイントグリッドシステム

Apple HIG の 8pt グリッドシステムを採用

```css
--spacing-0: 0; /* 0px */
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
--spacing-20: 5rem; /* 80px */
--spacing-24: 6rem; /* 96px */
```

### コンポーネント内の余白

- **密**: `p-2` (8px) - 小さいボタン、アイコン
- **標準**: `p-4` (16px) - 通常のボタン、カード内部
- **広**: `p-6` (24px) - カードヘッダー、セクション
- **とても広**: `p-8` (32px) - ページレベルのコンテナ

### 要素間の間隔

- **極小**: `gap-1` (4px) - アイコンとテキストの間
- **小**: `gap-2` (8px) - ボタン内のアイコンとテキスト
- **標準**: `gap-4` (16px) - フォーム要素間
- **大**: `gap-6` (24px) - セクション内要素
- **極大**: `gap-8` (32px) - セクション間

---

## 角丸

### 基本原則

Appleのソフトで親しみやすいデザインに基づく

```css
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px - 小さな要素 */
--radius-md: 0.5rem; /* 8px - ボタン、インプット */
--radius-lg: 0.75rem; /* 12px - カード */
--radius-xl: 1rem; /* 16px - 大きなカード */
--radius-2xl: 1.5rem; /* 24px - モーダル */
--radius-3xl: 2rem; /* 32px - ヒーローセクション */
--radius-full: 9999px; /* 円形 - アバター、バッジ */
```

### Tailwind CSS クラス

- **小さな要素**: `rounded-sm` - タグ、バッジ
- **ボタン・入力**: `rounded-md` または `rounded-lg`
- **カード**: `rounded-lg` または `rounded-xl`
- **モーダル**: `rounded-2xl`
- **円形**: `rounded-full` - アバター、ドット

---

## 影の効果

### レイヤリング原則

Apple の奥行き感を表現する影システム

```css
/* Elevation Levels */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

### 使用ガイドライン

- **Level 1 (xs-sm)**: `shadow-sm` - カード、入力フィールド
- **Level 2 (md)**: `shadow-md` - ホバー時のボタン
- **Level 3 (lg)**: `shadow-lg` - ドロップダウン、ポップオーバー
- **Level 4 (xl-2xl)**: `shadow-xl` または `shadow-2xl` - モーダル、ドロワー

### ダークモード対応

```css
/* ダークモードでの影 */
.dark {
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
}
```

---

## コンポーネント設計

### ボタン (Button)

#### Primary Button

```tsx
<button
  className="
  inline-flex items-center justify-center gap-2
  px-6 py-3
  rounded-lg
  bg-blue-500 hover:bg-blue-600 active:bg-blue-700
  text-white font-semibold text-base
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
"
>
  Primary Action
</button>
```

#### Secondary Button

```tsx
<button
  className="
  inline-flex items-center justify-center gap-2
  px-6 py-3
  rounded-lg
  bg-slate-100 hover:bg-slate-200 active:bg-slate-300
  dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600
  text-slate-900 dark:text-slate-100 font-semibold text-base
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
"
>
  Secondary Action
</button>
```

#### Ghost Button

```tsx
<button
  className="
  inline-flex items-center justify-center gap-2
  px-4 py-2
  rounded-md
  bg-transparent hover:bg-slate-100 active:bg-slate-200
  dark:hover:bg-slate-800 dark:active:bg-slate-700
  text-slate-700 dark:text-slate-300 font-medium text-sm
  transition-all duration-150 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2
"
>
  Ghost Action
</button>
```

### カード (Card)

```tsx
<div
  className="
  rounded-xl
  bg-white dark:bg-slate-800
  border border-slate-200 dark:border-slate-700
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-out
  overflow-hidden
"
>
  <div className="p-6 space-y-4">
    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Card Title</h3>
    <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">Card content goes here.</p>
  </div>
</div>
```

### 入力フィールド (Input)

```tsx
<div className="space-y-2">
  <label
    className="
    block text-sm font-medium
    text-slate-700 dark:text-slate-300
  "
  >
    Label
  </label>
  <input
    className="
    w-full px-4 py-3
    rounded-lg
    bg-white dark:bg-slate-800
    border border-slate-300 dark:border-slate-600
    text-slate-900 dark:text-slate-100
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    shadow-sm
    transition-all duration-150 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
  "
  />
</div>
```

### モーダル (Modal/Dialog)

```tsx
<div
  className="
  fixed inset-0 z-50
  bg-black/50 backdrop-blur-sm
  flex items-center justify-center p-4
"
>
  <div
    className="
    w-full max-w-lg
    rounded-2xl
    bg-white dark:bg-slate-800
    shadow-2xl
    overflow-hidden
    transform transition-all duration-300 ease-out
  "
  >
    <div className="p-6 space-y-6">{/* Modal content */}</div>
  </div>
</div>
```

### バッジ (Badge)

```tsx
<span
  className="
  inline-flex items-center gap-1
  px-2.5 py-1
  rounded-full
  bg-blue-100 dark:bg-blue-900/30
  text-blue-700 dark:text-blue-300
  text-xs font-medium
"
>
  Badge
</span>
```

---

## アクセシビリティ

### 色のコントラスト

- **テキスト (通常)**: 最小コントラスト比 4.5:1
- **テキスト (大きい)**: 最小コントラスト比 3:1
- **UIコンポーネント**: 最小コントラスト比 3:1

### フォーカス管理

```tsx
// すべてのインタラクティブ要素に適用
className="
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
  dark:focus-visible:ring-offset-slate-900
"
```

### キーボードナビゲーション

- すべてのインタラクティブ要素は Tab キーでアクセス可能
- `tabIndex` を適切に設定
- カスタムコンポーネントには適切な ARIA 属性を付与

### スクリーンリーダー対応

```tsx
// アイコンのみのボタン
<button aria-label="閉じる">
  <X className="w-5 h-5" />
</button>

// 視覚的に隠すがスクリーンリーダーには読み上げ
<span className="sr-only">詳細な説明</span>
```

### モーション配慮

```css
/* ユーザーがモーションを減らす設定をしている場合 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### タッチターゲットサイズ

- **最小サイズ**: 44×44 ピクセル (iOS HIG)
- **推奨サイズ**: 48×48 ピクセル以上

```tsx
// タッチフレンドリーなボタン
<button className="min-h-[44px] min-w-[44px] p-3">Action</button>
```

---

## まとめ

このデザインシステムは、Apple Human Interface Guidelines の原則に基づき、以下を実現します：

1. **明瞭性**: コンテンツを最優先し、明確な視覚的階層
2. **一貫性**: プラットフォーム全体で統一されたデザイン言語
3. **洗練性**: 美しく、機能的で、直感的なインターフェース
4. **アクセシビリティ**: すべてのユーザーが利用可能

Tailwind CSS と shadcn/ui を活用することで、このデザインシステムを効率的に実装し、保守することができます。
