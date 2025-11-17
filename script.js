// ---------------- YOUR FIREBASE CONFIG ----------------
const firebaseConfig = {
    apiKey: "AIzaSyBcZfexa5X_7QhFwbBVihCRiN_A8w3li1k",
    authDomain: "attendance-system-f9dd0.firebaseapp.com",
    projectId: "attendance-system-f9dd0",
    storageBucket: "attendance-system-f9dd0.firebasestorage.app",
    messagingSenderId: "878182068092",
    appId: "1:878182068092:web:0375f82e9d7b2d00a47ef9"
 };
 // ------------------------------------------------------
 
 // Firebase imports
 import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
 import { 
   getFirestore,
   collection,
   doc,
   setDoc,
   serverTimestamp,
   getDocs,
   deleteDoc
 } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
 
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const db = getFirestore(app);
 
 // ------------ BATCHES & STUDENT LISTS ---------------
 const batches = {
   "A-11": ["Saumya", "Ankit", "Poonam", "Yuvraj", "Lakshit", "Tarun", "Ritik", "Jayendra", "Dakshit", "Anand"],
   "A-12": ["Rahul", "Ayush", "Sahil", "Garv", "Shivani", "Rubi", "Atin", "Tushar", "Gitesh", "Aditya"],
   "A-13": ["Shivam", "Ritika", "Suresh", "Rohit", "Ramesh", "Abhijeet", "Saksham", "Raj", "Aryan", "Siddharth"]
 };
 // ----------------------------------------------------
 
 
 // ============ CHECK IF CURRENT PAGE IS batch.html ============
 if (window.location.pathname.endsWith("batch.html")) {
 
   const params = new URLSearchParams(window.location.search);
   const batch = params.get("batch");
 
   document.getElementById("batchTitle").textContent = "Batch " + batch;
 
   const listDiv = document.getElementById("studentsList");
 
   // Load Students
   batches[batch].forEach(name => {
     const div = document.createElement("div");
     div.className = "student-item";
 
     div.innerHTML = `
       <input type="checkbox" name="student" value="${name}">
       <label>${name}</label>
     `;
 
     // Click whole row to toggle checkbox
     div.onclick = () => {
       const cb = div.querySelector("input");
       cb.checked = !cb.checked;
     };
 
     listDiv.appendChild(div);
   });
 
   // ------------------ SUBMIT ATTENDANCE ------------------
   document.getElementById("attendanceForm").onsubmit = async (e) => {
     e.preventDefault();
 
     const submitBtn = document.getElementById("submitBtn");
     const status = document.getElementById("status");
     const checkboxes = document.querySelectorAll("input[name='student']");
 
     const selected = [];
     checkboxes.forEach(cb => {
       if (cb.checked) selected.push(cb.value);
     });
 
     if (selected.length === 0) {
       status.textContent = "Select at least one student.";
       return;
     }
 
     // Disable button + show loading
     submitBtn.disabled = true;
     submitBtn.textContent = "Saving...";
     status.textContent = "Updating Attendance...";
 
     const today = new Date().toISOString().split("T")[0];
 
     try {
       // ⭐ STEP 1 — DELETE OLD ATTENDANCE
       const batchRef = collection(db, "attendance", batch, today);
       const snapshot = await getDocs(batchRef);
       snapshot.forEach(async (docItem) => {
         await deleteDoc(docItem.ref);
       });
 
       // ⭐ STEP 2 — SAVE NEW ATTENDANCE
       for (let name of selected) {
         await setDoc(doc(db, "attendance", batch, today, name), {
           name,
           present: true,
           time: serverTimestamp(),
           updatedAt: new Date().toLocaleString()  // readable time
         });
       }
 
       status.textContent = "Attendance Updated ✔️";
       submitBtn.textContent = "Saved ✔️";
 
     } catch (error) {
       console.error(error);
       status.textContent = "Error updating attendance!";
       submitBtn.textContent = "Error ❌";
     }
 
     // Reset after 2 seconds
     setTimeout(() => {
       submitBtn.disabled = false;
       submitBtn.textContent = "Submit Attendance";
       status.textContent = "";
     }, 2000);
   };
 }
 