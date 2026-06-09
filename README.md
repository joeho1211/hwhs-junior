# 📚 國中部申請入學審查資料系統

## 🎯 專案概述
Google Apps Script 開發的線上申請系統，包含學生端和後台管理系統。

## 📊 開發進度

### ✅ 已完成
- [x] Phase 1: 認證系統 + 密碼管理
- [x] Phase 2: 基本資料模組
- [x] Phase 3: 成績模組（3學期×11科）
- [x] Phase 4: 特殊表現模組（10筆）
- [x] Phase A: 後台登入系統

### 🚧 開發中
- [ ] Phase B: 資料匯入模組
- [ ] Phase B: 學生查詢模組
- [ ] Phase B: 成績審核模組

### 📋 待開發
- [ ] Phase C: 成績計算模組
- [ ] Phase D: 統計報表模組

## 🔧 技術棧
- **前端**: HTML/CSS/JavaScript
- **後端**: Google Apps Script (GAS)
- **資料庫**: Google Sheet
- **檔案儲存**: Google Drive

## 📁 檔案說明

| 檔案 | 說明 |
|------|------|
| `Code.gs` | 學生端所有後端函數 |
| `AdminCode.gs` | 後台端所有後端函數 |
| `Login.html` | 學生登入頁面 |
| `AdminLogin.html` | 後台登入頁面 |
| `BasicInfo.html` | 學生基本資料頁面 |
| `Score.html` | 學生成績上傳頁面 |
| `Diversity.html` | 學生特殊表現頁面 |

## 🔑 重要設定

```javascript
const SHEET_ID = "1fL1R6sV6MvcaWRXf3TXOi_rHAu13yeycZ6iJfzTQgEw";
const FOLDER_ID = "1XDWZwaOQtq-2h566_Zy7dNASfF_zZUSS";
const SENDER_EMAIL = "joeho1211@hwhs.tc.edu.tw";

##📝 測試帳號
學生端:

帳號: 2024001
密碼: A1234567890515
後台端:

帳號: admin001
密碼: admin123456
🔗 部署 URL
學生端: https://script.google.com/macros/d/[STUDENT_ID]/exec
後台端: https://script.google.com/macros/d/[ADMIN_ID]/exec
📌 下次開發重點
✅ Phase B - 資料匯入模組
Excel 欄位對應功能
重複帳號處理
批量匯入
✅ Phase B - 學生查詢模組
列表分頁（50筆/頁）
搜尋/篩選功能
詳細資料檢視
✅ Phase B - 成績審核模組
查看成績單
驗證檔案
標記審核狀態

上次更新: 2026年6月9日


4. 點擊下方 **「Commit changes」** 保存

---

## **第 6 部分：記錄進度（每次開發後做）**

### **每次完成功能後：**

1. **在 GitHub 上新增檔案**（上傳你的最新程式碼）
2. **編輯 README.md**（更新進度狀態）
3. **點擊「Commit」** 時寫下說明：

例子 1: "完成 Phase B 資料匯入模組 - 支援 Excel 重複檢查"
例子 2: "新增學生查詢列表 - 50筆分頁 + 搜尋功能"
例子 3: "修復後台登入空白頁面"


---

## **第 7 部分：下次對話時恢復工作**

### **在新對話中：**

1. **告訴我你的 GitHub 連結**

https://github.com/[你的帳號]/招生審查系統


2. **我會直接查看你的代碼和進度**

3. **立即繼續開發下一個模組**

---

## 📝 **馬上開始！**

### **5 分鐘快速行動：**

1. ✅ 註冊 GitHub 帳號 → https://github.com
2. ✅ 建立倉庫（名稱：`recruiting-system`）
3. ✅ 上傳你的 `Code.gs` 和 HTML 檔案
4. ✅ 編輯 README.md 說明進度
5. ✅ 提供你的 GitHub URL 給我

---

## 🆘 **常見問題**

| 問題 | 解答 |
|------|------|
| **忘記密碼？** | GitHub 首頁 → Forgot password |
| **檔案上傳失敗？** | 檔案 < 25MB，格式正確 |
| **想刪除某個檔案？** | 進入檔案 → Delete（右上角） |
| **想修改檔案？** | 進入檔案 → Edit（鉛筆圖示） |
| **如何看修改紀錄？** | 進入檔案 → History |

---

**現在就去 GitHub 建立帳號吧！完成後回來告訴我你的倉庫 URL！** 🚀
