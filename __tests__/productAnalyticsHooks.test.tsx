import {renderHook,act,cleanup} from "@testing-library/react";
import {useTopicSearch,useCompare} from "@/lib/hooks";
const mockTrack=jest.fn();const mockSSE=jest.fn();
const context={browserId:"browser",sessionId:"session",entryPath:"news",internal:false};
jest.mock("@/lib/productAnalyticsClient",()=>({captureAnalyticsContext:()=>context,analyticsHeaders:()=>({"x-sift-session-id":"session"}),trackProductEvent:(...a:unknown[])=>mockTrack(...a)}));
jest.mock("@/lib/sse",()=>({readSSE:(...a:unknown[])=>mockSSE(...a)}));
const fetchMock=jest.fn();
beforeEach(()=>{mockTrack.mockReset();mockSSE.mockReset();fetchMock.mockReset();global.fetch=fetchMock;});
afterEach(()=>{cleanup();jest.useRealTimers();});
it("pairs submitted/completed search events with one request/session and counts streamed results",async()=>{
 fetchMock.mockResolvedValue({ok:true});
 mockSSE.mockImplementation(async function*(){yield {event:"results",data:{articles:[{id:"a"},{id:"b"}]}};yield {event:"done",data:{matchQuality:"strong",fallbackUsed:false}};});
 const {result}=renderHook(()=>useTopicSearch());await act(async()=>{await result.current.search("private topic");});
 const start=mockTrack.mock.calls.find(a=>a[0]==="search_submitted");const end=mockTrack.mock.calls.find(a=>a[0]==="search_completed");
 expect(end).toEqual(["search_completed",expect.objectContaining({requestId:start[1].requestId,status:"success",resultCount:2}),context]);
 expect(fetchMock.mock.calls[0][1].headers).toEqual({"x-sift-session-id":"session"});expect(JSON.stringify(mockTrack.mock.calls)).not.toContain("private topic");
});
it("does not label partial, prematurely closed streams as successful search",async()=>{
 fetchMock.mockResolvedValue({ok:true});mockSSE.mockImplementation(async function*(){yield {event:"results",data:{articles:[{id:"a"}]}};});
 const {result}=renderHook(()=>useTopicSearch());await act(async()=>{await result.current.search("topic");});
 expect(mockTrack).toHaveBeenLastCalledWith("search_completed",expect.objectContaining({status:"incomplete",resultCount:1}),context);
});
it("records explicit search errors and zero-result success distinctly",async()=>{
 fetchMock.mockResolvedValue({ok:true});mockSSE.mockImplementation(async function*(){yield {event:"error",data:{message:"failed"}};});
 const {result}=renderHook(()=>useTopicSearch());await act(async()=>{await result.current.search("topic");});
 expect(mockTrack).toHaveBeenLastCalledWith("search_completed",expect.objectContaining({status:"error",resultCount:0}),context);
 mockSSE.mockImplementation(async function*(){yield {event:"done",data:{matchQuality:"weak",fallbackUsed:false}};});
 await act(async()=>{await result.current.search("other");});expect(mockTrack).toHaveBeenLastCalledWith("search_completed",expect.objectContaining({status:"success",resultCount:0}),context);
});
it("records user-cancelled search without turning it into a timeout",async()=>{
 fetchMock.mockImplementation((_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>reject(new DOMException("cancelled","AbortError")))));
 const {result}=renderHook(()=>useTopicSearch());await act(async()=>{const pending=result.current.search("topic");result.current.clear();await pending;});
 expect(mockTrack).toHaveBeenLastCalledWith("search_completed",expect.objectContaining({status:"cancelled"}),context);
});
it("records JSON and streaming comparison successes without emitting a view from the hook",async()=>{
 const data={topic:"private topic",comparison:"Text",sources_checked:["A","B"],claims:[],duration_ms:10};
 fetchMock.mockResolvedValue({ok:true,headers:new Headers({"content-type":"application/json"}),json:async()=>data});
 const {result}=renderHook(()=>useCompare());await act(async()=>{await result.current.compare("private topic");});
 const firstId=result.current.requestId;expect(firstId).toBeTruthy();
 expect(mockTrack).toHaveBeenLastCalledWith("comparison_completed",expect.objectContaining({requestId:firstId,status:"success"}),context);
 fetchMock.mockResolvedValue({ok:true,headers:new Headers({"content-type":"text/event-stream"}),body:{}});
 mockSSE.mockImplementation(async function*(){yield {event:"results",data};});
 await act(async()=>{await result.current.compare("private topic");});expect(result.current.requestId).not.toBe(firstId);
 expect(mockTrack.mock.calls.some(a=>a[0]==="comparison_viewed")).toBe(false);expect(JSON.stringify(mockTrack.mock.calls)).not.toContain("private topic");
});
it("records failed/auth-blocked comparisons and cancelled requests",async()=>{
 fetchMock.mockResolvedValue({ok:false,status:401,json:async()=>({error:"Unauthorized"})});
 const {result}=renderHook(()=>useCompare());await act(async()=>{await result.current.compare("topic");});
 expect(mockTrack).toHaveBeenLastCalledWith("comparison_completed",expect.objectContaining({status:"error"}),context);
 fetchMock.mockImplementation((_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener("abort",()=>reject(new DOMException("cancelled","AbortError")))));
 await act(async()=>{const pending=result.current.compare("topic");result.current.clear();await pending;});
 expect(mockTrack).toHaveBeenLastCalledWith("comparison_completed",expect.objectContaining({status:"cancelled"}),context);
});
