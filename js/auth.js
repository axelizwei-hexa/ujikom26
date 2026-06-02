import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const loginButton = document.getElementById('loginButton');
const message = document.getElementById('loginMessage');
const isFileProtocol = window.location.protocol === 'file:';

console.log('auth.js loaded');

if (isFileProtocol) {
  if (message) {
    message.textContent = 'Buka halaman ini lewat server lokal (http://localhost) atau Live Server agar Firebase Authentication dapat bekerja.';
    message.className = 'form-message error';
  }
  if (loginButton) {
    loginButton.disabled = true;
  }
}

async function handleLogin() {
  console.log('handleLogin called');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (!emailInput || !passwordInput) {
    if (message) {
      message.textContent = 'Form login tidak lengkap.';
      message.className = 'form-message error';
    }
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    if (message) {
      message.textContent = 'Email dan password harus diisi.';
      message.className = 'form-message error';
    }
    return;
  }

  if (message) {
    message.textContent = 'Memproses...';
    message.className = 'form-message';
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    if (message) {
      message.textContent = 'Berhasil masuk! Mengalihkan...';
      message.className = 'form-message success';
    }
    setTimeout(() => (window.location.href = 'dashboard.html'), 800);
  } catch (err) {
    console.error(err);
    let errorText = 'Gagal masuk. Periksa email dan password.';
    if (err.code === 'auth/user-not-found') {
      errorText = 'Email tidak terdaftar.';
    } else if (err.code === 'auth/wrong-password') {
      errorText = 'Password salah.';
    } else if (err.code === 'auth/invalid-email') {
      errorText = 'Email tidak valid.';
    } else if (err.code === 'auth/network-request-failed') {
      errorText = 'Gagal terhubung ke jaringan. Periksa koneksi internet.';
    } else if (err.code === 'auth/operation-not-allowed') {
      errorText = 'Metode login belum diaktifkan di Firebase Authentication.';
    } else if (err.code === 'auth/app-not-authorized') {
      errorText = 'Domain tidak diizinkan di Firebase Auth. Tambahkan localhost ke authorized domains.';
    }
    if (message) {
      message.textContent = `${errorText} ${err.code ? '(' + err.code + ')' : ''}`;
      message.className = 'form-message error';
    }
  }
}

if (loginButton) {
  loginButton.addEventListener('click', handleLogin);
}

export async function logout() {
  await signOut(auth);
  window.location.href = 'login.html';
}

window.togglePassword = function () {
  const pass = document.getElementById('password');
  const btn = document.querySelector('.toggle-pass-btn');
  if (!pass) return;
  if (pass.type === 'password') {
    pass.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pass.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
};