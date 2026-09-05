import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEeGZiQ_7Hpnp--6QmHEV8JDjgU0AEVhs",
  authDomain: "rightbite-e0afb.firebaseapp.com",
  projectId: "rightbite-e0afb",
  storageBucket: "rightbite-e0afb.firebasestorage.app",
  messagingSenderId: "905420901657",
  appId: "1:905420901657:web:23b277451b13247e878988",
  measurementId: "G-Z08C9X0651"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

const messages = {
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/missing-email": "Please enter your email address first.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled in Firebase.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/user-not-found": "No account was found with this email.",
  "auth/weak-password": "Please use a password with at least 6 characters."
};

function showMessage(element, text, isError = false) {
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("is-error", isError);
}

function firebaseErrorMessage(error) {
  return messages[error.code] || "Something went wrong. Please try again.";
}

const signupForm = document.querySelector("#signup-form");
const signupMessage = document.querySelector("#signup-message");
const passwordInput = document.querySelector("#signup-password");
const passwordRuleItems = document.querySelectorAll("#password-rules [data-rule]");

const passwordChecks = {
  length: (password) => password.length >= 8,
  lowercase: (password) => /[a-z]/.test(password),
  uppercase: (password) => /[A-Z]/.test(password),
  number: (password) => /\d/.test(password),
  special: (password) => /[^A-Za-z0-9]/.test(password)
};

function passwordStatus(password) {
  return Object.fromEntries(
    Object.entries(passwordChecks).map(([rule, check]) => [rule, check(password)])
  );
}

function isStrongPassword(password) {
  return Object.values(passwordStatus(password)).every(Boolean);
}

function updatePasswordRules(password) {
  const status = passwordStatus(password);

  passwordRuleItems.forEach((item) => {
    item.classList.toggle("is-valid", status[item.dataset.rule]);
  });
}

if (passwordInput) {
  updatePasswordRules(passwordInput.value);
  passwordInput.addEventListener("input", () => {
    updatePasswordRules(passwordInput.value);
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = signupForm.querySelector("button[type='submit']");
    const name = signupForm.elements.name.value.trim();
    const email = signupForm.elements.email.value.trim();
    const password = signupForm.elements.password.value;

    updatePasswordRules(password);

    if (!isStrongPassword(password)) {
      showMessage(signupMessage, "Please make your password stronger before creating an account.", true);
      return;
    }

    submitButton.disabled = true;
    showMessage(signupMessage, "Creating your account...");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }

      await sendEmailVerification(userCredential.user);
      showMessage(signupMessage, "Account created. Please check your email to verify before signing in.");
      signupForm.reset();
      updatePasswordRules("");
      submitButton.disabled = false;
    } catch (error) {
      showMessage(signupMessage, firebaseErrorMessage(error), true);
      submitButton.disabled = false;
    }
  });
}

const signinForm = document.querySelector("#signin-form");
const signinMessage = document.querySelector("#signin-message");
const forgotPasswordButton = document.querySelector("#forgot-password");
const googleSigninButton = document.querySelector("#google-signin");
const googleSignupButton = document.querySelector("#google-signup");

if (signinForm) {
  signinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = signinForm.querySelector("button[type='submit']");
    const email = signinForm.elements.email.value.trim();
    const password = signinForm.elements.password.value;

    submitButton.disabled = true;
    showMessage(signinMessage, "Signing you in...");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        showMessage(signinMessage, "Please verify your email first. We sent a new verification link.", true);
        submitButton.disabled = false;
        return;
      }

      showMessage(signinMessage, "Signed in successfully.");
      window.location.href = "searc.html";
    } catch (error) {
      showMessage(signinMessage, firebaseErrorMessage(error), true);
      submitButton.disabled = false;
    }
  });
}

if (forgotPasswordButton && signinForm) {
  forgotPasswordButton.addEventListener("click", async () => {
    const email = signinForm.elements.email.value.trim();

    if (!email) {
      showMessage(signinMessage, "Please enter your email address first.", true);
      return;
    }

    forgotPasswordButton.disabled = true;
    showMessage(signinMessage, "Sending password reset email...");

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage(signinMessage, "Password reset email sent. Please check your inbox.");
    } catch (error) {
      showMessage(signinMessage, firebaseErrorMessage(error), true);
    } finally {
      forgotPasswordButton.disabled = false;
    }
  });
}

function wireGoogleButton(button, messageElement, progressMessage) {
  if (!button) return;

  button.addEventListener("click", async () => {
    button.disabled = true;
    showMessage(messageElement, progressMessage);

    try {
      await signInWithPopup(auth, googleProvider);
      showMessage(messageElement, "Google sign-in successful.");
      window.location.href = "searc.html";
    } catch (error) {
      showMessage(messageElement, firebaseErrorMessage(error), true);
      button.disabled = false;
    }
  });
}

wireGoogleButton(googleSigninButton, signinMessage, "Opening Google sign-in...");
wireGoogleButton(googleSignupButton, signupMessage, "Opening Google sign-up...");
