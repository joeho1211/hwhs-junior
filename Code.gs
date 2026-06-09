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
