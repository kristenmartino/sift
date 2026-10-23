/** @jest-environment node */
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
const mockLog=jest.fn();const mockRate=jest.fn();
jest.mock("@/lib/productAnalyticsLog",()=>({logProductEvent:(...a:unknown[])=>mockLog(...a)}));
jest.mock("@/lib/rate-limit",()=>({rateLimit:(...a:unknown[])=>mockRate(...a)}));
import {POST} from "@/app/api/analytics/events/route";
const env={...process.env};
function payload(){return {eventId:randomUUID(),schemaVersion:1,occurredAt:new Date().toISOString(),browserId:randomUUID(),sessionId:randomUUID(),eventName:"source_opened",entryPath:"news",internal:false,properties:{contentId:"abc"}};}
function req(body:unknown=payload(),headers:Record<string,string>={}) {
 return new NextRequest("https://siftnews.io/api/analytics/events",{method:"POST",headers:{origin:"https://siftnews.io","content-type":"application/json","user-agent":"Mozilla/5.0 Chrome/100",...headers},body:typeof body==="string"?body:JSON.stringify(body)});
}
beforeEach(()=>{process.env.PRODUCT_ANALYTICS_ENABLED="true";process.env.VERCEL_ENV="production";mockLog.mockReset().mockResolvedValue("accepted");mockRate.mockReset().mockReturnValue({allowed:true});});
afterAll(()=>{process.env=env;});
it("stores server-derived provenance and returns success only after persistence",async()=>{
 const e=payload();expect((await POST(req(e))).status).toBe(204);
 expect(mockLog).toHaveBeenCalledWith(e,{environment:"production",isInternal:false,trafficClass:"browser"});
});
it.each(["preview",undefined])("excludes %s environments",async v=>{if(v)process.env.VERCEL_ENV=v;else delete process.env.VERCEL_ENV;await POST(req());expect(mockLog.mock.calls[0][1].isInternal).toBe(true);});
it("marks configured browsers and client opt-in internal, never trusting client environment",async()=>{
 const e=payload();process.env.PRODUCT_ANALYTICS_INTERNAL_BROWSER_IDS=e.browserId;await POST(req(e));expect(mockLog.mock.calls[0][1].isInternal).toBe(true);
 await POST(req({...e,eventId:randomUUID(),internal:true}));expect(mockLog.mock.calls[1][1].isInternal).toBe(true);
 expect((await POST(req({...payload(),environment:"production"}))).status).toBe(400);
});
it.each([["curl/8","bot"],["mystery","unknown"],["Mozilla iPhone","browser"]])("classifies %s without asserting a verified person",async(ua,c)=>{await POST(req(payload(),{"user-agent":ua}));expect(mockLog.mock.calls[0][1].trafficClass).toBe(c);});
it.each(["dnt","sec-gpc"])("skips browser privacy preference %s",async h=>{expect((await POST(req(payload(),{[h]:"1"}))).status).toBe(204);expect(mockLog).not.toHaveBeenCalled();});
it("is inert without the server flag",async()=>{delete process.env.PRODUCT_ANALYTICS_ENABLED;expect((await POST(req())).status).toBe(204);expect(mockLog).not.toHaveBeenCalled();});
it.each(["https://evil.example",""])("rejects foreign/missing origins %s",async origin=>{expect((await POST(req(payload(),{origin}))).status).toBe(403);expect(mockLog).not.toHaveBeenCalled();});
it("rejects unsupported, malformed, oversized or unrecognized events",async()=>{
 expect((await POST(req(payload(),{"content-type":"text/plain"}))).status).toBe(415);
 expect((await POST(req(payload(),{"content-length":"5000"}))).status).toBe(413);
 expect((await POST(req("x".repeat(5000)))).status).toBe(413);
 expect((await POST(req("{"))).status).toBe(400);
 expect((await POST(req({...payload(),eventName:"arbitrary"}))).status).toBe(400);
});
it.each([-6*60000,25*60*60000])("rejects out-of-window event time %s",async age=>{expect((await POST(req({...payload(),occurredAt:new Date(Date.now()-age).toISOString()}))).status).toBe(400);});
it("enforces rate limits and exposes persistence failure/conflict rather than pretending success",async()=>{
 mockRate.mockReturnValueOnce({allowed:false});expect((await POST(req())).status).toBe(429);expect(mockLog).not.toHaveBeenCalled();
 mockLog.mockResolvedValueOnce("unavailable");expect((await POST(req())).status).toBe(503);
 mockLog.mockResolvedValueOnce("conflict");expect((await POST(req())).status).toBe(409);
 mockLog.mockResolvedValueOnce("duplicate");expect((await POST(req())).status).toBe(204);
});
