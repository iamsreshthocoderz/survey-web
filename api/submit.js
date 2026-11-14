"use strict";
/* POST /api/submit — save one survey response into Vercel KV (Upstash Redis).
   No extra dependencies: talks to the Upstash Redis REST API with fetch.
   Env vars (Vercel dashboard only, never in code): KV_REST_API_URL / UPSTASH_REDIS_REST_URL,
   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN. Vercel adds both automatically when a KV database is
   connected to the project in Storage -> KV.
   If the backend is not connected, this still answers 200 with
   stored:false, so the respondent is NEVER blocked — the page also saves
   the answer locally and shows success. No secret is ever returned. */
var MAX_RESPONSES = 500;

function cleanCode(v) {
  return String(v || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

function kvCall(url, token, path, method) {
  return fetch(url.replace(/\/+$/, "") + path, {
    method: method || "GET",
    headers: { Authorization: "Bearer " + token }
  }).then(function (r) {
    return r.json().catch(function () { return {}; });
  }).then(function (data) {
    if (data && data.error) throw new Error(String(data.error).slice(0, 120));
    return data.result;
  });
}

module.exports = async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }
  var url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    res.status(200).json({ ok: true, stored: false, reason: "backend_not_configured" });
    return;
  }
  var body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) {
      res.status(400).json({ ok: false, reason: "bad_request" });
      return;
    }
  }
  if (!body || typeof body !== "object") {
    res.status(400).json({ ok: false, reason: "bad_request" });
    return;
  }
  var code = cleanCode(body.surveyCode || (body.survey && body.survey.code));
  if (!code || !body.answers || typeof body.answers !== "object") {
    res.status(400).json({ ok: false, reason: "bad_request" });
    return;
  }
  var now = new Date().toISOString();
  var rec = {
    id: body.id || ("r" + Date.now().toString(36)),
    surveyCode: code,
    surveyId: body.surveyId || "",
    answers: body.answers,
    at: body.at || body.submittedAt || now,
    submittedAt: body.submittedAt || body.at || now
  };
  try {
    var val = encodeURIComponent(JSON.stringify(rec));
    await kvCall(url, token, "/lpush/survey:responses:" + code + "/" + val, "POST");
    await kvCall(url, token, "/ltrim/survey:responses:" + code + "/0/" + (MAX_RESPONSES - 1), "POST");
    await kvCall(url, token, "/sadd/survey:codes/" + encodeURIComponent(code), "POST");
    if (body.survey && body.survey.sections) {
      var def = {
        id: body.survey.id || ("s-" + code),
        code: code,
        title: body.survey.title || code,
        desc: body.survey.desc || "",
        sections: body.survey.sections
      };
      await kvCall(url, token, "/set/survey:def:" + code + "/" + encodeURIComponent(JSON.stringify(def)), "POST");
    }
    res.status(200).json({ ok: true, stored: true, code: code });
  } catch (e) {
    res.status(200).json({ ok: true, stored: false, reason: "backend_error" });
  }
};
