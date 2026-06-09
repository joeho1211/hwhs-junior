// ===== 特殊表現模組 - 初始化工作表 =====
function initializeDiversitySheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  if (!sheet) return;

  const headers = ["參加證號", "項次", "類別", "細項類別", "活動名稱", "名次級別", "取得日期", "發證單位", "檔案URL", "上傳時間", "狀態"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

// ===== 特殊表現模組 - 取得資料 =====
function getDiversityData(account) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  if (!sheet) return { uploadedItems: [] };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  const result = { uploadedItems: [] };

  for (let row of data) {
    if (row[0] === account && row[10] !== "deleted") {
      const itemNo = row[1];
      result.uploadedItems.push({ itemNo: itemNo });
      result[`category_${itemNo}`] = row[2] || "";
      result[`subcategory_${itemNo}`] = row[3] || "";
      result[`item_${itemNo}`] = row[4] || "";
      result[`level_${itemNo}`] = row[5] || "";
      result[`date_${itemNo}`] = row[6] || "";
      result[`organize_${itemNo}`] = row[7] || "";
      result[`file_${itemNo}`] = row[8] || "";
    }
  }

  return result;
}

// ===== 特殊表現模組 - 新增項目 =====
function addNewDiversityItem(account) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();

  let maxItemNo = 0;
  for (let row of data) {
    if (row[0] === account) {
      const itemNo = parseInt(row[1]) || 0;
      if (itemNo > maxItemNo) maxItemNo = itemNo;
    }
  }

  const newItemNo = maxItemNo + 1;
  if (newItemNo > 10) {
    return null; // 超過上限
  }

  const newRow = [account, newItemNo, "", "", "", "", "", "", "", new Date().toLocaleString("zh-TW"), ""];
  sheet.appendRow(newRow);

  recordChange(account, "新增特殊表現項目", `項目${newItemNo}`, "", "");
  return newItemNo;
}

// ===== 特殊表現模組 - 刪除項目 =====
function deleteDiversityItem(account, itemNo) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === account && data[i][1] === itemNo) {
      // 標記為deleted而非真正刪除（保留審計紀錄）
      sheet.getRange(i + 2, 11).setValue("deleted");
      
      // 刪除相關檔案
      const fileUrl = data[i][8];
      if (fileUrl) {
        try {
          const fileId = extractFileIdFromUrl(fileUrl);
          DriveApp.getFileById(fileId).setTrashed(true);
        } catch (e) {
          Logger.log("檔案刪除失敗: " + e.toString());
        }
      }

      recordChange(account, "刪除特殊表現項目", `項目${itemNo}`, "", "");
      return { success: true, message: "已刪除該筆資料" };
    }
  }

  return { success: false, message: "項目不存在" };
}

// ===== 特殊表現模組 - 儲存資料 =====
function saveDiversityData(account, formData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  if (!sheet) return { success: false, message: "工作表不存在" };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  const timestamp = new Date().toLocaleString("zh-TW");

  for (const [key, value] of Object.entries(formData)) {
    const match = key.match(/^(\w+)_(\d+)$/);
    if (!match) continue;

    const field = match[1];
    const itemNo = parseInt(match[2]);

    let found = false;

    for (let j = 0; j < data.length; j++) {
      if (data[j][0] === account && data[j][1] === itemNo && data[j][10] !== "deleted") {
        if (field === "category") {
          sheet.getRange(j + 2, 3).setValue(value);
        } else if (field === "subcategory") {
          sheet.getRange(j + 2, 4).setValue(value);
        } else if (field === "item") {
          sheet.getRange(j + 2, 5).setValue(value);
        } else if (field === "level") {
          sheet.getRange(j + 2, 6).setValue(value);
        } else if (field === "date") {
          sheet.getRange(j + 2, 7).setValue(value);
        } else if (field === "organize") {
          sheet.getRange(j + 2, 8).setValue(value);
        }
        sheet.getRange(j + 2, 10).setValue(timestamp);
        sheet.getRange(j + 2, 11).setValue(""); // 清除deleted標記
        found = true;
      }
    }

    if (!found && (field === "category" || field === "item")) {
      // 新增項目
      const newRow = [account, itemNo, "", "", "", "", "", "", "", timestamp, ""];
      sheet.appendRow(newRow);
    }
  }

  recordChange(account, "特殊表現修改", "特殊表現", "", "");
  return { success: true, message: "特殊表現已儲存" };
}

// ===== 特殊表現模組 - 上傳檔案 =====
function uploadDiversityFile(account, fileBlob, itemNo) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const ext = fileBlob.getAs(MimeType.PDF).getName().split('.').pop();
  
  // 刪除舊檔案
  const oldFileName = `${account}_特殊表現_${String(itemNo).padStart(3, '0')}_v1`;
  const oldFiles = folder.getFilesByName(oldFileName + ".pdf");
  if (oldFiles.hasNext()) {
    oldFiles.next().setTrashed(true);
  }

  // 上傳新檔案
  const file = folder.createFile(fileBlob);
  file.setName(`${account}_特殊表現_${String(itemNo).padStart(3, '0')}_v1.${ext.includes('pdf') ? 'pdf' : 'jpg'}`);

  // 更新Sheet
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("特殊表現");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === account && data[i][1] === parseInt(itemNo) && data[i][10] !== "deleted") {
      sheet.getRange(i + 2, 9).setValue(file.getUrl());
      break;
    }
  }

  return file.getUrl();
}

// ===== 輔助函數 - 從URL提取Google Drive文件ID =====
function extractFileIdFromUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// ===== 主 HTML 輸出 =====
function getDiversityPage() {
  return HtmlService.createTemplateFromFile('Diversity').evaluate().getContent();
}
