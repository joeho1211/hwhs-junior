// 執行此函數初始化所有工作表
function setupSystem() {
  initializeSheets();
  initializeScoreSheets();
  initializeDiversitySheet();
  Logger.log("系統初始化完成");
}
