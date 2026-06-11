# 毎日ニュースまとめ（PWA）

直近24時間の主要ニュースをテーマ別に自動要約し、スマホで読めるPWA（ホーム画面に追加できるWebアプリ）です。

## 仕組み
- **自動更新**: スケジュールタスク `daily-news-digest` が **毎日 約10:00 / 約22:00（JST）** に実行され、
  ニュースを収集・要約して `data.json` を更新します。
  - ※ Claudeアプリが開いている時に実行されます。閉じていた場合は次回起動時にまとめて実行されます。
- **表示**: `index.html`（＋`app.js`/`styles.css`）が `data.json` を読み込み、日付タブ・テーマ別アコーディオンで表示。
- **データ追加**: `scripts/add_entry.py` が新エントリを安全に先頭追加（直近60件保持、UTF-8）。

## ファイル構成
```
daily-news/
├── index.html              # 画面
├── styles.css              # スタイル（ダーク/モバイル最適化）
├── app.js                  # 表示ロジック
├── data.json               # ニュースデータ（自動更新される）
├── manifest.webmanifest    # PWA設定
├── sw.js                   # オフライン対応(Service Worker)
├── icon.svg                # アプリアイコン
├── scripts/add_entry.py    # エントリ追加ヘルパー
├── start-server.bat        # ローカル/LAN配信用
└── .nojekyll / .gitignore  # GitHub Pages用
```

---

## スマホで見る方法（3通り）

### A. 同じWi-Fi内で見る（設定不要・すぐ使える）
1. `start-server.bat` をダブルクリック（PCでサーバー起動）。
2. PCで `ipconfig` を実行し「IPv4 アドレス」を確認（例: 10.212.148.29）。
3. スマホのブラウザで `http://(そのIP):8765/` を開く。
   - 例: `http://10.212.148.29:8765/`
   - ※PCの電源が入っていて、同じWi-Fiに繋がっている必要があります。

### B. どこからでも見る（GitHub Pages・無料・推奨）
インターネット上の自分専用URLで、外出先からも閲覧できます。HTTPS対応・検索エンジン非登録(noindex)。
→ 下記「GitHub Pages 公開手順」を参照。

### C. ホーム画面に追加（アプリ化）
AかBでURLを開いた後:
- **iPhone (Safari)**: 共有ボタン → 「ホーム画面に追加」
- **Android (Chrome)**: メニュー → 「アプリをインストール」／「ホーム画面に追加」

---

## GitHub Pages 公開手順（一度だけ）

> 公開されるのは「公開ニュースの要約」だけで、個人情報は含みません。
> ページは noindex 設定で検索エンジンに載りません。

1. **GitHubアカウント**を用意（無料）: https://github.com/signup
2. GitHubで**新しいリポジトリ**を作成（例: `daily-news`、Publicでよい）。
3. PCのこのフォルダで以下を実行（`<ユーザー名>` は自分のGitHubユーザー名）:
   ```powershell
   cd "C:\Users\hirok\OneDrive\Desktop\inventory-system\daily-news"
   git init
   git add .
   git commit -m "init: daily news PWA"
   git branch -M main
   git remote add origin https://github.com/<ユーザー名>/daily-news.git
   git push -u origin main
   ```
   - 初回 push 時にブラウザでGitHubログインを求められます（Git Credential Manager）。一度承認すれば以後は自動です。
4. GitHubのリポジトリ → **Settings → Pages** → Branch を `main` / `/(root)` にして Save。
5. 数分後、`https://<ユーザー名>.github.io/daily-news/` で公開されます。これをスマホで開き、ホーム画面に追加。

設定後は、スケジュールタスクが `data.json` 更新時に**自動で push**するため、公開ページも毎日2回自動更新されます。

---

## 手動で更新したいとき
```powershell
cd "C:\Users\hirok\OneDrive\Desktop\inventory-system\daily-news"
# new_entry.json を用意して:
python scripts/add_entry.py new_entry.json
```

## 内容を調整する（config.json）
`config.json` を編集すると、次回の自動実行から反映されます（再起動不要）。
- `themeCountMin` / `themeCountMax` … テーマ数（例: 5固定にするなら両方 5）
- `pointsPerThemeMin` / `pointsPerThemeMax` … 各テーマの要点数
- `impactLines` … 「影響まとめ」の行数
- `priorityCategories` … 優先する分野（並び順＝おおよその優先度）
- `tone` … 文体の方針
- `extraInstructions` … 自由な追加指示（例:「日本国内のニュースを多めに」）

## 実行時刻・回数を変える
Claudeアプリのサイドバー「**Scheduled**」→ `daily-news-digest` から、時刻変更・一時停止・1日1回への変更が可能です。
（Claudeに「朝だけにして」等と頼んでもOK。現在は cron `3 10,22 * * *` ＝ 約10:00 / 約22:00 JST）
