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
  const logo = document.getElementById("logo");

  const authButton = document.getElementById("authButton");
  const authModal = document.getElementById("authModal");
  const closeAuthModal = document.getElementById("closeAuthModal");
  const authBackBtn = document.getElementById("authBackBtn");
  const authLoginView = document.getElementById("authLoginView");
  const authSignupView = document.getElementById("authSignupView");
  const authResetView = document.getElementById("authResetView");
  const authVerifyView = document.getElementById("authVerifyView");
  const authAccountView = document.getElementById("authAccountView");
  const googleLoginBtn = document.getElementById("googleLoginBtn");
  const emailLoginBtn = document.getElementById("emailLoginBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const showSignupBtn = document.getElementById("showSignupBtn");
  const emailSignupBtn = document.getElementById("emailSignupBtn");
  const sendResetEmailBtn = document.getElementById("sendResetEmailBtn");
  const backToLoginBtn = document.getElementById("backToLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const authEmail = document.getElementById("authEmail");
  const authPassword = document.getElementById("authPassword");
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const resetEmail = document.getElementById("resetEmail");
  const authMessage = document.getElementById("authMessage");
  const accountName = document.getElementById("accountName");
  const accountEmail = document.getElementById("accountEmail");

  const recentScansSidebar = document.getElementById("recentScansSidebar");
  const scanSearchTop = document.getElementById("scanSearchTop");
  const scanSearchBtn = document.getElementById("scanSearchBtn");
  const scanSearchBtnInside = document.getElementById("scanSearchBtnInside");
  const recentScansSearch = document.getElementById("recentScansSearch");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const backToRecentScansBtn = document.getElementById("backToRecentScansBtn");
  const recentScansTitle = document.getElementById("recentScansTitle");
  const recentScansList = document.getElementById("recentScansList");

  const saveScanArea = document.getElementById("saveScanArea");
  const showSaveScanBtn = document.getElementById("showSaveScanBtn");
  const saveScanForm = document.getElementById("saveScanForm");
  const scanTitleInput = document.getElementById("scanTitleInput");
  const confirmSaveScanBtn = document.getElementById("confirmSaveScanBtn");
  const saveScanMessage = document.getElementById("saveScanMessage");

  let lastWordCount = 0;
  let currentUser = null;
  let authBusy = false;
  let modalMouseDownTarget = null;
  let currentScanData = null;
  let currentScanSaved = false;
  let loadedScans = [];

  const FREE_SCAN_LIMIT = 3;
  const FREE_SCAN_KEY = "truthai_free_scans_used";
  const THEME_KEY = "truthai_theme_preference";

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

  function normalizeNameSpaces(name) {
    return name.trim().replace(/\s+/g, " ");
  }

  function getFirstName(fullName) {
    return normalizeNameSpaces(fullName).split(" ")[0];
  }

  function containsBlockedNameWord(name) {
    const blockedWords = [
      "nigga",
      "nigger",
      "penis",
      "vagina",
      "pussy",
      "cunt",
      "butt",
      "asshole",
      "cock",
      "chink",
      "beaner",
      "ass",
      "fuck",
      "fucker",
      "dick",
      "puta"
    ];

    const normalized = name.toLowerCase();

    return blockedWords.some(word =>
      normalized.includes(word)
    );
  }

  function validateFullName(fullName) {
    const cleanName = normalizeNameSpaces(fullName);

    if (!cleanName) {
      return "Enter your name.";
    }

    if (cleanName.length > 24) {
      return "Name must be 24 characters or less.";
    }

    const spaces = (cleanName.match(/ /g) || []).length;

    if (spaces !== 1) {
      return "Name must be first and last name.";
    }

    const hyphens = (cleanName.match(/-/g) || []).length;

    if (hyphens > 1) {
      return "Name can only contain one hyphen.";
    }

    if (!/^[A-Za-z -]+$/.test(cleanName)) {
      return "Name can only contain letters.";
    }

    if (containsBlockedNameWord(cleanName)) {
      return "This name violates our guidelines.";
    }

    return "";
  }

  async function saveUserProfile(user, fullName) {
    const cleanName = normalizeNameSpaces(fullName);

    await db.collection("users").doc(user.uid).set({
      fullName: cleanName,
      firstName: getFirstName(cleanName),
      email: user.email || "",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async function getAccountDisplayName(user) {
    if (!user) return "No name set";

    try {
      const doc = await db.collection("users").doc(user.uid).get();

      if (doc.exists && doc.data().fullName) {
        return doc.data().fullName;
      }
    } catch {
      // Fall back to Firebase Auth displayName below.
    }

    return user.displayName || "No name set";
  }


  function showAuthError(message) {
    authMessage.style.color = "#f87171";
    authMessage.innerText = message;
  }

  function showAuthSuccess(message) {
    authMessage.style.color = "#34d399";
    authMessage.innerText = message;
  }

  function applyTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle("light-mode", isLight);

    localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");

    if (themeToggleBtn) {
      themeToggleBtn.classList.toggle("active", isLight);
    }

    if (logo) {
      logo.src = isLight
        ? (logo.dataset.lightLogo || "favicon-light-mode.png")
        : (logo.dataset.darkLogo || "favicon.png");
    }
  }

  async function loadUserTheme(user) {
    const cachedTheme = localStorage.getItem(THEME_KEY);

    if (cachedTheme === "light" || cachedTheme === "dark") {
      applyTheme(cachedTheme);
    }

    if (!user || !isVerifiedUser(user)) {
      applyTheme("dark");
      return;
    }

    try {
      const doc = await db.collection("users").doc(user.uid).get();
      const theme = doc.exists && doc.data().theme === "light" ? "light" : "dark";

      applyTheme(theme);
    } catch {
      applyTheme(cachedTheme === "light" ? "light" : "dark");
    }
  }

  async function saveUserTheme(theme) {
    if (!currentUser || !isVerifiedUser(currentUser)) return;

    applyTheme(theme);

    await db.collection("users").doc(currentUser.uid).set({
      theme,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }


  function setAuthView(view) {
    authLoginView.classList.add("hidden");
    authSignupView.classList.add("hidden");
    authResetView.classList.add("hidden");
    authVerifyView.classList.add("hidden");
    authAccountView.classList.add("hidden");
    authBackBtn.classList.add("hidden");

    if (view === "login") authLoginView.classList.remove("hidden");
    if (view === "signup") {
      authSignupView.classList.remove("hidden");
      authBackBtn.classList.remove("hidden");
    }
    if (view === "reset") {
      authResetView.classList.remove("hidden");
      authBackBtn.classList.remove("hidden");
    }
    if (view === "verify") {
      authVerifyView.classList.remove("hidden");
      authBackBtn.classList.remove("hidden");
    }
    if (view === "account") authAccountView.classList.remove("hidden");
  }

  async function openAuthModal(message = "") {
    showAuthError(message);

    if (currentUser) {
      accountName.innerText = await getAccountDisplayName(currentUser);
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

  async function updateAuthUI() {
    if (currentUser) {
      authButton.innerText = "Account";
      accountName.innerText = await getAccountDisplayName(currentUser);
      accountEmail.innerText = currentUser.email || "Logged in";
    } else {
      authButton.innerText = "Login";
    }
  }

  function resetSaveScanUI() {
    saveScanArea.classList.add("hidden");
    saveScanForm.classList.add("hidden");
    showSaveScanBtn.classList.remove("hidden");
    scanTitleInput.value = "";
    saveScanMessage.innerText = "";
    currentScanData = null;
    currentScanSaved = false;
  }

  function showSaveOption() {
    if (!currentUser || !isVerifiedUser(currentUser)) {
      resetSaveScanUI();
      return;
    }

    if (!currentScanData || currentScanSaved) {
      resetSaveScanUI();
      return;
    }

    saveScanArea.classList.remove("hidden");
    saveScanForm.classList.add("hidden");
    showSaveScanBtn.classList.remove("hidden");
    saveScanMessage.innerText = "";
  }

  function addScanToSidebar(scan) {
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

      currentScanData = null;
      currentScanSaved = true;
      resetSaveScanUI();

      updateWordCount();
      updateUploadButton();
    });

    recentScansList.appendChild(button);
  }

  authButton.addEventListener("click", () => openAuthModal());
  closeAuthModal.addEventListener("click", () => closeModal());

  authBackBtn.addEventListener("click", () => {
    showAuthError("");
    setAuthView("login");
  });

  backToLoginBtn.addEventListener("click", () => {
    showAuthError("");
    setAuthView("login");
  });

  authModal.addEventListener("mousedown", event => {
    modalMouseDownTarget = event.target;
  });

  authModal.addEventListener("click", event => {
    const clickedBackdrop = event.target === authModal;
    const startedBackdrop = modalMouseDownTarget === authModal;

    if (clickedBackdrop && startedBackdrop) {
      closeModal();
    }
  });

  googleLoginBtn.addEventListener("click", async () => {
    if (authBusy) return;

    try {
      authBusy = true;
      showAuthError("");
      await auth.signInWithPopup(googleProvider);

      if (auth.currentUser?.displayName) {
        await saveUserProfile(auth.currentUser, auth.currentUser.displayName);
      }

      closeModal();
    } catch (error) {
      showAuthError(friendlyAuthError(error));
    } finally {
      authBusy = false;
    }
  });

  emailLoginBtn.addEventListener("click", async () => {
    try {
      showAuthError("");
      await auth.signInWithEmailAndPassword(authEmail.value, authPassword.value);
      await auth.currentUser.reload();
      currentUser = auth.currentUser;

      if (!isVerifiedUser(currentUser)) {
        await auth.signOut();
        setAuthView("verify");
        showAuthError("Please verify your email before logging in.");
        return;
      }

      closeModal();
    } catch (error) {
      showAuthError(friendlyAuthError(error));
    }
  });

  authPassword.addEventListener("keydown", event => {
if (event.key === "Enter") {
emailLoginBtn.click();
}
});

  forgotPasswordBtn.addEventListener("click", () => {
    showAuthError("");
    resetEmail.value = authEmail.value;
    setAuthView("reset");
  });

  sendResetEmailBtn.addEventListener("click", async () => {
    try {
      showAuthError("");

      if (!resetEmail.value.trim()) {
        showAuthError("Enter your email.");
        return;
      }

      sendResetEmailBtn.disabled = true;
      sendResetEmailBtn.innerText = "Sending...";

      await auth.sendPasswordResetEmail(resetEmail.value.trim(), {
        url: "https://truthai.online/reset-password.html",
        handleCodeInApp: true
      });

      showAuthSuccess("Password reset email sent.");
    } catch (error) {
      showAuthError(friendlyAuthError(error));
    } finally {
      sendResetEmailBtn.disabled = false;
      sendResetEmailBtn.innerText = "Send Reset Link";
    }
  });

  showSignupBtn.addEventListener("click", () => {
    showAuthError("");
    signupName.value = "";
    signupEmail.value = authEmail.value;
    signupPassword.value = "";
    setAuthView("signup");
  });

  emailSignupBtn.addEventListener("click", async () => {
    if (authBusy) return;

    try {
      authBusy = true;

      emailSignupBtn.disabled = true;
      emailSignupBtn.innerText = "Creating...";

      showAuthError("");

      const fullName = normalizeNameSpaces(signupName.value);
      const nameError = validateFullName(fullName);
      const email = signupEmail.value.trim();

      if (nameError) {
        showAuthError(nameError);
        return;
      }

      if (!email) {
        showAuthError("Enter your email.");
        return;
      }

      const methods = await auth.fetchSignInMethodsForEmail(email);

      if (methods.some(method => method === "google.com")) {
        showAuthError("This email is already connected to Google. Please continue with Google.");
        return;
      }

      if (methods.some(method => method === "password")) {
        showAuthError("An account already exists with that email.");
        return;
      }

      const credential = await auth.createUserWithEmailAndPassword(
        email,
        signupPassword.value
      );

      await credential.user.updateProfile({
        displayName: getFirstName(fullName)
      });

      await saveUserProfile(credential.user, fullName);

      await credential.user.sendEmailVerification();
      await auth.signOut();

      setAuthView("verify");
      showAuthSuccess("Verification email sent. Check your inbox.");
    } catch (error) {
      showAuthError(friendlyAuthError(error));
    } finally {
      authBusy = false;
      emailSignupBtn.disabled = false;
      emailSignupBtn.innerText = "Create Account";
    }
  });


  themeToggleBtn.addEventListener("click", async () => {
    if (!currentUser || !isVerifiedUser(currentUser)) return;

    const nextTheme = document.body.classList.contains("light-mode")
      ? "dark"
      : "light";

    try {
      await saveUserTheme(nextTheme);
    } catch {
      applyTheme("dark");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    closeModal();
  });

  showSaveScanBtn.addEventListener("click", () => {
    if (!currentUser || !isVerifiedUser(currentUser)) {
      openAuthModal("Login to save scans.");
      return;
    }

    showSaveScanBtn.classList.add("hidden");
    saveScanForm.classList.remove("hidden");
    scanTitleInput.focus();
  });

  confirmSaveScanBtn.addEventListener("click", async () => {
    try {
      saveScanMessage.style.color = "#475569";
      saveScanMessage.innerText = "";
      await saveScan(scanTitleInput.value);
    } catch {
      saveScanMessage.style.color = "#f87171";
      saveScanMessage.innerText = "Could not save scan.";
    }
  });

  function runScanSearch() {
    const query = recentScansSearch.value.trim().toLowerCase();

    if (!query) return;

    recentScansTitle.innerText = "Search Results";

    const filtered = loadedScans.filter(scan => {
      const title = (scan.title || "").toLowerCase();
      const inputText = (scan.inputText || "").toLowerCase();
      const resultText = (scan.resultText || "").toLowerCase();

      return (
        title.includes(query) ||
        inputText.includes(query) ||
        resultText.includes(query)
      );
    });

    renderScansList(filtered);
  }

  function openScanSearch() {
    recentScansSidebar.classList.add("search-active");

    setTimeout(() => {
      recentScansSearch.focus();
    }, 120);
  }

  function closeScanSearch() {
    recentScansSearch.value = "";
    updateClearSearchButton();
    recentScansTitle.innerText = "Recent Scans";
    recentScansSidebar.classList.remove("search-active");
    renderScansList(loadedScans);
  }

  function updateClearSearchButton() {
    if (!clearSearchBtn) return;

    clearSearchBtn.classList.toggle(
      "visible",
      recentScansSearch.value.trim().length > 0
    );
  }

  scanSearchBtn.addEventListener("click", openScanSearch);

  scanSearchBtnInside.addEventListener("click", runScanSearch);

  recentScansSearch.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      runScanSearch();
    }
  });

  recentScansSearch.addEventListener("input", updateClearSearchButton);

  clearSearchBtn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    recentScansSearch.value = "";
    updateClearSearchButton();
    recentScansSearch.focus();

    recentScansTitle.innerText = "Recent Scans";
    renderScansList(loadedScans);
  });

  backToRecentScansBtn.addEventListener("click", closeScanSearch);

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
    resetSaveScanUI();

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

      verdict.innerText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Error retrieving analysis.";

      currentScanData = {
        inputText: textInput.value,
        resultText: verdict.innerText,
        wordCount: getWordCount(textInput.value)
      };

      currentScanSaved = false;
      showSaveOption();

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

    resetSaveScanUI();

    textInput.focus();
    updateUploadButton();
  });

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "light") {
    applyTheme("light");
  } else {
    applyTheme("dark");
  }

  updateUploadButton();
  updateAuthUI();
});
