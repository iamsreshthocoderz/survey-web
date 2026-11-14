"use strict";
/* Survey definitions in Vercel KV — so a survey made on one phone can be
   opened from the share link on any other phone.
   POST /api/survey { survey: { id, code, title, desc, sections } }
     -> saves the definition, answers { ok:true, stored:true, code }.
   GET /api/survey?code=SRV-001 -> { ok:true, survey } or
     { ok:false, reason:"not_found", survey:null }.
   Env vars (Vercel dashboard only, never in code): KV_REST_API_URL / UPSTASH_REDIS_REST_URL,
   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN. No secret is ever returned. */

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
  var url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    res.status(200).json({ ok: false, reason: "backend_not_configured", survey: null });
    return;
  }
  if (req.method === "POST") {
    var body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) {
        res.status(400).json({ ok: false, reason: "bad_request" });
        return;
      }
    }
    if (!body || !body.survey || !body.survey.sections) {
      res.status(400).json({ ok: false, reason: "bad_request" });
      return;
    }
    var code = cleanCode(body.survey.code);
    if (!code) {
      res.status(400).json({ ok: false, reason: "bad_request" });
      return;
    }
    var def = {
      id: body.survey.id || ("s-" + code),
      code: code,
      title: body.survey.title || code,
      desc: body.survey.desc || "",
      sections: body.survey.sections
    };
    try {
      await kvCall(url, token, "/set/survey:def:" + code + "/" + encodeURIComponent(JSON.stringify(def)), "POST");
      await kvCall(url, token, "/sadd/survey:codes/" + encodeURIComponent(code), "POST");
      res.status(200).json({ ok: true, stored: true, code: code });
    } catch (e) {
      res.status(200).json({ ok: false, reason: "backend_error" });
    }
    return;
  }
  if (req.method === "GET") {
    var getCode = cleanCode((req.query && req.query.code) || "");
    if (!getCode) {
      res.status(400).json({ ok: false, reason: "bad_request", survey: null });
      return;
    }
    try {
      var raw = await kvCall(url, token, "/get/survey:def:" + getCode);
      if (!raw) {
        res.status(200).json({ ok: false, reason: "not_found", survey: null });
        return;
      }
      res.status(200).json({ ok: true, survey: JSON.parse(raw) });
    } catch (e) {
      res.status(200).json({ ok: false, reason: "backend_error", survey: null });
    }
    return;
  }
  res.status(405).json({ ok: false, reason: "method_not_allowed" });
};
