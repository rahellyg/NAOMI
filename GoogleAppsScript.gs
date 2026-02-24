/**
 * מדפיס נתוני טופס לשורה חדשה בגיליון.
 * הרצה: פרוס כאפליקציית אינטרנט (Web app), "גישה: כל אחד".
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var params = e.parameter;

    var name = params.name || '';
    var email = params.email || '';
    var phone = params.phone || '';
    var message = params.message || '';

    sheet.appendRow([new Date(), name, email, phone, message]);

    return ContentService
      .createTextOutput('OK')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService
      .createTextOutput('Error: ' + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
