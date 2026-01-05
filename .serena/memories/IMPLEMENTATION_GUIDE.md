# デザインシステム実装ガイド

このドキュメントでは、Apple Human Interface Guidelines に基づいたデザインシステムの実装例を紹介します。

## 実装済みコンポーネント

### 1. Button コンポーネント

#### 基本的な使用方法

```tsx
import { Button } from "@/components/ui"

// Primary Button (デフォルト)
<Button>Primary Action</Button>

// Secondary Button
<Button variant="secondary">Secondary Action</Button>

// Ghost Button
<Button variant="ghost">Ghost Action</Button>

// Success Button
<Button variant="success">Success</Button>

// Warning Button
<Button variant="warning">Warning</Button>

// Destructive Button
<Button variant="destructive">Delete</Button>

// Outline Button
<Button variant="outline">Outline</Button>

// Link Button
<Button variant="link">Link</Button>
```

#### サイズバリエーション

```tsx
// Small
<Button size="sm">Small</Button>

// Default
<Button size="default">Default</Button>

// Large
<Button size="lg">Large</Button>

// Extra Large
<Button size="xl">Extra Large</Button>

// Icon Button
<Button size="icon">
  <Icon className="w-5 h-5" />
</Button>
```

#### アイコン付きボタン

```tsx
import { ChevronRight } from "lucide-react"
;<Button>
  続ける
  <ChevronRight className="w-4 h-4" />
</Button>
```

---

### 2. Card コンポーネント

#### 基本的な使用方法

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui"
;<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content of the card.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### インタラクティブなカード

```tsx
<Card className="hover:shadow-lg cursor-pointer transition-all">
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>このカードはクリック可能です</p>
  </CardContent>
</Card>
```

---

### 3. Input コンポーネント

#### 基本的な使用方法

```tsx
import { Input, Label } from "@/components/ui"
;<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="name@example.com" />
</div>
```

#### フォーム全体の例

```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">お名前</Label>
    <Input id="name" placeholder="山田 太郎" />
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">メールアドレス</Label>
    <Input id="email" type="email" placeholder="yamada@example.com" />
  </div>

  <Button type="submit" className="w-full">
    送信
  </Button>
</form>
```

---

### 4. Textarea コンポーネント

```tsx
import { Textarea, Label } from "@/components/ui"
;<div className="space-y-2">
  <Label htmlFor="message">メッセージ</Label>
  <Textarea id="message" placeholder="メッセージを入力してください" rows={4} />
</div>
```

---

### 5. Dialog コンポーネント

#### 基本的な使用方法

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button
} from "@/components/ui"
;<Dialog>
  <DialogTrigger asChild>
    <Button>モーダルを開く</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>確認</DialogTitle>
      <DialogDescription>この操作を実行してもよろしいですか？</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">キャンセル</Button>
      <Button>確認</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 6. Badge コンポーネント

#### 基本的な使用方法

```tsx
import { Badge } from "@/components/ui"

// Default Badge
<Badge>New</Badge>

// Success Badge
<Badge variant="success">完了</Badge>

// Warning Badge
<Badge variant="warning">注意</Badge>

// Error Badge
<Badge variant="error">エラー</Badge>

// Outline Badge
<Badge variant="outline">枠線</Badge>
```

#### 使用例

```tsx
<div className="flex items-center gap-2">
  <h3 className="text-lg font-semibold">タスク名</h3>
  <Badge variant="success">完了</Badge>
</div>
```

---

## カラーシステムの使用方法

### セマンティックカラー

```tsx
// Primary colors
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Primary Background
</div>

// Success colors
<div className="bg-success-500 text-white p-4 rounded-lg">
  Success Message
</div>

// Warning colors
<div className="bg-warning-500 text-white p-4 rounded-lg">
  Warning Message
</div>

// Error colors
<div className="bg-error-500 text-white p-4 rounded-lg">
  Error Message
</div>
```

### Neutral colors（背景とテキスト）

```tsx
// Light backgrounds
<div className="bg-slate-50 text-slate-900 p-4 rounded-lg">
  Light Background
</div>

// Dark backgrounds
<div className="bg-slate-900 text-slate-50 p-4 rounded-lg">
  Dark Background
</div>

// Muted text
<p className="text-muted-foreground">
  これは控えめなテキストです
</p>
```

---

## タイポグラフィの使用方法

### 見出し

```tsx
// Display - 最大の見出し
<h1 className="text-6xl font-bold leading-tight tracking-tight">
  Display Heading
</h1>

// Heading 1
<h1 className="text-5xl font-bold leading-tight">
  Main Heading
</h1>

// Heading 2
<h2 className="text-4xl font-semibold leading-tight">
  Section Heading
</h2>

// Heading 3
<h3 className="text-3xl font-semibold leading-snug">
  Subsection Heading
</h3>

// Heading 4
<h4 className="text-2xl font-semibold leading-snug">
  Small Heading
</h4>
```

### 本文

```tsx
// Body Large
<p className="text-lg leading-relaxed">
  大きめの本文テキスト
</p>

// Body Default
<p className="text-base leading-relaxed">
  通常の本文テキスト
</p>

// Body Small
<p className="text-sm leading-normal">
  小さめの本文テキスト
</p>

// Caption
<span className="text-xs font-medium text-muted-foreground">
  キャプションテキスト
</span>
```

---

## レイアウトと余白

### 8ポイントグリッドシステム

```tsx
// 密なレイアウト
<div className="p-2 space-y-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// 標準的なレイアウト
<div className="p-4 space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// 広いレイアウト
<div className="p-6 space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// とても広いレイアウト
<div className="p-8 space-y-8">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Flexbox レイアウト

```tsx
// 横並びで間隔を開ける
<div className="flex items-center gap-4">
  <Button>ボタン1</Button>
  <Button>ボタン2</Button>
</div>

// 中央揃え
<div className="flex items-center justify-center min-h-screen">
  <Card>
    <CardContent>
      中央に配置されたコンテンツ
    </CardContent>
  </Card>
</div>

// 両端揃え
<div className="flex items-center justify-between p-4">
  <h3 className="text-lg font-semibold">タイトル</h3>
  <Button size="sm">アクション</Button>
</div>
```

---

## 影の効果

```tsx
// レベル1: 小さな影（カード）
<div className="shadow-sm p-4 rounded-lg bg-white">
  Light Shadow
</div>

// レベル2: 中程度の影（ホバー時）
<div className="shadow-md p-4 rounded-lg bg-white hover:shadow-lg transition-shadow">
  Medium Shadow
</div>

// レベル3: 大きな影（ドロップダウン）
<div className="shadow-lg p-4 rounded-lg bg-white">
  Large Shadow
</div>

// レベル4: とても大きな影（モーダル）
<div className="shadow-2xl p-6 rounded-2xl bg-white">
  Extra Large Shadow
</div>
```

---

## アニメーション

### フェードイン

```tsx
<div className="animate-fade-in">フェードインするコンテンツ</div>
```

### スライドイン

```tsx
// 上からスライドイン
<div className="animate-slide-in-from-top">
  上からスライドイン
</div>

// 下からスライドイン
<div className="animate-slide-in-from-bottom">
  下からスライドイン
</div>
```

### スケールイン

```tsx
<div className="animate-scale-in">スケールインするコンテンツ</div>
```

---

## アクセシビリティのベストプラクティス

### フォーカス管理

すべてのインタラクティブ要素は自動的にフォーカス可能で、視覚的なフォーカスリングが表示されます。

```tsx
// フォーカススタイルが自動的に適用される
<Button>アクセシブルなボタン</Button>

// カスタムフォーカススタイル
<div className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
  Custom Focus Style
</div>
```

### スクリーンリーダー対応

```tsx
// アイコンのみのボタンにラベルを付ける
<Button size="icon" aria-label="メニューを開く">
  <MenuIcon className="w-5 h-5" />
</Button>

// 視覚的に隠すがスクリーンリーダーには読み上げる
<span className="sr-only">追加情報</span>
```

### カラーコントラスト

デザインシステムのカラーパレットは、WCAG 2.1 AA 基準（4.5:1）を満たすように設計されています。

```tsx
// 良いコントラスト
<div className="bg-slate-900 text-slate-50">
  高コントラスト (推奨)
</div>

// 注意が必要
<div className="bg-slate-300 text-slate-400">
  低コントラスト (避ける)
</div>
```

---

## レスポンシブデザイン

### ブレークポイント

```tsx
// モバイルファースト
<div className="
  p-4           /* mobile */
  md:p-6        /* tablet */
  lg:p-8        /* desktop */
">
  レスポンシブなパディング
</div>

// テキストサイズ
<h1 className="
  text-3xl      /* mobile */
  md:text-4xl   /* tablet */
  lg:text-5xl   /* desktop */
">
  レスポンシブな見出し
</h1>

// レイアウト
<div className="
  flex flex-col         /* mobile: 縦並び */
  md:flex-row           /* tablet以上: 横並び */
  gap-4
">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 完全な実装例

### ログインフォーム

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label
} from "@/components/ui"

export function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" type="email" placeholder="name@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full">ログイン</Button>
          <Button variant="ghost" className="w-full">
            パスワードをお忘れですか？
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
```

### ダッシュボード統計カード

```tsx
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"

export function StatsCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">総ユーザー数</CardTitle>
            <Badge variant="success">+12%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground mt-2">前月比 +145人</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">アクティブユーザー</CardTitle>
            <Badge variant="success">+8%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">892</div>
          <p className="text-xs text-muted-foreground mt-2">前月比 +67人</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">新規登録</CardTitle>
            <Badge variant="warning">-3%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">56</div>
          <p className="text-xs text-muted-foreground mt-2">前月比 -2人</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## まとめ

このデザインシステムは、Apple Human Interface Guidelines の原則に基づき、以下を実現します：

- **明瞭性**: 直感的で理解しやすいインターフェース
- **一貫性**: すべてのコンポーネントで統一されたデザイン言語
- **洗練性**: 美しく、機能的で、親しみやすいデザイン
- **アクセシビリティ**: すべてのユーザーが快適に利用できる

Tailwind CSS と shadcn/ui を活用することで、この体系を効率的に実装・保守できます。
