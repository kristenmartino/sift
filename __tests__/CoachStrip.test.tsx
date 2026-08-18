/**
 * CoachStrip: the first-run pointer above the feed.
 *
 * Written alongside the fix for `react-hooks/set-state-in-effect` (the effect
 * that flipped `visible` became a `useSyncExternalStore` read). The visible
 * behaviour is subtle enough — shows once, never again, survives a storage
 * throw — that changing how it reads localStorage should not have been done
 * without something asserting the outcome.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import CoachStrip from "@/components/CoachStrip";
import { STORAGE_KEYS } from "@/lib/constants";
import { COPY } from "@/lib/copy";

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("CoachStrip", () => {
  it("shows the pointer on a first visit", () => {
    render(<CoachStrip />);
    expect(screen.getByText(COPY.coach.body)).toBeInTheDocument();
  });

  it("renders nothing once the flag is stored", () => {
    localStorage.setItem(STORAGE_KEYS.seenIntro, "1");
    const { container } = render(<CoachStrip />);
    expect(container).toBeEmptyDOMElement();
  });

  it("dismissing hides it and records the flag so it does not return", () => {
    render(<CoachStrip />);
    fireEvent.click(screen.getByRole("button", { name: COPY.coach.dismissAria }));

    expect(screen.queryByText(COPY.coach.body)).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.seenIntro)).toBe("1");

    // The flag is what makes it stick — a fresh mount stays empty.
    const { container } = render(<CoachStrip />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on the server, so hydration cannot mismatch", () => {
    // The server has no localStorage, so the server snapshot must say "seen".
    // This is the whole reason the component reads through
    // useSyncExternalStore rather than a plain read: markup that showed the
    // strip on the server would flip to empty on the client for a returning
    // reader. jsdom `render()` never calls getServerSnapshot, so nothing else
    // in this file can catch that.
    expect(renderToString(<CoachStrip />)).toBe("");
  });

  it("stays hidden when localStorage throws, rather than showing every visit", () => {
    // Safari private mode. Reading it as "seen" is the deliberate choice: a
    // strip that cannot record its dismissal would reappear forever.
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const { container } = render(<CoachStrip />);
    expect(container).toBeEmptyDOMElement();
  });

  it("survives a failed write on dismiss without breaking the UI", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    render(<CoachStrip />);
    fireEvent.click(screen.getByRole("button", { name: COPY.coach.dismissAria }));
    // Dismissed for this session even though the flag could not be recorded.
    expect(screen.queryByText(COPY.coach.body)).not.toBeInTheDocument();
  });
});
