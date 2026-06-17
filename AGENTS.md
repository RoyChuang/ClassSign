# ClassSign 專案概覽

## 專案簡介

ClassSign 是一個佛堂班會掛號系統，供各單位秘書線上掛號報名，管理員建立班會，報到人員用 QR Code 報到，廚房和統計看板即時顯示人數。

使用者以長者居多，UI 需要字體大、對比清晰、操作簡單。

## 技術棧

- Next.js 16 App Router + React 19 + TypeScript
- MUI 9（UI 元件，主色 #2549E5，乾=藍 #2563EB，坤=粉 #DB2777，報到=綠 #16A34A）
- Supabase（PostgreSQL + Auth + Realtime）
- 版號目前：0.5.46

## 角色與權限

| 角色 | 說明 |
|------|------|
| admin | 建立/管理班會、class_templates、使用者管理，可存取所有單位 |
| secretary | 掛號、名單管理，綁定單位，只能看自己單位的資料 |
| viewer | 唯讀，僅供查看 |

## 頁面對應

| 路徑 | 功能 | 權限 |
|------|------|------|
| `/` | 首頁導覽 | 公開 |
| `/admin` | 班會管理、班別範本 | admin/secretary |
| `/secretary` | 掛號（新增/刪除/換班別）、匯入歷史名單、從群組匯入 | secretary |
| `/members` | 名單群組管理（CRUD + 批次貼上） | secretary/admin |
| `/dashboard` | 統計總覽，依單位展開成員，Realtime | 公開 |
| `/kitchen` | 廚房看板（掛號/報到/乾坤人數），Realtime | 公開 |
| `/checkin/[sessionId]` | QR Code 報到 | 公開 |
| `/schedule` | 班表管理 | admin/secretary |

## 主要 DB Tables

| Table | 說明 |
|-------|------|
| sessions | 班會（name, date, reg_deadline, status, unit） |
| classes | 班別，屬於 session（name, sort_order） |
| class_templates | 班別範本，admin 管理，建立班會時選用 |
| registrations | 掛號記錄（session_id, class_id, unit, name, gender, checked_in） |
| profiles | 使用者（role, unit, display_name） |
| member_groups | 名單群組（unit, name），秘書建立供重複使用 |
| members | 群組成員（group_id, name, gender, sort_order） |
| schedules / schedule_entries | 班表與排班日期 |

## 常用元件

- `RealtimeStatus` — 即時連線燈號（idle/connecting/connected/error）
- `Loading` — 載入動畫，支援 `fullPage` prop
- `SnackProvider` + `useSnack` — 全域 Snackbar，取代 alert()
- `UpdateBanner` — 每 5 分鐘 polling `/version.json`，有新版本顯示提示
- `AuthProvider` / `useAuth` — 提供 `profile`、`loading`、`signIn`

## 重要慣例

- 性別值：`'乾'`（男）、`'坤'`（女），存在 DB 就是這兩個中文字
- unit 值：固定 10 個，見 `UNITS` 常數
- 班會 `unit=null` 代表聯合班會，顯示時加 `[聯合]` 前綴；有 unit 則顯示 `[單位名]`
- Realtime 訂閱在 useEffect 回傳值裡 `supabase.removeChannel(channel)`
- 手機鎖屏回來後重建 Realtime：監聽 `visibilitychange`

---

# ClassSign 專案規則

## Push 前必須更新版號

每次 git push 前必須先更新 package.json 的版號。

**Why:** 多次發生 push 後版號沒有跟著更新，需要額外補 commit 修正，造成 git history 不整潔。

**How to apply:** 流程為：改程式碼 -> 更新 package.json version -> 一起 commit -> push。版號遞增沿用 semver，patch/minor 視改動大小而定。

## Optimistic UI 優先

所有 CRUD 操作優先使用 Optimistic UI：DB 成功後直接更新 React state，不呼叫 loadXxx() 重新 fetch。

**Why:** re-fetch 會造成整個列表重新渲染，導致 scroll 位置跳動，影響長者使用體驗。

**How to apply:**
- 新增：`.insert(...).select().single()` 取回完整 record，append 到 state
- 更新：`.update(...)` 成功後 `setXxx(prev => prev.map(...))`
- 刪除：`.delete()` 成功後 `setXxx(prev => prev.filter(...))`
- 批次匯入：`.insert(...).select()` 取回所有新增 records，spread 到 state
- 失敗時 alert 錯誤訊息，不更新 state，保持 UI 與 DB 同步

## 使用者自己改的優先

使用者自己在 IDE 改的程式碼，預設視為「他想要的結果」，不可直接還原。

**Why:** 曾發生誤解 "要上去" 的意思，直接 `git checkout` 還原了使用者的改動。

**How to apply:** 看到 `git diff` 有使用者自己做的改動時，先保留。如果改動看起來奇怪或有疑問，問清楚再決定，不要直接覆蓋或還原。

## Push 前用 git log 確認版號

每次 push 前必須執行 `git log --oneline -3` 確認目前最新版號，再遞增 patch，不可從 session 記憶假設當前版號。

**Why:** 曾發生 session 內自己追蹤版號，忽略 session 外已有的 commit，推出版號倒退的 commit（v0.5.40 但實際已是 v0.5.43）。

**How to apply:** push 前先跑 `git log --oneline -3`，看最新 commit 的版號，再 +1。

## 改完不自動 push

完成程式碼修改後，不可自動執行 git push，必須等使用者明確說「push」才推送。

**Why:** 使用者需要先看到改動結果再決定是否推送，自動 push 剝奪了確認機會。

**How to apply:** 改完後說明做了什麼、問是否 push，或等使用者主動說 push。TypeScript check 可以自動跑，但 git push 不行。
