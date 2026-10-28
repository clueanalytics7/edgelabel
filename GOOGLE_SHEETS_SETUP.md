# EdgeLabel — Google Sheets Contact Form Setup Guide

This guide walks you through setting up a **100% free, zero-maintenance database** for storing contact submissions in a Google Sheet and receiving instant email alerts at `clueanalytics7@gmail.com`.

---

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name the sheet (e.g. `EdgeLabel Contact Inquiries`).
3. *(Optional)* In row 1, set the column headers:
   - **A1**: `Timestamp`
   - **B1**: `Name`
   - **C1**: `Email`
   - **D1**: `Enquiry Type`
   - **E1**: `Message`
   - **F1**: `Source URL`

---

## Step 2: Open Google Apps Script

1. In the Google Sheets menu, click **Extensions** > **Apps Script**.
2. Replace any boilerplate code in `Code.gs` with the following production script:

```javascript
/**
 * EdgeLabel Contact Form Webhook
 * Appends contact submissions to the active Google Sheet
 * and sends an email notification to clueanalytics7@gmail.com
 */

const NOTIFICATION_EMAIL = "clueanalytics7@gmail.com";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Prevent concurrent write race conditions

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = e.parameter;

    // Check if sheet has a header row; if not, create one
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Enquiry Type", "Message", "Source URL"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f4f6");
    }

    const timestamp = new Date();
    const name = data.name || "Anonymous";
    const email = data.email || "No email";
    const type = data.type || "General enquiry";
    const message = data.message || "";
    const sourceUrl = data.page || "EdgeLabel Contact Page";

    // Append record row
    sheet.appendRow([
      timestamp,
      name,
      email,
      type,
      message,
      sourceUrl
    ]);

    // Send instant notification email to team
    try {
      MailApp.sendEmail({
        to: NOTIFICATION_EMAIL,
        replyTo: email,
        subject: `[EdgeLabel Contact] ${type} from ${name}`,
        body: `New contact form submission received on ${timestamp.toLocaleString()}:\n\n` +
              `• Name: ${name}\n` +
              `• Email: ${email}\n` +
              `• Topic: ${type}\n` +
              `• Source: ${sourceUrl}\n\n` +
              `Message:\n${message}\n\n` +
              `---\nView and manage all records directly in your Google Sheet:\n${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
      });
    } catch (mailErr) {
      Logger.log("Email notification error: " + mailErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}
```

---

## Step 3: Deploy as a Web App

1. In the upper right corner of the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `EdgeLabel Contact Webhook v1`
   - **Execute as**: **Me (clueanalytics7@gmail.com)**
   - **Who has access**: **Anyone** *(Important: Must be "Anyone" so visitors can post form entries without logging in).*
4. Click **Deploy**.
5. When prompted, click **Authorize access**, select your Google account, click **Advanced**, and then click **Go to Untitled project (unsafe)** to approve spreadsheet and email permissions.
6. Copy the generated **Web App URL** (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 4: Connect to EdgeLabel

You have two easy options to connect your Web App URL to the site:

### Option A: Direct UI Configuration (No code edits needed)
1. Open the deployed contact page: `https://clueanalytics7.github.io/edgelabel/contact.html`.
2. Scroll to the bottom of the contact form card and click **Configure Sheet Endpoint URL**.
3. Paste your Web App URL and click **Save**. It is stored directly in your browser.

### Option B: Commit to the Repository (Permanent for all visitors)
1. In `contact.html`, line ~142, update `DEFAULT_WEBAPP_URL`:
   ```javascript
   const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec';
   ```
2. Run `npm run build` to update the `docs/` folder, then commit and push to GitHub.

---

## Features Built Into the Form

- **Anti-Spam Honeypot**: Hidden field traps automated bots and silently prevents spam submissions.
- **Loading Spinner & State**: Submit button displays active state (`Submitting message...`) and prevents duplicate submissions.
- **Optimistic & Resilient Feedback**: Displays clean success confirmation on record save.
- **Fail-Safe Email Fallback**: If the user's connection drops or the webhook is unavailable, a direct 1-click fallback opens their email client addressed to `clueanalytics7@gmail.com`.
