import {render,fireEvent,screen} from "@testing-library/react";
import UsagePreference from "@/components/analytics/UsagePreference";
import {captureAnalyticsContext,ANALYTICS_STORAGE_KEY,ANALYTICS_OPTOUT_KEY} from "@/lib/productAnalyticsClient";
it("the actual control removes identifiers and prevents further event writes",()=>{
 process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED="true";localStorage.clear();
 const mockFetch=jest.fn().mockResolvedValue({status:204});global.fetch=mockFetch;
 expect(captureAnalyticsContext()).not.toBeNull();render(<UsagePreference/>);
 fireEvent.click(screen.getByRole("button",{name:/Turn off/}));
 expect(localStorage.getItem(ANALYTICS_OPTOUT_KEY)).toBe("1");expect(localStorage.getItem(ANALYTICS_STORAGE_KEY)).toBeNull();
 expect(screen.getByRole("button",{name:/Allow usage/})).toBeInTheDocument();
 mockFetch.mockClear();expect(captureAnalyticsContext()).toBeNull();expect(mockFetch).not.toHaveBeenCalled();
 delete process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED;
});
