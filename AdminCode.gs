// ===== 全域設定 =====
const SHEET_ID = "1fL1R6sV6MvcaWRXf3TXOi_rHAu13yeycZ6iJfzTQgEw"; // 替換為實際Sheet ID
const FOLDER_ID = "1XDWZwaOQtq-2h566_Zy7dNASfF_zZUSS"; // 替換為實際資料夾ID
const SENDER_EMAIL = "joeho1211@hwhs.tc.edu.tw"; // 學校信箱

// ===== Google Sheet 初始化 =====
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheetNames = ["學生基本資料", "5年級上成績", "5年級下成績", "6年級上成績", "特殊表現", "版本紀錄"];
  
  sheetNames.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  // 初始化基本資料表
  const baseSheet = ss.getSheetByName("學生基本資料");
  baseSheet.getRange(1, 1, 1, 11).setValues([["參加證號", "姓名", "身分證字號", "校名", "通知信箱", "手機號碼", "密碼(加密)", "建檔時間", "最後修改時間", "資料狀態", "重設密碼Token"]]);
}

// ===== 密碼加密與驗證 =====
function encryptPassword(password) {
  const salt = Utilities.getUuid();
  const signature = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256,
    password + salt,
    salt
  );
  return salt + ":" + Utilities.base64Encode(signature);
}

function verifyPassword(inputPassword, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  
  const inputHash = Utilities.computeHmacSignature(
    Utilities.MacAlgorithm.HMAC_SHA_256,
    inputPassword + salt,
    salt
  );
  return hash === Utilities.base64Encode(inputHash);
}

// ===== 登入驗證 =====
function validateLogin(account, password) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const baseSheet = ss.getSheetByName("學生基本資料");
  const data = baseSheet.getRange(2, 1, baseSheet.getLastRow() - 1, 11).getValues();
  
  for (let row of data) {
    if (row[0] === account) { // 參加證號
      if (verifyPassword(password, row[6])) { // 密碼驗證
        return { success: true, name: row[1], email: row[4] };
      } else {
        return { success: false, message: "密碼錯誤" };
      }
    }
  }
  return { success: false, message: "帳號不存在" };
}

// ===== 忘記密碼 - 寄送重設連結 =====
function sendPasswordResetEmail(account, idNumber) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const baseSheet = ss.getSheetByName("學生基本資料");
  const data = baseSheet.getRange(2, 1, baseSheet.getLastRow() - 1, 11).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === account && data[i][2] === idNumber) {
      const token = Utilities.getUuid();
      const email = data[i][4];
      const name = data[i][1];
      
      // 儲存Token至Sheet
      baseSheet.getRange(i + 2, 11).setValue(token);
      
      // 發送Email
      const resetLink = "https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercallback?action=resetPassword&token=" + token;
      const htmlBody = `
        <p>親愛的 ${name} 同學，您好：</p>
        <p>您申請了密碼重設，請於 24 小時內點擊以下連結：</p>
        <a href="${resetLink}">重設密碼</a>
        <p>如未申請，請忽略此信件。</p>
      `;
      
      GmailApp.sendEmail(email, "【招生系統】密碼重設連結", "", { htmlBody: htmlBody });
      return { success: true, message: "重設連結已寄送至信箱" };
    }
  }
  return { success: false, message: "帳號或身分證字號錯誤" };
}

// ===== 版本紀錄 =====
function recordChange(account, changeType, field, oldValue, newValue) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const auditSheet = ss.getSheetByName("版本紀錄");
  const timestamp = new Date().toLocaleString("zh-TW");
  const ipAddress = ""; // 可由前端傳遞
  
  auditSheet.appendRow([account, timestamp, changeType, field, oldValue, newValue, ipAddress]);
}

// ===== 時間檢查 =====
function isWithinUploadWindow(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

// ===== 檔案上傳 =====
function uploadFile(account, category, fileBlob, semester, itemNo = null) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const fileName = itemNo 
    ? `${account}_${category}_${itemNo}_v1.${fileBlob.getAs(MimeType.PDF).getName().split('.').pop()}`
    : `${account}_${category}_${semester}_v1.${fileBlob.getAs(MimeType.PDF).getName().split('.').pop()}`;
  
  const file = folder.createFile(fileBlob);
  file.setName(fileName);
  return file.getUrl();
}

// ===== 密碼規則驗證 =====
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: "密碼至少8個字元" };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return { valid: false, message: "密碼需包含大小寫英文字母" };
  }
  return { valid: true };
}

// ===== 修改密碼 =====
function changePassword(account, oldPassword, newPassword) {
  const validation = validatePassword(newPassword);
  if (!validation.valid) return validation;
  
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const baseSheet = ss.getSheetByName("學生基本資料");
  const data = baseSheet.getRange(2, 1, baseSheet.getLastRow() - 1, 11).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === account) {
      if (!verifyPassword(oldPassword, data[i][6])) {
        return { success: false, message: "舊密碼錯誤" };
      }
      const newHash = encryptPassword(newPassword);
      baseSheet.getRange(i + 2, 7).setValue(newHash);
      baseSheet.getRange(i + 2, 9).setValue(new Date().toLocaleString("zh-TW"));
      
      recordChange(account, "密碼修改", "password", "***", "***");
      return { success: true, message: "密碼修改成功" };
    }
  }
  return { success: false, message: "帳號不存在" };
}

// ===== 從Excel匯入學生資料 =====
function importFromExcel(spreadsheetUrl) {
  try {
    Logger.log("📥 開始從Excel匯入資料...");
    
    // 開啟上傳的Excel檔案（需要先將檔案上傳至Google Drive）
    const ss = SpreadsheetApp.openByUrl(spreadsheetUrl);
    const sheet = ss.getActiveSheet();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
    
    const targetSS = SpreadsheetApp.openById(SHEET_ID);
    const targetSheet = targetSS.getSheetByName("學生基本資料");
    
    let importCount = 0;
    let errorCount = 0;
    const errors = [];

    data.forEach((row, idx) => {
      try {
        const account = row[0]; // 參加證號
        const name = row[1]; // 姓名
        const idNumber = row[2]; // 身分證字號
        const birthDate = row[3]; // 生日 (yyyy/mm/dd)
        const schoolName = row[4]; // 校名
        const email = row[5]; // 信箱
        const phone = row[6]; // 手機

        // 驗證必填欄位
        if (!account || !name || !idNumber || !birthDate || !schoolName || !email || !phone) {
          errors.push(`第 ${idx + 2} 列：缺少必填欄位`);
          errorCount++;
          return;
        }

        // 驗證參加證號是否已存在
        const existingData = targetSheet.getRange(2, 1, targetSheet.getLastRow() - 1, 11).getValues();
        if (existingData.some(r => r[0] === account)) {
          errors.push(`第 ${idx + 2} 列：參加證號 ${account} 已存在`);
          errorCount++;
          return;
        }

        // 生成初始密碼
        const initPassword = generateInitPassword(idNumber, birthDate);
        const encryptedPassword = encryptPassword(initPassword);

        // 新增至系統
        const newRow = [
          account,
          name,
          idNumber,
          schoolName,
          email,
          phone,
          encryptedPassword,
          new Date().toLocaleString("zh-TW"),
          new Date().toLocaleString("zh-TW"),
          "未完成",
          ""
        ];
        targetSheet.appendRow(newRow);

        Logger.log(`✅ 已匯入: ${name} (${account})`);
        importCount++;

      } catch (error) {
        errors.push(`第 ${idx + 2} 列：${error.toString()}`);
        errorCount++;
      }
    });

    Logger.log(`\n📊 匯入結果統計：`);
    Logger.log(`✅ 成功匯入: ${importCount} 筆`);
    Logger.log(`❌ 失敗: ${errorCount} 筆`);
    
    if (errors.length > 0) {
      Logger.log(`\n⚠️ 錯誤詳情：`);
      errors.forEach(err => Logger.log(err));
    }

    return {
      success: true,
      importCount: importCount,
      errorCount: errorCount,
      errors: errors
    };

  } catch (error) {
    Logger.log(`❌ 匯入失敗: ${error.toString()}`);
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ===== 生成初始密碼 =====
function generateInitPassword(idNumber, birthDate) {
  // birthDate 格式: yyyy/mm/dd -> 提取 mmdd
  const dateStr = birthDate.toString().replace(/\//g, "");
  const mmdd = dateStr.substring(4, 8); // 提取月日4碼
  
  return idNumber + mmdd;
}

// ===== 驗證生日格式 =====
function validateBirthDate(dateStr) {
  // 格式: yyyy/mm/dd
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const [year, month, day] = dateStr.split("/");
  const date = new Date(`${year}-${month}-${day}`);
  
  return !isNaN(date.getTime());
}

// ===== 生成匯入報告 =====
function generateImportReport(result) {
  const timestamp = new Date().toLocaleString("zh-TW");
  
  Logger.log(`\n${"=".repeat(50)}`);
  Logger.log(`   📋 學生資料匯入報告`);
  Logger.log(`${"=".repeat(50)}`);
  Logger.log(`匯入時間: ${timestamp}`);
  Logger.log(`成功筆數: ${result.importCount}`);
  Logger.log(`失敗筆數: ${result.errorCount}`);
  Logger.log(`成功率: ${((result.importCount / (result.importCount + result.errorCount)) * 100).toFixed(2)}%`);
  
  if (result.errors.length > 0) {
    Logger.log(`\n❌ 失敗原因：`);
    result.errors.forEach((err, idx) => {
      Logger.log(`${idx + 1}. ${err}`);
    });
  }
  Logger.log(`${"=".repeat(50)}\n`);
}

// ===== 後台系統 - 全域設定 =====
const ADMIN_SHEET_ID = "1fL1R6sV6MvcaWRXf3TXOi_rHAu13yeycZ6iJfzTQgEw"; // 使用同一個Google Sheet
const ADMIN_FOLDER_ID = "1XDWZwaOQtq-2h566_Zy7dNASfF_zZUSS"; // 使用同一個Drive資料夾

// ===== 建立後台人員帳號表 =====
function createAdminAccountSheet() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    
    // 檢查工作表是否存在
    if (!ss.getSheetByName("後台人員帳號")) {
      ss.insertSheet("後台人員帳號");
    }
    
    const adminSheet = ss.getSheetByName("後台人員帳號");
    const headers = ["帳號", "姓名", "密碼(加密)", "身份", "建檔時間", "最後登入時間", "狀態"];
    adminSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    Logger.log("✅ 後台人員帳號表已建立");
    return { success: true, message: "後台人員帳號表已建立" };
    
  } catch (error) {
    Logger.log("❌ 建立失敗: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===== 新增後台人員帳號（修正版） =====
function addAdminAccount(account, name, password, position = "承辦人") {
  try {
    if (!account || !name || !password) {
      return { success: false, message: "帳號、姓名、密碼不能為空" };
    }

    // 驗證密碼強度
    if (password.length < 6) {
      return { success: false, message: "密碼至少6個字元" };
    }

    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = ss.getSheetByName("後台人員帳號");
    
    // 修正：檢查工作表是否為空（只有標題行）
    const lastRow = adminSheet.getLastRow();
    const existingData = [];
    
    if (lastRow > 1) {
      // 只有當有資料行時才讀取
      const data = adminSheet.getRange(2, 1, lastRow - 1, 7).getValues();
      if (data.some(row => row[0] === account)) {
        return { success: false, message: `帳號 ${account} 已存在` };
      }
    }

    // 加密密碼
    const encryptedPassword = encryptPassword(password);
    const timestamp = new Date().toLocaleString("zh-TW");

    const newRow = [account, name, encryptedPassword, position, timestamp, "", "啟用"];
    adminSheet.appendRow(newRow);

    Logger.log(`✅ 已新增後台人員: ${name} (${account})`);
    return { 
      success: true, 
      message: `已成功新增帳號 ${account}`,
      account: account,
      password: password
    };

  } catch (error) {
    Logger.log("❌ 新增失敗: " + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ===== 後台登入驗證 =====
function adminLogin(account, password) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = ss.getSheetByName("後台人員帳號");
    const data = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 7).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === account && data[i][6] === "啟用") {
        // 驗證密碼
        if (verifyPassword(password, data[i][2])) {
          // 更新最後登入時間
          adminSheet.getRange(i + 2, 6).setValue(new Date().toLocaleString("zh-TW"));
          
          // 記錄操作日誌
          recordAdminLog(account, "後台登入", "", "登入成功");

          return {
            success: true,
            account: account,
            name: data[i][1],
            position: data[i][3]
          };
        } else {
          recordAdminLog(account, "後台登入", "", "密碼錯誤");
          return { success: false, message: "密碼錯誤" };
        }
      }
    }

    recordAdminLog(account, "後台登入", "", "帳號不存在或已停用");
    return { success: false, message: "帳號不存在或已停用" };

  } catch (error) {
    Logger.log("❌ 登入驗證失敗: " + error.toString());
    return { success: false, message: "系統錯誤" };
  }
}

// ===== 修改後台人員密碼 =====
function changeAdminPassword(account, oldPassword, newPassword) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = ss.getSheetByName("後台人員帳號");
    const data = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 7).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === account) {
        // 驗證舊密碼
        if (!verifyPassword(oldPassword, data[i][2])) {
          recordAdminLog(account, "修改密碼", "", "舊密碼錯誤");
          return { success: false, message: "舊密碼錯誤" };
        }

        // 驗證新密碼強度
        if (newPassword.length < 6) {
          return { success: false, message: "新密碼至少6個字元" };
        }

        // 更新密碼
        const newHash = encryptPassword(newPassword);
        adminSheet.getRange(i + 2, 3).setValue(newHash);

        recordAdminLog(account, "修改密碼", "", "密碼已更新");
        return { success: true, message: "密碼已更新成功" };
      }
    }

    return { success: false, message: "帳號不存在" };

  } catch (error) {
    Logger.log("❌ 修改密碼失敗: " + error.toString());
    return { success: false, message: "系統錯誤" };
  }
}

// ===== 後台操作日誌 =====
function recordAdminLog(adminAccount, action, details, result) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    
    // 建立或取得操作日誌表
    let logSheet = ss.getSheetByName("後台操作日誌");
    if (!logSheet) {
      ss.insertSheet("後台操作日誌");
      logSheet = ss.getSheetByName("後台操作日誌");
      const headers = ["後台帳號", "操作時間", "操作類型", "操作詳情", "操作結果", "IP位址"];
      logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const timestamp = new Date().toLocaleString("zh-TW");
    const ipAddress = ""; // 可由前端傳遞
    
    const newRow = [adminAccount, timestamp, action, details, result, ipAddress];
    logSheet.appendRow(newRow);

    Logger.log(`📝 已記錄操作日誌: ${adminAccount} - ${action}`);

  } catch (error) {
    Logger.log("⚠️ 記錄操作日誌失敗: " + error.toString());
  }
}

// ===== 取得所有後台人員清單（供管理用） =====
function getAllAdminAccounts() {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = ss.getSheetByName("後台人員帳號");
    const data = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 7).getValues();

    const accounts = [];
    data.forEach(row => {
      accounts.push({
        account: row[0],
        name: row[1],
        position: row[3],
        createdAt: row[4],
        lastLogin: row[5],
        status: row[6]
      });
    });

    return accounts;

  } catch (error) {
    Logger.log("❌ 取得帳號清單失敗: " + error.toString());
    return [];
  }
}

// ===== 停用/啟用後台帳號 =====
function toggleAdminAccountStatus(account, status) {
  try {
    const ss = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    const adminSheet = ss.getSheetByName("後台人員帳號");
    const data = adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 7).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === account) {
        adminSheet.getRange(i + 2, 7).setValue(status);
        recordAdminLog("系統", "帳號管理", `帳號 ${account}`, `已${status}`);
        return { success: true, message: `帳號已${status}` };
      }
    }

    return { success: false, message: "帳號不存在" };

  } catch (error) {
    Logger.log("❌ 修改帳號狀態失敗: " + error.toString());
    return { success: false, message: "系統錯誤" };
  }
}

// ===== 主 HTML 入口 =====
function doGet(e) {
  const page = e.parameter.page || 'admin_login';
  
  if (page === 'admin_login') {
    return HtmlService.createHtmlOutput(HtmlService.createTemplateFromFile('AdminLogin').evaluate().getContent())
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } 
  else if (page === 'admin_dashboard') {
    // 簡單測試頁面
    return HtmlService.createHtmlOutput(`
      <html>
        <head><meta charset="UTF-8"><title>後台主控面板</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>✅ 登入成功！</h1>
          <p>帳號：<strong>` + sessionStorage.getItem('admin_account') + `</strong></p>
          <p>身份：<strong>` + sessionStorage.getItem('admin_position') + `</strong></p>
          <button onclick="logout()">登出</button>
          <script>
            function logout() {
              sessionStorage.clear();
              window.location.href = '?page=admin_login';
            }
          </script>
        </body>
      </html>
    `).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  return HtmlService.createHtmlOutput("❌ 頁面不存在");
}
