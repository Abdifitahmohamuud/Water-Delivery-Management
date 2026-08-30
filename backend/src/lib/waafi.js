// waafi-pay-test.js
// Run with: node waafi-pay-test.js
// Requires Node.js 18+ (native fetch, no extra packages needed)

// Formats a Date as "YYYY-MM-DD HH:mm:ss.SSS" (required by WaafiPay, NOT epoch millis)
function formatTimestamp(date) {
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return (
    date.getFullYear() + "-" +
    pad(date.getMonth() + 1) + "-" +
    pad(date.getDate()) + " " +
    pad(date.getHours()) + ":" +
    pad(date.getMinutes()) + ":" +
    pad(date.getSeconds()) + "." +
    pad(date.getMilliseconds(), 3)
  );
}

// Simple UUID v4 generator for requestId
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function payNow(number, mony) {
  const requestBody = {
    schemaVersion: "1.0",
    requestId: generateUUID(),
    timestamp: formatTimestamp(new Date()),
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: "M0910291",
      apiUserId: "1000416",
      apiKey: "API-675418888AHX",
      paymentMethod: "MWALLET_ACCOUNT", // waa in ay UPPERCASE ahaataa
      payerInfo: {
        accountNo: number,
      },
      transactionInfo: {
        // MUHIIM: kuwan waa in mar walba UNIQUE yihiin. Haddii la isticmaalo
        // isla referenceId/invoiceId mar labaad, WaafiPay wuxuu u tixraaci
        // karaa idempotency key ahaan oo soo celin kara natiijadii
        // transaction-kii hore (amount qaldan, state qaldan, iwm) — taasi
        // waa sababta amount-kaagu uusan u dhigmi jirin response-ka.
        referenceId: "REF-" + Date.now(),
        invoiceId: "INV-" + Date.now(),
        amount: mony,
        currency: "USD",
        description: "Test USD",
      },
    },
  };

  console.log("WaafiPay request body:", requestBody.serviceParams);

  try {
    const res = await fetch("https://api.waafipay.net/asm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    // API-gu wuxuu soo celin karaa HTTP status aan 200 ahayn xitaa haddii
    // uu leeyahay JSON body, marka waxaan isku dayeynaa in aan JSON-ka
    // parse-garno mar walba.
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error(
        `Server returned an unreadable response (HTTP ${res.status}).`,
        parseErr
      );
      return {
        responseCode: "5000",
        responseMsg: `Server returned an unreadable response (HTTP ${res.status}).`,
        errorCode: "5000",
        params: { state: "FAILED" }
      };
    }

    // Kani waa response-ka BUUXA ee Waafi soo celiyo
    console.log("WaafiPay raw response:", data);
    handleResponse(data);
    return data;
  } catch (error) {
    // Network failure, DNS issue, timeout, iwm.
    console.error("Request error:", error.message);
    return {
      responseCode: "5000",
      responseMsg: error.message,
      errorCode: "5000",
      params: { state: "FAILED" }
    };
  }
}

export function handleResponse(data) {
  const responseCode = data.responseCode;
  const errorCode = data.errorCode;
  const params = data.params || {};
  const state = (params.state || "").toUpperCase();

  const details = {
    responseCode,
    errorCode,
    message: data.responseMsg || "",
    transactionId: data.responseId,
    referenceId: params.referenceId,
    amount: params.txAmount,
    state,
  };

  if (responseCode === "2001" && state === "APPROVED") {
    console.log("✅ Payment approved!", details);
  } else if (responseCode === "2001" && (state === "DECLINED" || state === "FAILED")) {
    console.log(`❌ Payment ${state.toLowerCase()}.`, details);
  } else {
    console.log("⚠️ Request failed.", details);
  }
}