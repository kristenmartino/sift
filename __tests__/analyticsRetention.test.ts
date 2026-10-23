/** @jest-environment node */
import {NextRequest} from "next/server";
const mockQuery=jest.fn();
jest.mock("@/lib/db",()=>({__esModule:true,default:{query:(...a:unknown[])=>mockQuery(...a)}}));
jest.mock("@/lib/observability",()=>({reportError:jest.fn()}));
import {GET} from "@/app/api/cron/analytics-retention/route";
const req=(token="Bearer test-secret")=>new NextRequest("https://siftnews.io/api/cron/analytics-retention",{headers:{authorization:token}});
beforeEach(()=>{process.env.CRON_SECRET="test-secret";mockQuery.mockReset().mockResolvedValue({rowCount:3});});
afterAll(()=>{delete process.env.CRON_SECRET;});
it("requires the configured cron credential before deleting anything",async()=>{
 expect((await GET(req("wrong"))).status).toBe(401);expect(mockQuery).not.toHaveBeenCalled();delete process.env.CRON_SECRET;expect((await GET(req())).status).toBe(503);
});
it("deletes only events older than 90 days and reports failure",async()=>{
 const res=await GET(req());expect(await res.json()).toEqual({deleted:3});expect(mockQuery.mock.calls[0][0]).toContain("received_at < now() - interval '90 days'");
 mockQuery.mockRejectedValue(new Error("db"));expect((await GET(req())).status).toBe(503);
});
