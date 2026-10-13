import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import MoneyInput from '../MoneyInput'

describe('MoneyInput', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with initial values', () => {
    render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        data-testid="test-money-input"
      />
    )

    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TRY')).toBeInTheDocument()
    expect(screen.getByText('Test Amount')).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        data-testid="test-money-input"
      />
    )

    const amountInput = screen.getByTestId('test-money-input-amount')
    fireEvent.change(amountInput, { target: { value: '200' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      value: 200,
      currency: 'TRY'
    })
  })

  it('calls onChange when currency changes', () => {
    render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        data-testid="test-money-input"
      />
    )

    const currencySelect = screen.getByTestId('test-money-input-currency')
    fireEvent.change(currencySelect, { target: { value: 'USD' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      value: 100,
      currency: 'USD'
    })
  })

  it('handles disabled state', () => {
    render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        disabled={true}
        data-testid="test-money-input"
      />
    )

    const amountInput = screen.getByTestId('test-money-input-amount')
    const currencySelect = screen.getByTestId('test-money-input-currency')

    expect(amountInput).toBeDisabled()
    expect(currencySelect).toBeDisabled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles min and step attributes', () => {
    render(
      <MoneyInput
        label="Test Amount"
        value={100}
        currency="TRY"
        onChange={mockOnChange}
        min={10}
        step={0.5}
        data-testid="test-money-input"
      />
    )

    const amountInput = screen.getByTestId('test-money-input-amount')
    expect(amountInput).toHaveAttribute('min', '10')
    expect(amountInput).toHaveAttribute('step', '0.5')
  })
})
