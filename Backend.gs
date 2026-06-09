// ===== 取得基本資料 =====
function getBasicInfo(account) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const baseSheet = ss.getSheetByName("學生基本資料");
  const data = baseSheet.getRange(2, 1, baseSheet.getLastRow() - 1, 11).getValues();
  
  for (let row of data) {
    if (row[0] === account) {
      return {
        account: row[0],
        name: row[1],
        idNumber: row[2],
        schoolName: row[3],
        schoolType: row[3].includes('公') ? '公立' : '私立',
        email: row[4],
        phone: row[5]
      };
    }
  }
  return null;
}

// ===== 儲存基本資料 =====
function saveBasicInfo(basicData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const baseSheet = ss.getSheetByName("學生基本資料");
  const data = baseSheet.getRange(2, 1, baseSheet.getLastRow() - 1, 11).getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === basicData.account) {
      const rowNum = i + 2;
      baseSheet.getRange(rowNum, 2).setValue(basicData.name);
      baseSheet.getRange(rowNum, 4).setValue(basicData.schoolName);
      baseSheet.getRange(rowNum, 5).setValue(basicData.email);
      baseSheet.getRange(rowNum, 6).setValue(basicData.phone);
      baseSheet.getRange(rowNum, 9).setValue(new Date().toLocaleString("zh-TW"));
      
      // 密碼修改
      if (basicData.newPassword) {
        const newHash = encryptPassword(basicData.newPassword);
        baseSheet.getRange(rowNum, 7).setValue(newHash);
        recordChange(basicData.account, "密碼修改", "password", "***", "***");
      }
      
      // 記錄異動
      recordChange(basicData.account, "基本資料修改", "基本資料", JSON.stringify(data[i]), JSON.stringify([basicData.name, basicData.schoolName, basicData.email, basicData.phone]));
      
      return { success: true, message: "基本資料已儲存" };
    }
  }
  return { success: false, message: "帳號不存在" };
}

// ===== 主入口 (doGet) =====
function doGet(e) {
  const page = e.parameter.page || 'login';
  
  if (page === 'login') {
    return HtmlService.createHtmlOutput(getLoginPage()).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'basicInfo') {
    return HtmlService.createHtmlOutput(getBasicInfoPage()).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

function getLoginPage() {
  return HtmlService.createTemplateFromFile('Login').evaluate().getContent();
}

function getBasicInfoPage() {
  return HtmlService.createTemplateFromFile('BasicInfo').evaluate().getContent();
}
