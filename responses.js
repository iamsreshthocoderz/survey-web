"use strict";
/* GET /api/responses?code=SRV-001 — read shared responses from Vercel KV.
   GET /api/responses?code=all — read every survey's responses + definitions
   (used by the Admin Dashboard to discover surveys made on other devices).
   Env vars (Vercel dashboard only, never in code): KV_REST_API_URL / UPSTASH_REDIS_REST_URL,
   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN. No secret is ever returned. */

function cleanCode(v) {
  return String(v || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
}

function kvCall(url, token, path) {
  return fetch(url.replace(/\/+$/, "") + path, {
    method: "GET",
    headers: { Authorization: "Bearer " + token }
  }).then(function (r) {
    return r.json().catch(function () { return {}; });
  }).then(function (data) {
    if (data && data.error) throw new Error(String(data.error).slice(0, 120));
    return data.result;
  });
}

function parseList(list) {
  var out = [];
  (list || []).forEach(function (item) {
    try { out.push(JSON.parse(item)); } catch (e) { /* skip one bad row */ }
  });
  return out.reverse(); /* LRANGE is newest-first; Admin expects oldest-first */
}

async function readOne(url, token, code) {
  var list = await kvCall(url, token, "/lrange/survey:responses:" + code + "/0/99");
  var defRaw = await kvCall(url, token, "/get/survey:def:" + code).catch(function () { return null; });
  var def = null;
  if (defRaw) { try { def = JSON.parse(defRaw); } catch (e) { def = null; } }
  return { code: code, survey: def, responses: parseList(list) };
}

module.exports = async function (req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }
  var url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    res.status(200).json({ ok: false, reason: "backend_not_configured", responses: [], surveys: [] });
    return;
  }
  var code = cleanCode((req.query && req.query.code) || "");
  try {
    if (code === "ALL") {
      var codes = await kvCall(url, token, "/smembers/survey:codes") || [];
      var surveys = [];
      var responses = [];
      var list = codes.slice(0, 50);
      for (var i = 0; i < list.length; i++) {
        var c = cleanCode(list[i]);
        if (!c) continue;
        var one = await readOne(url, token, c);
        if (one.survey) surveys.push(one.survey);
        responses = responses.concat(one.responses);
      }
      res.status(200).json({ ok: true, codes: codes, surveys: surveys, responses: responses });
      return;
    }
    if (!code) {
      res.status(400).json({ ok: false, reason: "bad_request", responses: [], surveys: [] });
      return;
    }
    var single = await readOne(url, token, code);
    res.status(200).json({
      ok: true,
      surveyCode: code,
      survey: single.survey,
      surveys: single.survey ? [single.survey] : [],
      responses: single.responses
    });
  } catch (e) {
    res.status(200).json({ ok: false, reason: "backend_error", responses: [], surveys: [] });
  }
};
