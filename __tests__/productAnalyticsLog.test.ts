/** @jest-environment node */
import {randomUUID} from "node:crypto";
const mockQuery=jest.fn();const mockReport=jest.fn();
jest.mock("@/lib/db",()=>({__esModule:true,default:{query:(...a:unknown[])=>mockQuery(...a)}}));
jest.mock("@/lib/observability",()=>({reportError:(...a:unknown[])=>mockReport(...a)}));
import {logProductEvent} from "@/lib/productAnalyticsLog";
import type {ProductEvent} from "@/lib/productAnalytics";
const event:ProductEvent={eventId:randomUUID(),schemaVersion:1,occurredAt:new Date().toISOString(),browserId:randomUUID(),sessionId:randomUUID(),entryPath:"news",internal:false,eventName:"source_opened",properties:{contentId:"abc"}};
const source={environment:"production",isInternal:false,trafficClass:"browser"} as const;
beforeEach(()=>{mockQuery.mockReset();mockReport.mockReset();});
it("binds fields, uses a server receipt time and stores one event for identical retries",async()=>{
 mockQuery.mockImplementation((_sql,p)=>({rows:[{payload_hash:p[11],inserted:true}]}));expect(await logProductEvent(event,source)).toBe("accepted");
 expect(mockQuery.mock.calls[0][1].slice(0,10)).toEqual([event.eventId,1,event.occurredAt,event.browserId,event.sessionId,"source_opened","news","production",false,"browser"]);
 mockQuery.mockImplementation((_sql,p)=>({rows:[{payload_hash:p[11],inserted:false}]}));expect(await logProductEvent(event,source)).toBe("duplicate");
});
it("compares canonical content and detects reused event IDs with different content",async()=>{
 mockQuery.mockResolvedValue({rows:[{payload_hash:"different",inserted:false}]});expect(await logProductEvent(event,source)).toBe("conflict");
 mockQuery.mockResolvedValue({rows:[]});expect(await logProductEvent(event,source)).toBe("unavailable");
});
it.each([Object.assign(new Error("secret payload"),{code:"42P01"}),new Error("secret payload")])("never throws or reports the raw database error",async err=>{
 mockQuery.mockRejectedValue(err);expect(await logProductEvent(event,source)).toBe("unavailable");expect(mockReport).toHaveBeenCalled();expect(String(mockReport.mock.calls[0][1])).not.toContain("secret");
});
