# EdgeLabel — Google Sheets Contact Form Setup & Troubleshooting Guide

This guide explains how to connect your contact form to Google Sheets (`EdgeLabel Contact Submissions - Oct 26`) and how to solve why messages may not appear yet.

---

## 🔍 Why Submissions Weren't Displaying (The 3 Core Causes)

When you submit from the website and see "Message Sent Successfully!", but the sheet remains blank:

1. **Google Apps Script Requires "New Version" Deployment**:
   - In Google Apps Script, editing `Code.gs` does **not** update a live `/exec` Web App URL automatically.
   - When a Web App URL is first generated, it is frozen to **Version 1** (often when the script file was still blank or had `function myFunction() {}`).
   - Every time code is pasted into `Code.gs`, you **must** update the deployment to a **New version** (instructions below).

2. **Web App Permissions ("Who has access")**:
   - If **"Who has access"** is set to *"Only myself"* or *"Anyone with Google account"*, Google blocks visitor submissions with a redirect to a Google login page.
   - Because modern browsers make contact form requests in background `no-cors` mode, the browser treats the redirect as completed, showing a green checkmark, even though Google blocked the data before `doPost` could execute.
   - **Access must be set to "Anyone"**.

3. **Script Authorization**:
   - Google Apps Script requires one-time permission approval to edit your spreadsheet and send emails on your behalf.
   - If never authorized, Google halts execution before touching the sheet.

---

## 📋 Should You Add Columns First or Leave the Sheet Blank?

**Answer: Yes, add the 6 column headers in Row 1 before submissions!**

Although the script contains a check to create headers if `sheet.getLastRow() === 0`, newly created Google Sheets frequently come pre-populated with 1,000 empty rows or empty cell formatting. When this happens, Google Sheets may not register the sheet as having 0 rows, which can cause headers to be skipped or rows to be appended at the very bottom (e.g., Row 1001).

### Recommended Sheet Setup:
In your spreadsheet tab (first sheet):
- **Cell A1**: `Timestamp`
- **Cell B1**: `Name`
- **Cell C1**: `Email`
- **Cell D1**: `Enquiry Type`
- **Cell E1**: `Message`
- **Cell F1**: `Source URL`

*(Tip: In Google Sheets, click **View > Freeze > 1 row** to lock the header row in place).*

---

## 🛠️ Step-by-Step Fix in Google Apps Script

### Step 1: Replace `Code.gs` with this Bulletproof Script
Open your sheet, click **Extensions > Apps Script**, delete everything in `Code.gs`, and paste this updated version:

```javascript
/**
 * EdgeLabel Contact Form Webhook & Notification System
 * Sheet: EdgeLabel Contact Submissions - Oct 26
 * Recipient: clueanalytics7@gmail.com
 */

const NOTIFICATION_EMAIL = "clueanalytics7@gmail.com";

// ==========================================
// 1. Live Webhook Handler (Invoked on Website Submission)
// ==========================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10s for other submissions to finish
  const hasLock = lock.tryLock(10000);

  try {
    // Always target the first sheet tab reliably
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];

    // Extract parameters from URL-encoded form data, query params, or JSON
    let data = {};
    if (e && e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        // Fallback for url-encoded string in postData
        const raw = e.postData.contents;
        raw.split("&").forEach(function(part) {
          const item = part.split("=");
          data[decodeURIComponent(item[0])] = decodeURIComponent(item[1] || "");
        });
      }
    }

    // Auto-create headers if sheet is completely fresh
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Email", "Enquiry Type", "Message", "Source URL"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#f3f4f6");
    }

    const timestamp = new Date();
    const name = data.name || "Anonymous Visitor";
    const email = data.email || "No email provided";
    const type = data.type || "General enquiry";
    const message = data.message || "(No message body)";
    const sourceUrl = data.page || data.sourceUrl || "EdgeLabel Contact Page";

    // Append submission row
    sheet.appendRow([
      timestamp,
      name,
      email,
      type,
      message,
      sourceUrl
    ]);

    // Send instant email notification to the team
    try {
      MailApp.sendEmail({
        to: NOTIFICATION_EMAIL,
        replyTo: email !== "No email provided" ? email : NOTIFICATION_EMAIL,
        subject: `[EdgeLabel Contact] ${type} from ${name}`,
        body: `New contact submission received on ${timestamp.toLocaleString()}:\n\n` +
              `• Name: ${name}\n` +
              `• Email: ${email}\n` +
              `• Topic: ${type}\n` +
              `• Page: ${sourceUrl}\n\n` +
              `Message:\n${message}\n\n` +
              `---\nOpen Google Sheet: ${ss.getUrl()}`
      });
    } catch (mailErr) {
      Logger.log("Email notification error: " + mailErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success", status: 200 }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Fatal doPost error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

// ==========================================
// 2. One-Click Authorization & Test Function
// ==========================================
function testRun() {
  Logger.log("Starting testRun...");
  const dummyEvent = {
    parameter: {
      name: "Test Visitor",
      email: "clueanalytics7@gmail.com",
      type: "Feature Request / Feedback",
      message: "This is a test verification submission from the Apps Script editor.",
      page: "https://clueanalytics7.github.io/edgelabel/contact.html"
    }
  };

  const response = doPost(dummyEvent);
  Logger.log("Response: " + response.getContent());
  Logger.log("Check your Google Sheet and your email inbox now!");
}
```

### Step 2: Run `testRun()` to Authorize Permissions
1. In the Apps Script toolbar, make sure **`testRun`** is selected in the function dropdown (next to "Debug").
2. Click **Run**.
3. A modal titled **"Authorization required"** will appear:
   - Click **Review permissions**.
   - Choose your Google account (`clueanalytics7@gmail.com`).
   - If Google shows *"Google hasn’t verified this app"*, click **Advanced** (bottom left), then click **Go to Untitled project (unsafe)**.
   - Click **Allow**.
4. Check your Google Sheet: You will instantly see the header row and a test row added!
5. Check your email: You will receive the test notification email.

---

### Step 3: Publish as a "New Version" (CRUCIAL)
Now that your script is authorized and tested, you must point the Web App to this new code:

1. In the top-right corner of Google Apps Script, click **Deploy** > **Manage deployments**.
2. Select your active deployment and click the **Pencil icon (Edit)**.
3. In the **Version** dropdown, click and select **"New version"**.
4. Double-check that:
   - **Execute as**: **Me (clueanalytics7@gmail.com)**
   - **Who has access**: **Anyone**
5. Click **Deploy**.
6. The URL remains:
   `https://script.google.com/macros/s/AKfycbyWhNUqjQG1Y2lXAMmQK5v_xy9047qlhqDgpGHDtSyZR5GjIO2iLVs7FSLel1d6_x57/exec`
7. Click **Done**.

---

## 🌐 Verification from Website

1. Open your contact page: `https://clueanalytics7.github.io/edgelabel/contact.html` (or locally).
2. Fill out:
   - Name: `Jane Doe`
   - Email: `jane@example.com`
   - Topic: `General Inquiry`
   - Message: `Hello from EdgeLabel live test!`
3. Click **Send Message**.
4. Switch to your Google Sheet: The submission will appear in Row 2 instantly, and an email notification will be delivered to `clueanalytics7@gmail.com`.
