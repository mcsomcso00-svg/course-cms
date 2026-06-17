# 上線部署指南（Go-Live）

## 一、環境變數（部署時於平台設定）

| 變數 | 來源 / 說明 |
|---|---|
| `DATABASE_URL` | Supabase 交易連接池（port 6543，`?pgbouncer=true`） |
| `DIRECT_URL` | Supabase 連接（migration 用；本機因封鎖 5432 而用 6543，部署主機可用 5432） |
| `AUTH_SECRET` | Auth.js session 加密金鑰（用 `openssl rand -base64 32` 另行產生，勿沿用開發值） |

> `.env` 不會上載（已被 `.gitignore` 排除），須在部署平台手動設定。

## 二、Supabase（正式環境）

- 將 Supabase 專案升級至 **Pro**（每日備份、不會自動暫停）。
- 部署主機選 **亞洲區域**（首爾 / 新加坡），與 Supabase 同區，減少延遲。

## 三、部署步驟（以 Git 推送觸發）

1. 建立 Git repo 並推送本專案。
2. 於部署平台（Vercel / Railway / Render）連接該 repo。
3. 設定上述環境變數。
4. Build command：`npm run build`；Start command：`npm run start`（Vercel 自動處理）。
5. 部署區域選亞洲。
6. 首次部署後，若 schema 有變動，於本機用 `scripts/apply-sql.js` 套用，或在部署主機跑 migration。

## 四、上線前必辦（重要）

- [ ] **真實 SMS**：導師打卡登入目前為「開發模式」會把驗證碼顯示在畫面 —— 任何知道電話號碼的人都能登入。正式上線**必須**接駁 SMS 供應商（Twilio / Vonage），於 `src/app/tutor-login/actions.ts` 的 `sendOtp` 改為實際發送，不再回傳 `devCode`。
- [ ] **身份證號碼加密**：`User.hkid` 目前明文儲存，屬 PDPO 敏感資料，須加密 + 存取控制。
- [ ] **AUTH_SECRET** 換成正式隨機值。
- [ ] **效能 / 正式 build**：用 `npm run build && npm run start` 驗證正式效能。
- [ ] 確認 PDF 字型 `assets/NotoSansTC.otf` 已隨部署打包（`next.config.ts` 已設定 `outputFileTracingIncludes`）。
- [ ] 真實導師個人資料只在 Pro + 備份就緒後才輸入。

## 五、自訂網域

部署後於平台綁定 `cms.stardian.org`（或所需網域），更新 DNS。
