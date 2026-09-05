import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { AccessDenied, EmptyState, ErrorState } from "./index";

describe("ErrorState", () => {
  test("says something useful with nothing passed", () => {
    render(<ErrorState />);
    expect(screen.getByText(/went wrong/i)).toBeVisible();
  });

  /* The one risk the gap analysis named for this component: a shared panel that
     swallows the specific message which would have told someone what actually
     broke. The detail is a slot, and it is kept. */
  test("keeps the specific message rather than replacing it", () => {
    render(<ErrorState detail="ECONNREFUSED 127.0.0.1:3200" />);
    expect(screen.getByText("ECONNREFUSED 127.0.0.1:3200")).toBeVisible();
  });

  test("the caller's own words win over the defaults", () => {
    render(<ErrorState title="That report could not be built" description="The ledger service did not answer." />);
    expect(screen.getByText("That report could not be built")).toBeVisible();
    expect(screen.queryByText(/went wrong/i)).toBeNull();
  });

  /* Retry logic in one place is the reason this exists. A panel that only says
     "something went wrong" leaves reloading the whole page as the only move. */
  test("offers a retry when there is something to retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  test("and none when there is not", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  /* A failure a screen reader never hears is a screen that looks like it is
     still loading. */
  test("announces itself", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeVisible();
  });

  test("a caller can add its own action beside the retry", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} action={<button type="button">Go back</button>} />);
    expect(screen.getByRole("button", { name: "Go back" })).toBeVisible();
    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  });
});

describe("AccessDenied", () => {
  test("says what is refused, not what broke", () => {
    render(<AccessDenied />);
    expect(screen.getByText(/do not have access/i)).toBeVisible();
    expect(screen.queryByText(/went wrong/i)).toBeNull();
  });

  /* "Ask someone" is only actionable if it says what to ask for. */
  test("carries the reason it was refused", () => {
    render(<AccessDenied detail="This window belongs to another tenant." />);
    expect(screen.getByText("This window belongs to another tenant.")).toBeVisible();
  });

  test("offers no retry, because trying again changes nothing", () => {
    render(<AccessDenied />);
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  test("but takes an action the caller supplies", async () => {
    const onClose = vi.fn();
    render(<AccessDenied action={<button type="button" onClick={onClose}>Close this window</button>} />);
    await userEvent.click(screen.getByRole("button", { name: "Close this window" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("announces itself too", () => {
    render(<AccessDenied />);
    expect(screen.getByRole("alert")).toBeVisible();
  });
});

/* Three panels for three different situations, and a user should be able to tell
   which one they are looking at without reading the words. */
describe("the three states are distinguishable", () => {
  test("each says something the others do not", () => {
    const { unmount } = render(<EmptyState />);
    expect(screen.getByText(/No records found/i)).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();

    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByText(/No records found/i)).toBeNull();
  });
});
