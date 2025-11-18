// ---------------- YOUR FIREBASE CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBcZfexa5X_7QhFwbBVihCRiN_A8w3li1k",
  authDomain: "attendance-system-f9dd0.firebaseapp.com",
  projectId: "attendance-system-f9dd0",
  storageBucket: "attendance-system-f9dd0.appspot.com",
  messagingSenderId: "878182068092",
  appId: "1:878182068092:web:0375f82e9d7b2d00a47ef9"
};
// ------------------------------------------------------

// Firebase v10 modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Initialize Firebase (ONLY ONCE)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ------------------ LOCAL BATCHES (fallback) ------------------
const batches = {
  "A-11": ["Saumya", "Ankit", "Poonam", "Yuvraj", "Lakshit", "Tarun", "Ritik", "Jayendra", "Dakshit", "Anand"],
  "A-12": ["Rahul", "Ayush", "Sahil", "Garv", "Shivani", "Rubi", "Atin", "Tushar", "Gitesh", "Aditya"],
  "A-13": ["Shivam", "Ritika", "Suresh", "Rohit", "Ramesh", "Abhijeet", "Saksham", "Raj", "Aryan", "Siddharth"]
};

// ------------------ LOGIN PAGE HANDLER ------------------
if (document.getElementById("loginBtn")) {
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;

    const statusEl = document.getElementById("loginStatus");
    statusEl.textContent = "Logging in...";

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = "selectBatch.html";
    } catch (err) {
      statusEl.textContent = "❌ " + err.message;
    }
  });
}

// ------------------ AUTH PROTECTION & LOGOUT ------------------
onAuthStateChanged(auth, (user) => {
  // Protect pages that require login
  const path = window.location.pathname;
  if (!user && (path.includes("selectBatch.html") || path.includes("batch.html"))) {
    window.location.href = "index.html";
  }
});

// Logout button (works on pages that have this button)
if (document.getElementById("logoutBtn")) {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// ===================== BATCH PAGE =====================
if (document.getElementById("batchTitle")) {
  (async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const batchName = urlParams.get("batch") || "";
    document.getElementById("batchTitle").textContent = "Batch: " + batchName;

    const studentsListEl = document.getElementById("studentsList");
    const statusEl = document.getElementById("status");

    // First try Firestore: collection path assumed -> "batches/{batch}/students"
    async function loadFromFirestore(batch) {
      try {
        const colRef = collection(db, "batches", batch, "students");
        const snap = await getDocs(colRef);
        if (snap.empty) return null; // signal that Firestore has no data here

        const students = [];
        snap.forEach(docItem => {
          const data = docItem.data();
          // Accept either `name` field or fallback to document id
          const name = data.name || data.fullName || docItem.id;
          students.push({ id: docItem.id, name });
        });
        return students;
      } catch (err) {
        console.warn("Firestore load error:", err);
        return null;
      }
    }

    // Fallback load from local batches object
    function loadFromLocal(batch) {
      const arr = batches[batch] || [];
      return arr.map((name, idx) => ({ id: `${batch.replace(/[^a-z0-9]/gi,'')}_${idx}`, name }));
    }

    async function renderStudents(batch) {
      studentsListEl.innerHTML = "Loading students...";
      let students = await loadFromFirestore(batch);

      if (!students || students.length === 0) {
        // fallback to local list
        students = loadFromLocal(batch);
      }

      if (!students || students.length === 0) {
        studentsListEl.innerHTML = "<p>No students found for this batch.</p>";
        return;
      }

      studentsListEl.innerHTML = "";
      students.forEach(student => {
        // create row
        const row = document.createElement("div");
        row.className = "student-item";

        // make checkbox id unique
        const checkboxId = `chk_${student.id}`;

        row.innerHTML = `
          <input type="checkbox" id="${checkboxId}" name="student" value="${student.name}">
          <label for="${checkboxId}">${student.name}</label>
        `;

        // clicking row toggles checkbox (but not if clicking the input directly)
        row.addEventListener("click", (ev) => {
          if (ev.target.tagName.toLowerCase() === "input") return;
          const cb = row.querySelector("input");
          cb.checked = !cb.checked;
        });

        studentsListEl.appendChild(row);
      });
    }

    await renderStudents(batchName);

    // Submit Attendance handler
    document.getElementById("attendanceForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submitBtn");
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
      statusEl.textContent = "Updating attendance...";

      // collect checked names
      const checked = Array.from(document.querySelectorAll("input[name='student']:checked"))
        .map(inp => inp.value);

      if (checked.length === 0) {
        statusEl.textContent = "Select at least one student.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Attendance";
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Attempt to save to Firestore under collection path: attendance/{batch}/{today}/{studentName}
      try {
        // Delete existing docs under attendance/{batch}/{today} if any
        // Note: Firestore nested collection deletion must list docs then delete
        const attendanceCol = collection(db, "attendance", batchName, today);
        const oldSnap = await getDocs(attendanceCol);
        const deletePromises = [];
        oldSnap.forEach(d => {
          deletePromises.push(deleteDoc(d.ref));
        });
        await Promise.all(deletePromises);

        // Save each present student as a document (doc id = cleaned student name)
        const savePromises = checked.map(name => {
          const idSafe = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const docRef = doc(db, "attendance", batchName, today, idSafe);
          return setDoc(docRef, {
            name,
            present: true,
            time: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
            updatedAt: new Date().toLocaleString()
          });
        });

        await Promise.all(savePromises);

        statusEl.textContent = "Attendance Updated ✔️";
        submitBtn.textContent = "Saved ✔️";
      } catch (err) {
        console.error("Save error:", err);
        statusEl.textContent = "Error saving attendance.";
        submitBtn.textContent = "Error ❌";
      }

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Attendance";
        statusEl.textContent = "";
      }, 1500);
    });
  })();
}

// Export signOut if other modules/pages import this file as module
export { signOut, auth };
