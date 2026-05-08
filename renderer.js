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

  const authButton = document.getElementById("authButton");
  const authModal = document.getElementById("authModal");
  const closeAuthModal = document.getElementById("closeAuthModal");
  const authBackBtn = document.getElementById("authBackBtn");
  const authLoginView = document.getElementById("authLoginView");
  const authSignupView = document.getElementById("authSignupView");
  const authVerifyView = document.getElementById("authVerifyView");
  const authAccountView = document.getElementById("authAccountView");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");
  const emailSignupBtn = document.getElementById("emailSignupBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const authMessage = document.getElementById("authMessage");
  const accountName = document.getElementById("accountName");
  const accountEmail = document.getElementById("accountEmail");
  const recentScansSidebar = document.getElementById("recentScansSidebar");
  const recentScansList = document.getElementById("recentScansList");

  let lastWordCount = 0;
  let currentUser = null;
  let authBusy = false;

  const FREE_SCAN_LIMIT = 3;
  const FREE_SCAN_KEY = "truthai_free_scans_used";

  const firebaseConfig = {
    apiKey: "AIzaSyBTfH0NhDeTmxjhwjxYgr7YzK4V4zQrcI4",
    authDomain: "truthai-project1.firebaseapp.com",
    projectId: "truthai-project1",
    storageBucket: "truthai-project1.firebasestorage.app",
    messagingSenderId: "627323022305",
    appId: "1:627323022305:web:3a49f49bc659397f8040a0"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  const googleProvider = new firebase.auth.GoogleAuthProvider();

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

  function getFreeScansUsed() {
    return Number(localStorage.getItem(FREE_SCAN_KEY) || "0");
  }

  function addFreeScanUsed() {
    const used = getFreeScansUsed();
    localStorage.setItem(FREE_SCAN_KEY, String(used + 1));
  }

  function isVerifiedUser(user) {
    if (!user) return false;
    const signedInWithGoogle = user.providerData.some(provider => provider.providerId === "google.com");
    return signedInWithGoogle || user.emailVerified;
  }

  function setAuthView(view) {
    authLoginView.classList.add("hidden");
    authSignupView.classList.add("hidden");
    authVerifyView.classList.add("hidden");
    authAccountView.classList.add("hidden");
    authBackBtn.classList.add("hidden");

    if (view === "login") authLoginView.classList.remove("hidden");
    if (view === "signup") {
      authSignupView.classList.remove("hidden");
      authBackBtn.classList.remove("hidden");
    }
    if (view === "verify") {
      authVerifyView.classList.remove("hidden");
      authBackBtn.classList.remove("hidden");
    }
    if (view === "account") authAccountView.classList.remove("hidden");
  }

  function openAuthModal(message = "") {
    authMessage.innerText = message;

    if (currentUser) {
      accountName.innerText = currentUser.displayName || "No name set";
      accountEmail.innerText = currentUser.email || "Logged in";
      setAuthView("account");
    } else {
      setAuthView("login");
    }

    authModal.classList.remove("hidden");
  }

  function closeModal() {
    authModal.classList.add("hidden");
    authMessage.innerText = "";
  }

  function friendlyAuthError(error) {
    const code = error?.code || "";

    if (code === "auth/email-already-in-use") return "An account already exists with that email.";
    if (code === "auth/invalid-email") return "Enter a valid email address.";
    if (code === "auth/missing-password") return "Enter your password.";
    if (code === "auth/weak-password") return "Password should be at least 6 characters.";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") return "Incorrect email or password.";
    if (code === "auth/user-not-found") return "No account found with that email.";
    if (code === "auth/popup-closed-by-user") return "Login was cancelled.";
    if (code === "auth/cancelled-popup-request") return "A login window is already open.";
    if (code === "auth/unauthorized-domain") return "Login is not enabled for this domain yet.";
    if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";

    return "Something went wrong. Please try again.";
  }

  function updateAuthUI() {
    if (currentUser) {
      authButton.innerText = "Account";
      accountName.innerText = currentUser.displayName || "No name set";
      accountEmail.innerText = currentUser.email || "Logged in";
    } else {
      authButton.innerText = "Login";
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

 auth.onAuthStateChanged(user => {
  currentUser = user;
  updateAuthUI();

  if (user && isVerifiedUser(user)) {
    loadRecentScans();
  } else {
    recentScansList.innerHTML = "";
    recentScansSidebar.classList.add("hidden");
  }
});

function addScanToSidebar(scan, newest = false) {
  const button = document.createElement("button");
  button.className = "scan-item";
  button.innerText = scan.title || "Untitled Scan";

  button.addEventListener("click", () => {
    textInput.value = scan.inputText || "";
    verdict.innerText = scan.resultText || "Error retrieving saved scan.";

    inputArea.classList.add("hidden");
    resultArea.classList.remove("hidden");

    verdict.style.fontSize = "";
    verdict.style.color = "";

    updateWordCount();
    updateUploadButton();
  });

  if (newest) {
    recentScansList.prepend(button);
  } else {
    recentScansList.appendChild(button);
  }
}

async function loadRecentScans() {
  if (!currentUser || !isVerifiedUser(currentUser)) return;

  recentScansList.innerHTML = "";
  recentScansSidebar.classList.remove("hidden");

  const snapshot = await db.collection("scans")
    .where("userId", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  snapshot.forEach(doc => {
    addScanToSidebar({
      id: doc.id,
      ...doc.data()
    });
  });
}

async function saveScan(scan) {
  if (!currentUser || !isVerifiedUser(currentUser)) return;

  const docRef = await db.collection("scans").add({
    userId: currentUser.uid,
    title: scan.title || "Untitled Scan",
    inputText: scan.inputText || "",
    resultText: scan.resultText || "",
    wordCount: scan.wordCount || 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  addScanToSidebar({
    id: docRef.id,
    title: scan.title || "Untitled Scan",
    inputText: scan.inputText || "",
    resultText: scan.resultText || "",
    wordCount: scan.wordCount || 0
  }, true);
}

  authButton.addEventListener("click", () => openAuthModal());
  closeAuthModal.addEventListener("click", () => closeModal());
  authBackBtn.addEventListener("click", () => {
    authMessage.innerText = "";
    setAuthView("login");
  });
  backToLoginBtn.addEventListener("click", () => {
    authMessage.innerText = "";
    setAuthView("login");
  });

  authModal.addEventListener("click", event => {
    if (event.target === authModal) closeModal();
  });

  googleLoginBtn.addEventListener("click", async () => {
    if (authBusy) return;

    try {
      authBusy = true;
      authMessage.innerText = "";
      await auth.signInWithPopup(googleProvider);
      closeModal();
    } catch (error) {
      authMessage.innerText = friendlyAuthError(error);
    } finally {
      authBusy = false;
    }
  });

  emailLoginBtn.addEventListener("click", async () => {
    try {
      authMessage.innerText = "";
      await auth.signInWithEmailAndPassword(authEmail.value, authPassword.value);
      await auth.currentUser.reload();
      currentUser = auth.currentUser;

      if (!isVerifiedUser(currentUser)) {
        await auth.signOut();
        setAuthView("verify");
        authMessage.innerText = "Please verify your email before logging in.";
        return;
      }

      closeModal();
    } catch (error) {
      authMessage.innerText = friendlyAuthError(error);
    }
  });

  showSignupBtn.addEventListener("click", () => {
    authMessage.innerText = "";
    signupName.value = "";
    signupEmail.value = authEmail.value;
    signupPassword.value = "";
    setAuthView("signup");
  });

  emailSignupBtn.addEventListener("click", async () => {
    try {
      authMessage.innerText = "";

      const name = signupName.value.trim();

      if (!name) {
        authMessage.innerText = "Enter your name.";
        return;
      }

      const credential = await auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value);

      await credential.user.updateProfile({
        displayName: name
      });

      await credential.user.sendEmailVerification();
      await auth.signOut();

      setAuthView("verify");
      authMessage.innerText = "Verification email sent. Check your inbox.";
    } catch (error) {
      authMessage.innerText = friendlyAuthError(error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    closeModal();
  });

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

    if (!currentUser && getFreeScansUsed() >= FREE_SCAN_LIMIT) {
      inputArea.classList.remove("hidden");
      resultArea.classList.add("hidden");
      openAuthModal("Free limit reached. Login for unlimited scans.");
      return;
    }

    if (currentUser && !isVerifiedUser(currentUser)) {
      inputArea.classList.remove("hidden");
      resultArea.classList.add("hidden");
      openAuthModal("Please verify your email before continuing.");
      return;
    }

    verdict.innerText = "Analyzing content...";

    try {
      const headers = { "Content-Type": "application/json" };

      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ text: textInput.value })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Server error");

      verdict.innerText = data.result || "Error retrieving analysis.";

      if (currentUser && isVerifiedUser(currentUser)) {
  await saveScan({
    title: data.title || "Untitled Scan",
    inputText: textInput.value,
    resultText: verdict.innerText,
    wordCount: getWordCount(textInput.value)
  });
}

      if (!currentUser) addFreeScanUsed();
    } catch (e) {
      verdict.style.fontSize = "24px";
      verdict.style.color = "red";
      verdict.innerText = "ERROR: Unable to analyze right now. Please try again.";
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
  updateAuthUI();
});
