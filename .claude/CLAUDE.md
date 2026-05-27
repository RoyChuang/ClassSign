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
