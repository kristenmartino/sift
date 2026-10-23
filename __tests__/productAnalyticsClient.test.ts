import { ANALYTICS_STORAGE_KEY, captureAnalyticsContext,
  analyticsHeaders, trackProductEvent, trackProductView, setUsageOptOut, usageOptedOut } from "@/lib/productAnalyticsClient";
import { BROWSER_LIFETIME_MS, SESSION_IDLE_MS } from "@/lib/productAnalytics";
import { productEventSchema } from "@/lib/productAnalyticsSchema";
const fetchMock = jest.fn();
const originalFlag = process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED;
const events = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));
beforeEach(() => {
  jest.useFakeTimers(); jest.setSystemTime(new Date("2026-10-23T12:00:00Z"));
  localStorage.clear(); fetchMock.mockReset().mockResolvedValue({ status: 204 }); global.fetch = fetchMock;
  process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED = "true";
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: "0" });
  Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: false });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
afterAll(() => { if (originalFlag === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED; else process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED = originalFlag; });

it("uses distinct stable browser/session IDs and emits one valid session event across reload-like calls", () => {
  const a = captureAnalyticsContext(); const b = captureAnalyticsContext();
  expect(a).toEqual(b); expect(a!.browserId).not.toBe(a!.sessionId);
  expect(events().map(e => e.eventName)).toEqual(["session_started"]);
  expect(productEventSchema.safeParse(events()[0]).success).toBe(true);
  expect(analyticsHeaders(a)).toEqual({ "x-sift-session-id": a!.sessionId });
  expect(analyticsHeaders(null)).toEqual({});
});
it("rotates sessions at exactly 30 idle minutes while preserving browser identity", () => {
  const a = captureAnalyticsContext()!;
  jest.advanceTimersByTime(SESSION_IDLE_MS - 1); expect(captureAnalyticsContext()!.sessionId).toBe(a.sessionId);
  jest.advanceTimersByTime(SESSION_IDLE_MS); const b = captureAnalyticsContext()!;
  expect(b.browserId).toBe(a.browserId); expect(b.sessionId).not.toBe(a.sessionId);
  expect(events()).toHaveLength(2);
});
it("rotates the browser after 90 days, not on every return visit", () => {
  const a = captureAnalyticsContext()!; jest.advanceTimersByTime(BROWSER_LIFETIME_MS);
  expect(captureAnalyticsContext()!.browserId).not.toBe(a.browserId);
});
it("shares sessions with another tab and resets a corrupt, malformed or future-dated identity", () => {
  const a = captureAnalyticsContext()!;
  expect(a).not.toBeNull();
  for (const value of ['{', '{}', JSON.stringify({ browserId: a.browserId, sessionId: a.sessionId, createdAt: Date.now()+1 })]) {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, value);
    expect(captureAnalyticsContext()!.browserId).not.toBe(a.browserId);
  }
});
it("rolls the session on explicitly marking a browser internal", () => {
  const a = captureAnalyticsContext()!; localStorage.setItem("sift-usage-internal", "1");
  const b = captureAnalyticsContext()!; expect(b.internal).toBe(true); expect(b.browserId).toBe(a.browserId); expect(b.sessionId).not.toBe(a.sessionId);
});
it.each(["false", undefined])("creates no identifier or event when flag is %s", flag => {
  if (flag === undefined) delete process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED; else process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED = flag;
  expect(captureAnalyticsContext()).toBeNull(); trackProductEvent("feed_viewed");
  expect(fetchMock).not.toHaveBeenCalled(); expect(localStorage.getItem(ANALYTICS_STORAGE_KEY)).toBeNull();
});
it.each(["dnt", "gpc", "local"])("honors %s and clears local IDs", mode => {
  captureAnalyticsContext(); fetchMock.mockClear();
  if (mode === "dnt") Object.defineProperty(navigator,"doNotTrack",{value:"1"});
  if (mode === "gpc") Object.defineProperty(navigator,"globalPrivacyControl",{value:true});
  if (mode === "local") setUsageOptOut(true);
  expect(usageOptedOut()).toBe(true); expect(captureAnalyticsContext()).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled(); expect(localStorage.getItem(ANALYTICS_STORAGE_KEY)).toBeNull();
});
it("can re-enable local measurement without restoring the old browser ID", () => {
  const a=captureAnalyticsContext()!;setUsageOptOut(true);setUsageOptOut(false);
  expect(usageOptedOut()).toBe(false);expect(captureAnalyticsContext()!.browserId).not.toBe(a.browserId);
});
it("emits nothing when storage is unavailable, rather than fabricating users", () => {
  jest.spyOn(Storage.prototype,"getItem").mockImplementation(()=>{throw new Error("blocked");});
  expect(usageOptedOut()).toBe(true);expect(captureAnalyticsContext()).toBeNull();expect(fetchMock).not.toHaveBeenCalled();
});
it("does not leak storage failures into reading", () => {
  jest.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw new Error("quota");});
  expect(captureAnalyticsContext()).toBeNull(); expect(()=>setUsageOptOut(true)).not.toThrow(); expect(fetchMock).not.toHaveBeenCalled();
});
it("preserves the request session when a response finishes after a new session starts", () => {
  const a=captureAnalyticsContext()!;jest.advanceTimersByTime(SESSION_IDLE_MS);const b=captureAnalyticsContext()!;
  trackProductEvent("search_completed",{requestId:crypto.randomUUID(),status:"success",resultCount:0},a);
  expect(events().at(-1).sessionId).toBe(a.sessionId);expect(a.sessionId).not.toBe(b.sessionId);
  expect(productEventSchema.safeParse(events().at(-1)).success).toBe(true);
});
it("skips disabled/null contexts and deduplicates visible views per session", () => {
  trackProductEvent("feed_viewed",{},null);expect(fetchMock).not.toHaveBeenCalled();
  trackProductView("comparison_viewed","one",{surface:"daily_compare"});
  trackProductView("comparison_viewed","one",{surface:"daily_compare"});
  expect(events().filter(e=>e.eventName==="comparison_viewed")).toHaveLength(1);
  Object.defineProperty(document,"visibilityState",{value:"hidden"});
  trackProductView("comparison_viewed","two",{});
  expect(events()).toHaveLength(2);
  Object.defineProperty(document,"visibilityState",{value:"visible"});jest.advanceTimersByTime(SESSION_IDLE_MS);
  trackProductView("comparison_viewed","one",{});
  expect(events().filter(e=>e.eventName==="comparison_viewed")).toHaveLength(2);
});
it("retries an unavailable write once with the exact same event ID and payload", async () => {
  fetchMock.mockResolvedValueOnce({status:503});captureAnalyticsContext();
  await jest.advanceTimersByTimeAsync(1000);
  expect(fetchMock).toHaveBeenCalledTimes(2);expect(events()[0]).toEqual(events()[1]);
});
it("retries network failures once but never conflicts/client errors", async () => {
  fetchMock.mockRejectedValueOnce(new Error("offline"));captureAnalyticsContext();
  await jest.advanceTimersByTimeAsync(1000);expect(fetchMock).toHaveBeenCalledTimes(2);
  fetchMock.mockClear().mockResolvedValue({status:409});trackProductEvent("source_opened",{contentId:"abc"});
  await jest.advanceTimersByTimeAsync(1000);expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("cancels retry transmission after opt-out and swallows a synchronous fetch failure", async () => {
  fetchMock.mockResolvedValueOnce({status:503});captureAnalyticsContext();await Promise.resolve();setUsageOptOut(true);
  await jest.advanceTimersByTimeAsync(1000);expect(fetchMock).toHaveBeenCalledTimes(1);
  setUsageOptOut(false);fetchMock.mockImplementation(()=>{throw new Error("blocked");});
  expect(()=>trackProductEvent("feed_viewed")).not.toThrow();
});
it("records route buckets without storing query strings or URL paths", () => {
  expect(events()).toEqual([]);
  for(const [path,expected] of [["/","home"],["/news?q=private","news"],["/terms/private-topic","context"],["/privacy","other"]]) {
    localStorage.clear();window.history.replaceState({},"",path);
    expect(captureAnalyticsContext()!.entryPath).toBe(expected);
    expect(JSON.stringify(events().at(-1))).not.toContain("private");
  }
});
it("validates event names, UUIDs, counts and forbids unexpected personal fields", () => {
  captureAnalyticsContext();const e=events()[0];
  expect(productEventSchema.safeParse(e).success).toBe(true);
  for(const patch of [{eventName:"unknown"},{browserId:"IP-address"},{properties:{query:"private"}},{properties:{resultCount:-1}},{email:"test@example.com"}]) {
    expect(productEventSchema.safeParse({...e,...patch}).success).toBe(false);
  }
});

it("does not break reading when randomUUID is unavailable in an older or insecure browser", () => {
  const original = window.crypto.randomUUID;
  Object.defineProperty(window.crypto, "randomUUID", {configurable:true,value:undefined});
  expect(captureAnalyticsContext()).toBeNull();
  expect(()=>trackProductEvent("feed_viewed")).not.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
  Object.defineProperty(window.crypto, "randomUUID", {configurable:true,value:original});
});
