import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));
});

test("shows the selected city and the city list", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Tokyo" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Bogotá/ })).toBeInTheDocument();
});
