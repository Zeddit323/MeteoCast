/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around fetch for all backend API calls.
 * All requests use credentials: 'include' so the httpOnly JWT cookie
 * is sent automatically by the browser.
 */

const BASE = "/api";

async function request(method, path, body) {
  const opts = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json.message || `API error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (email, password)          => request("POST",   "/auth/register",              { email, password }),
  login:          (email, password)          => request("POST",   "/auth/login",                 { email, password }),
  logout:         ()                         => request("POST",   "/auth/logout"),
  deleteAccount:  ()                         => request("DELETE", "/auth/delete-account"),
  forgotPassword: (email)                    => request("POST",   "/auth/forgot-password",        { email }),
  resetPassword:  (token, password)          => request("PATCH",  `/auth/reset-password/${token}`, { password }),
};

// ── Cities ────────────────────────────────────────────────────────────────────
export const citiesApi = {
  getAll:  ()                            => request("GET",    "/cities/me"),
  add:     (name, latitude, longitude)   => request("POST",   "/cities/me",         { name, latitude, longitude }),
  remove:  (cityId)                      => request("DELETE", `/cities/me/${cityId}`),
};
