import "@testing-library/jest-dom"
import { render, screen } from "@testing-library/react"
import HomePage from "../page"

jest.mock("../../components/CaseDashboard", () => {
  return function CaseDashboard() {
    return <div>CaseDashboard Component</div>
  }
})

jest.mock("../../components/HomeClient", () => {
  return function HomeClient() {
    return <div>HomeClient Component</div>
  }
})

describe("HomePage", () => {
  it("should render the hero section", () => {
    render(<HomePage />)

    expect(screen.getByText("Innocence Ledger")).toBeInTheDocument()
    expect(screen.getByText(/支援の透明性と匿名性を、/)).toBeInTheDocument()
  })

  it("should render dashboard and action panel", () => {
    render(<HomePage />)

    expect(screen.getByText("CaseDashboard Component")).toBeInTheDocument()
    expect(screen.getByText("HomeClient Component")).toBeInTheDocument()
  })
})
