import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({ baseURL: BASE_URL });

// attach/remove token on the axios instance
export function setToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
}

// Load token from storage on app boot
export function initTokenFromStorage() {
  const t = localStorage.getItem("token");
  if (t) api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
  return t;
}

// ---------------------------
// Transcript API Functions
// ---------------------------

/**
 * Upload a transcript file for verification
 * @param {File} file - The transcript file (PDF, PNG, or JPG)
 * @returns {Promise<{success: boolean, message: string, file_path: string, status: string}>}
 */
export async function uploadTranscript(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post("/tutors/transcript/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Trigger AI verification of the uploaded transcript
 * @returns {Promise<{success: boolean, status: string, verification_data: object}>}
 */
export async function verifyTranscript() {
  const response = await api.post("/tutors/transcript/verify");
  return response.data;
}

/**
 * Get the current transcript verification status
 * @returns {Promise<{has_transcript: boolean, status: string, verified_at: string, verification_data: object}>}
 */
export async function getTranscriptStatus() {
  const response = await api.get("/tutors/transcript/status");
  return response.data;
}

/**
 * Search for tutors with optional filters
 * @param {object} options - Search options
 * @param {string} options.subject - Filter by subject (non-strict/fuzzy matching)
 * @param {string} options.availability - Filter by availability (non-strict/fuzzy matching)
 * @param {boolean} options.verifiedOnly - Only show verified tutors
 * @returns {Promise<Array>}
 */
export async function searchTutors({ subject, availability, verifiedOnly = false } = {}) {
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (availability) params.append("availability", availability);
  if (verifiedOnly) params.append("verified_only", "true");
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get(`/tutors/search${query}`);
  return response.data;
}

/**
 * Get a specific tutor's details by ID
 * @param {string} tutorId - The tutor's UUID
 * @returns {Promise<object>}
 */
export async function getTutor(tutorId) {
  const response = await api.get(`/tutors/${tutorId}`);
  return response.data;
}

/**
 * Get contact information for an accepted help request
 * @param {string} requestId - The help request UUID
 * @returns {Promise<{student: {name, phone}, tutor: {name, phone, scheduling_link}}>}
 */
export async function getContactInfo(requestId) {
  const response = await api.get(`/help-requests/${requestId}/contact`);
  return response.data;
}
