import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "@/components/ErrorState";
import { COPY } from "@/lib/copy";

describe("ErrorState", () => {
  it("renders error message", () => {
    render(<ErrorState message="Something broke" onRetry={() => {}} />);
    expect(screen.getByText("Something broke")).toBeInTheDocument();
    expect(screen.getByText(COPY.error.title)).toBeInTheDocument();
  });

  it("renders fallback message when none provided", () => {
    render(<ErrorState message="" onRetry={() => {}} />);
    expect(screen.getByText(COPY.error.body)).toBeInTheDocument();
  });

  it("calls onRetry when button clicked", () => {
    const onRetry = jest.fn();
    render(<ErrorState message="Error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText(COPY.error.button));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
