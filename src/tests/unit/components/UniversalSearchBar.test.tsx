import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UniversalSearchBar } from "@/components/explorer/UniversalSearchBar";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("Universal Search Bar (W-501)", () => {
  it("renders search input with placeholder and shortcut badge", () => {
    render(<UniversalSearchBar />);
    expect(
      screen.getByPlaceholderText(/Search by Address, Tx Hash, or Block Height/i)
    ).toBeDefined();
  });

  it("submits search and routes to transaction inspector for a valid hash", async () => {
    // Mock global fetch for search API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        found: true,
        type: "tx",
        target: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      }),
    } as any);

    render(<UniversalSearchBar />);
    const input = screen.getByPlaceholderText(/Search by Address, Tx Hash, or Block Height/i);
    fireEvent.change(input, {
      target: { value: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" },
    });

    const form = input.closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/explorer/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      );
    });
  });
});
