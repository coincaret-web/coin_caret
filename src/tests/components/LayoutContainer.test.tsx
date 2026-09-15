import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LayoutContainer } from "@/components/layout/LayoutContainer";

describe("LayoutContainer Component", () => {
  it("renders children properly with responsive 15% desktop margin classes", () => {
    render(
      <LayoutContainer data-testid="container">
        <p>Test Content</p>
      </LayoutContainer>
    );

    const container = screen.getByTestId("container");
    expect(container).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(container.className).toContain("lg:px-[15%]");
    expect(container.className).toContain("px-4");
  });

  it("supports clean mode without default padding", () => {
    render(
      <LayoutContainer data-testid="clean-container" clean>
        <p>Clean Content</p>
      </LayoutContainer>
    );

    const container = screen.getByTestId("clean-container");
    expect(container.className).not.toContain("lg:px-[15%]");
  });
});
