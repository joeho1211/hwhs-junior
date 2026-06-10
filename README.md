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


**現在就去 GitHub 建立帳號吧！完成後回來告訴我你的倉庫 URL！** 🚀
