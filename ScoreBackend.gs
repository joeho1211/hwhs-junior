// ===== 成績模組 - 取得成績資料 =====
function getScoreData(account) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = {
    "5_1": ss.getSheetByName("5年級上成績"),
    "5_2": ss.getSheetByName("5年級下成績"),
    "6_1": ss.getSheetByName("6年級上成績")
  };

  const result = {};
  
  for (const [key, sheet] of Object.entries(sheets)) {
    if (!sheet) continue;
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    
    for (let row of data) {
      if (row[0] === account) {
        // 科目1-11對應欄位2-12
        for (let i = 0; i < 11; i++) {
          result[`${key}_${i}`] = row[i + 1] || "";
        }
        result[`file_${key}`] = row[12] || "";
        break;
      }
    }
  }
  
  return result;
}

// ===== 成績模組 - 儲存成績資料 =====
function saveScoreData(account, scoreData, filesToUpload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const semesters = ["5_1", "5_2", "6_1"];
  const sheetNames = ["5年級上成績", "5年級下成績", "6年級上成績"];

  semesters.forEach((sem, idx) => {
    const sheet = ss.getSheetByName(sheetNames[idx]);
    if (!sheet) return;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    let found = false;

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === account) {
        // 更新科目成績 (欄位2-12)
        for (let j = 0; j < 11; j++) {
          const dataKey = `${sem}_${j}`;
          sheet.getRange(i + 2, j + 2).setValue(scoreData[dataKey] || "");
        }
        
        // 更新修改時間
        sheet.getRange(i + 2, 13).setValue(new Date().toLocaleString("zh-TW"));
        
        found = true;
        break;
      }
    }

    // 若無該學生，新增一列
    if (!found) {
      const newRow = [account];
      for (let j = 0; j < 11; j++) {
        newRow.push(scoreData[`${sem}_${j}`] || "");
      }
      newRow.push(new Date().toLocaleString("zh-TW"));
      sheet.appendRow(newRow);
    }

    recordChange(account, "成績修改", `${sheetNames[idx]}`, "", "");
  });

  return { success: true, message: "成績已儲存" };
}

// ===== 成績模組 - 上傳成績檔案 =====
function uploadScoreFile(account, fileBlob, semesterKey) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const semesterMap = {
    "score_5_1": "5年級上成績",
    "score_5_2": "5年級下成績",
    "score_6_1": "6年級上成績"
  };

  const semesterLabel = semesterMap[semesterKey];
  const ext = fileBlob.getAs(MimeType.PDF).getName().split('.').pop();
  
  // 檢查是否有舊檔案
  const fileName = `${account}_${semesterLabel}_*.${ext.includes('pdf') ? 'pdf' : 'jpg'}`;
  const files = folder.getFilesByName(`${account}_${semesterLabel}_v1.pdf`);
  
  let file;
  if (files.hasNext()) {
    file = files.next();
    file.setTrashed(true); // 刪除舊版本
  }

  // 上傳新檔案
  file = folder.createFile(fileBlob);
  file.setName(`${account}_${semesterLabel}_v1.${ext.includes('pdf') ? 'pdf' : 'jpg'}`);
  
  // 更新Sheet中的檔案URL
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const semesterMap2 = {
    "score_5_1": "5年級上成績",
    "score_5_2": "5年級下成績",
    "score_6_1": "6年級上成績"
  };

  const sheet = ss.getSheetByName(semesterMap2[semesterKey]);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === account) {
      sheet.getRange(i + 2, 13).setValue(file.getUrl());
      break;
    }
  }

  return file.getUrl();
}

// ===== 初始化成績工作表 =====
function initializeScoreSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheetNames = ["5年級上成績", "5年級下成績", "6年級上成績"];
  const subjects = [
    "語言領域-本國語言",
    "語言領域-鄉土語言",
    "語言領域-英語",
    "數學",
    "社會",
    "自然與生活科技",
    "藝術與人文-音樂",
    "藝術與人文-舞蹈或戲劇",
    "藝術與人文-美勞或美術",
    "健康與體育-健康",
    "健康與體育-體育"
  ];

  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    const headers = ["參加證號", ...subjects, "上傳時間"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  });
}
