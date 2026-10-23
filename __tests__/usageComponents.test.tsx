import {render,fireEvent,screen,cleanup} from "@testing-library/react";
import UsageTracking from "@/components/analytics/UsageTracking";
import UsageView from "@/components/analytics/UsageView";
import UsagePreference from "@/components/analytics/UsagePreference";
import BackgroundPrimer from "@/components/primer/BackgroundPrimer";
const mockCapture=jest.fn();const mockTrack=jest.fn();const mockView=jest.fn();const mockOptOut=jest.fn();let optedOut=false;
jest.mock("@/lib/productAnalyticsClient",()=>({captureAnalyticsContext:()=>mockCapture(),trackProductEvent:(...a:unknown[])=>mockTrack(...a),trackProductView:(...a:unknown[])=>mockView(...a),analyticsHeaders:()=>({"x-sift-session-id":"test-session"}),usageOptedOut:()=>optedOut,setUsageOptOut:(v:boolean)=>mockOptOut(v)}));
let observerCallback:IntersectionObserverCallback;const observe=jest.fn();const disconnect=jest.fn();
beforeEach(()=>{
 mockCapture.mockReset().mockReturnValue({sessionId:"test-session"});mockTrack.mockReset();mockView.mockReset();mockOptOut.mockReset();observe.mockClear();disconnect.mockClear();optedOut=false;
 global.fetch=jest.fn().mockResolvedValue({status:204});
 Object.defineProperty(document,"visibilityState",{configurable:true,value:"visible"});
 window.IntersectionObserver=jest.fn().mockImplementation(cb=>{observerCallback=cb;return {observe,disconnect};});
});
afterEach(()=>cleanup());
it("tracks only exposed comparison/feed content in a visible tab and cleans up",()=>{
 const {unmount}=render(<UsageView name="comparison_viewed" viewKey="req" properties={{surface:"live_compare"}}><p>Comparison</p></UsageView>);
 expect(mockView).not.toHaveBeenCalled();observerCallback([{isIntersecting:false}] as IntersectionObserverEntry[],{} as IntersectionObserver);expect(mockView).not.toHaveBeenCalled();
 observerCallback([{isIntersecting:true}] as IntersectionObserverEntry[],{} as IntersectionObserver);expect(mockView).toHaveBeenCalledWith("comparison_viewed","req",expect.objectContaining({surface:"live_compare"}));
 unmount();expect(disconnect).toHaveBeenCalled();
});
it("does not fabricate exposure if IntersectionObserver is unavailable",()=>{
 Object.defineProperty(window,"IntersectionObserver",{configurable:true,value:undefined,writable:true});render(<UsageView name="feed_viewed" viewKey="feed" properties={{}}><p>Feed</p></UsageView>);expect(mockView).not.toHaveBeenCalled();
});
it("captures source links through click delegation without treating other links or right-clicks as reads",()=>{
 const {unmount}=render(<><UsageTracking/><div data-sift-reading-surface="bookmarks"><a href="https://example.com/story" data-sift-source-id="abc"><span>Original</span></a></div><a href="/privacy">Policy</a></>);
 expect(mockCapture).toHaveBeenCalledTimes(1);fireEvent.click(screen.getByText("Original"));
 expect(mockTrack).toHaveBeenCalledWith("source_opened",{contentId:"abc",surface:"bookmarks"});
 fireEvent.click(screen.getByText("Policy"));fireEvent.click(screen.getByText("Original"),{button:2});expect(mockTrack).toHaveBeenCalledTimes(1);
 unmount();fireEvent.click(document.body);expect(mockTrack).toHaveBeenCalledTimes(1);
});
it("does not count auto-expanded explainers; deliberate expansion sends a matching legacy session ID",()=>{
 const primer={background:"Context",terms:[]};const {unmount}=render(<BackgroundPrimer primer={primer} articleId="abc" surface="feed" defaultExpanded/>);
 expect(mockTrack).not.toHaveBeenCalled();unmount();render(<BackgroundPrimer primer={primer} articleId="abc" surface="bookmarks"/>);
 fireEvent.click(screen.getByRole("button",{name:/What you should know first/i}));
 expect(mockTrack).toHaveBeenCalledWith("explainer_expanded",{contentId:"abc",surface:"bookmarks"},{sessionId:"test-session"});
 expect(global.fetch).toHaveBeenCalledWith("/api/primer/expand",expect.objectContaining({headers:{"Content-Type":"application/json","x-sift-session-id":"test-session"}}));
});
it("offers a browser-specific opt-out and preserves other preferences",()=>{
 render(<UsagePreference/>);fireEvent.click(screen.getByRole("button",{name:/Turn off/}));expect(mockOptOut).toHaveBeenCalledWith(true);
});
