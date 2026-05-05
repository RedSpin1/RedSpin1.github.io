document.addEventListener("DOMContentLoaded", () => {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resetBtn = document.getElementById("resetBtn");
  const inputArea = document.getElementById("input-area");
  const resultArea = document.getElementById("result-area");
  const verdict = document.getElementById("verdict");
  const textInput = document.getElementById("textInput");
  const wordCountDisplay = document.getElementById("wordCount");
  const wordCountNumber = document.getElementById("wordCountNumber");
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const fileUpload = document.getElementById("fileUpload");

  let lastWordCount = 0;

  const API_URL = "https://enchanting-wisp-b05916.netlify.app/.netlify/functions/analyze";

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const badFileHeaders = [
    [0xff, 0xd8, 0xff],
    [0x89, 0x50, 0x4e, 0x47],
    [0x47, 0x49, 0x46, 0x38],
    [0x42, 0x4d],
    [0x52, 0x49, 0x46, 0x46]
  ];

  const whitelist = new Set([
    "mr", "mrs", "ms", "dr", "st", "sr", "jr",
    "txt", "rtx", "ntx", "gtx", "sql", "css", "html", "http", "https", "ftp", "sftp", "ssh",
    "tls", "ssl", "dns", "dhcp", "tcp", "udp", "sdk", "hdd", "ssd", "cdn", "cms", "crm", "nfc", "sms", "mms",
    "llc", "plc", "lp", "ltd", "pvt", "svc", "bldg", "atty", "rsvp", "vs",
    "ft", "lb", "lbs", "mph", "rpm", "rps", "hr", "hrs",
    "ppl", "pls", "plz", "srs", "thx", "thxss", "kthx", "kthxthx", "brb", "btw", "smh", "tbh",
    "tv", "dvd", "cd", "dj", "bc", "nth", "jkr", "mjk", "blm", "cnn", "bbc", "mtv" , "msnbc", "nbc" , "cmd" 
  ]);
  function isRealWord(str) {
    const lower = str.toLowerCase();
    if (/(.)\1\1\1/.test(lower)) return false;
    if (/^\d+$/.test(str)) return true;
    if (whitelist.has(lower)) return true;
    if (str.length === 1) return /^[ia]$/i.test(str);
    return /[aeiouy]/i.test(lower);
  }

  function getWordCount(text) {
    const words = text.match(/\b[a-zA-Z0-9']+\b/g) || [];
    return words.filter(isRealWord).length;
  }

  function updateWordCount() {
    const count = getWordCount(textInput.value);
    wordCountDisplay.className = count >= 50 ? "count-green" : "count-red";

    if (count !== lastWordCount) {
      wordCountNumber.classList.add("fade-number");

      setTimeout(() => {
        wordCountNumber.innerText = count;
        wordCountNumber.classList.remove("fade-number");
      }, 110);

      lastWordCount = count;
    }
  }

  function updateUploadButton() {
    if (textInput.value.trim()) {
      uploadFileBtn.classList.add("hidden-upload");
    } else {
      uploadFileBtn.classList.remove("hidden-upload");
    }
  }

  function showInvalidUpload() {
    uploadFileBtn.classList.remove("hidden-upload");
    uploadFileBtn.innerText = "Invalid Upload";
    uploadFileBtn.style.color = "#f87171";
    uploadFileBtn.style.pointerEvents = "none";

    setTimeout(() => {
      uploadFileBtn.innerText = "➜] Upload";
      uploadFileBtn.style.color = "";
      uploadFileBtn.style.pointerEvents = "";
      updateUploadButton();
    }, 3000);
  }

  function isFakeTxt(bytes) {
    return badFileHeaders.some(sig => sig.every((b, i) => bytes[i] === b));
  }

  async function readTxt(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());

    if (isFakeTxt(bytes)) throw new Error();

    let badBytes = 0;

    for (const byte of bytes) {
      const ok =
        byte === 9 ||
        byte === 10 ||
        byte === 13 ||
        (byte >= 32 && byte <= 126) ||
        byte >= 128;

      if (!ok) badBytes++;
    }

    if (bytes.length && badBytes / bytes.length > 0.01) throw new Error();

    const text = new TextDecoder("utf-8").decode(bytes).trim();
    if (!text) throw new Error();

    return text;
  }

  async function readPdf(file) {
    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer()
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n\n";
    }

    return text.trim();
  }

  async function readDocx(file) {
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer()
    });

    const text = result.value.trim();
    if (!text) throw new Error();

    return text;
  }

  textInput.addEventListener("input", () => {
    updateWordCount();
    updateUploadButton();
  });

  uploadFileBtn.addEventListener("click", () => fileUpload.click());

  fileUpload.addEventListener("change", async () => {
    const file = fileUpload.files[0];
    if (!file) return;

    const name = file.name.toLowerCase();

    try {
      uploadFileBtn.innerText = "Reading...";

      let text = "";

      if (name.endsWith(".txt")) text = await readTxt(file);
      else if (name.endsWith(".pdf")) text = await readPdf(file);
      else if (name.endsWith(".docx")) text = await readDocx(file);
      else throw new Error();

      if (file.size > 10 * 1024 * 1024 || !text) throw new Error();

      textInput.value = text;
      updateWordCount();
      updateUploadButton();
    } catch {
      showInvalidUpload();
    } finally {
      if (uploadFileBtn.innerText !== "Invalid Upload") {
        uploadFileBtn.innerText = "➜] Upload";
        uploadFileBtn.style.color = "";
      }

      fileUpload.value = "";
    }
  });

  analyzeBtn.addEventListener("click", async () => {
    const count = getWordCount(textInput.value);

    inputArea.classList.add("hidden");
    resultArea.classList.remove("hidden");

    verdict.style.fontSize = "";
    verdict.style.color = "";

    if (count < 50) {
      verdict.innerText = "Please enter at least 50 words.";
      return;
    }

    verdict.innerText = "Analyzing content...";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput.value })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Server error");

      verdict.innerText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Error retrieving analysis.";
    } catch (e) {
      verdict.style.fontSize = "24px";
      verdict.style.color = "red";
      verdict.innerText = "ERROR: " + e.message;
    }
  });

  resetBtn.addEventListener("click", () => {
    inputArea.classList.remove("hidden");
    resultArea.classList.add("hidden");

    textInput.value = "";
    lastWordCount = 0;
    wordCountNumber.innerText = "0";
    wordCountDisplay.className = "count-red";

    verdict.style.fontSize = "";
    verdict.style.color = "";

    textInput.focus();
    updateUploadButton();
  });

  updateUploadButton();
});
