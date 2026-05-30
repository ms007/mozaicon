import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { NumberInput, type NumberInputProps } from '@/components/NumberInput'

const defaults: NumberInputProps = {
  value: 10,
  onCommit: () => undefined,
  label: 'Width',
}

function renderInput(overrides: Partial<NumberInputProps> = {}) {
  return render(<NumberInput {...defaults} {...overrides} />)
}

function input() {
  return screen.getByRole('textbox')
}

describe('NumberInput', () => {
  describe('display', () => {
    it('shows the value as text', () => {
      renderInput({ value: 42 })
      expect(input()).toHaveValue('42')
    })

    it('formats with precision when provided', () => {
      renderInput({ value: 3.5, precision: 2 })
      expect(input()).toHaveValue('3.50')
    })

    it('syncs display when value prop changes while unfocused', () => {
      const { rerender } = render(<NumberInput {...defaults} value={10} />)
      expect(input()).toHaveValue('10')

      rerender(<NumberInput {...defaults} value={20} />)
      expect(input()).toHaveValue('20')
    })

    it('renders small magnitudes as plain decimals, not scientific notation', () => {
      renderInput({ value: 0.0000005 })
      expect(input()).toHaveValue('0.0000005')
    })
  })

  describe('commit on Enter', () => {
    it('fires onCommit once with the parsed value on Enter', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '25')
      await userEvent.keyboard('{Enter}')

      expect(onCommit).toHaveBeenCalledTimes(1)
      expect(onCommit).toHaveBeenCalledWith(25)
    })

    it('does not fire onCommit when value is unchanged', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.keyboard('{Enter}')

      expect(onCommit).not.toHaveBeenCalled()
    })
  })

  describe('commit on blur', () => {
    it('fires onCommit once on blur', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '30')
      await userEvent.tab()

      expect(onCommit).toHaveBeenCalledTimes(1)
      expect(onCommit).toHaveBeenCalledWith(30)
    })
  })

  describe('Escape reverts', () => {
    it('reverts buffer to value on Escape without firing onCommit', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '99')
      await userEvent.keyboard('{Escape}')

      expect(input()).toHaveValue('10')
      expect(onCommit).not.toHaveBeenCalled()
    })

    it('does not fire onCommit when Escape is followed by blur', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '99')
      await userEvent.keyboard('{Escape}')
      await userEvent.tab()

      expect(onCommit).not.toHaveBeenCalled()
    })

    it('restores the live onChange preview to value on Escape', async () => {
      const onChange = vi.fn()
      renderInput({ value: 10, step: 1, onChange })

      input().focus()
      await userEvent.keyboard('{ArrowUp}')
      expect(onChange).toHaveBeenLastCalledWith(11)

      await userEvent.keyboard('{Escape}')
      expect(onChange).toHaveBeenLastCalledWith(10)
    })
  })

  describe('arrow stepping', () => {
    it('increments by step on ArrowUp', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, step: 1, onCommit })

      input().focus()
      await userEvent.keyboard('{ArrowUp}')

      expect(input()).toHaveValue('11')
    })

    it('decrements by step on ArrowDown', async () => {
      renderInput({ value: 10, step: 1 })

      input().focus()
      await userEvent.keyboard('{ArrowDown}')

      expect(input()).toHaveValue('9')
    })

    it('steps by ×10 with Shift held', async () => {
      renderInput({ value: 10, step: 1 })

      input().focus()
      await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')

      expect(input()).toHaveValue('20')
    })

    it('steps by fineStep with Alt held (fine wins over coarse)', async () => {
      renderInput({ value: 10, step: 1, fineStep: 0.1 })

      input().focus()
      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')

      expect(input()).toHaveValue('10.1')
    })

    it('fine wins when both Shift and Alt are held', async () => {
      renderInput({ value: 10, step: 1, fineStep: 0.1 })

      input().focus()
      await userEvent.keyboard('{Shift>}{Alt>}{ArrowUp}{/Alt}{/Shift}')

      expect(input()).toHaveValue('10.1')
    })

    it('clamps stepped value to min/max', async () => {
      renderInput({ value: 9, step: 1, max: 10 })

      input().focus()
      await userEvent.keyboard('{ArrowUp}')
      expect(input()).toHaveValue('10')

      await userEvent.keyboard('{ArrowUp}')
      expect(input()).toHaveValue('10')
    })

    it('does not move the text caret on arrow keys', async () => {
      renderInput({ value: 10, step: 1 })

      input().focus()
      await userEvent.keyboard('{ArrowUp}')

      expect(input()).toHaveValue('11')
    })

    it('steps from value prop when buffer is invalid', async () => {
      renderInput({ value: 10, step: 1 })

      await userEvent.clear(input())
      await userEvent.type(input(), 'abc')
      await userEvent.keyboard('{ArrowUp}')

      expect(input()).toHaveValue('11')
    })

    it('Alt step falls back to the base step on an integer field (precision 0)', async () => {
      renderInput({ value: 10, step: 1, precision: 0 })

      input().focus()
      await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')

      expect(input()).toHaveValue('11')
    })

    it('preserves finer typed decimals when stepping by an integer', async () => {
      renderInput({ value: 10, step: 1 })

      await userEvent.clear(input())
      await userEvent.type(input(), '5.99')
      await userEvent.keyboard('{ArrowUp}')

      expect(input()).toHaveValue('6.99')
    })
  })

  describe('clamp on commit', () => {
    it('clamps typed value above max on commit', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, max: 100, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '200')
      await userEvent.keyboard('{Enter}')

      expect(onCommit).toHaveBeenCalledWith(100)
      expect(input()).toHaveValue('100')
    })

    it('clamps typed value below min on commit', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, min: 0, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), '-5')
      await userEvent.keyboard('{Enter}')

      expect(onCommit).toHaveBeenCalledWith(0)
      expect(input()).toHaveValue('0')
    })
  })

  describe('invalid/empty revert', () => {
    it('reverts to value on empty input commit', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.keyboard('{Enter}')

      expect(input()).toHaveValue('10')
      expect(onCommit).not.toHaveBeenCalled()
    })

    it('reverts to value on unparseable input commit', async () => {
      const onCommit = vi.fn()
      renderInput({ value: 10, onCommit })

      await userEvent.clear(input())
      await userEvent.type(input(), 'abc')
      await userEvent.keyboard('{Enter}')

      expect(input()).toHaveValue('10')
      expect(onCommit).not.toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has an accessible name from the label prop', () => {
      renderInput({ label: 'Width' })
      expect(input()).toHaveAccessibleName('Width')
    })

    it('prefix and suffix are aria-hidden', () => {
      renderInput({ prefix: 'W', suffix: 'px' })
      const hiddenEls = document.querySelectorAll('[aria-hidden="true"]')
      const texts = Array.from(hiddenEls).map((el) => el.textContent)
      expect(texts).toContain('W')
      expect(texts).toContain('px')
    })

    it('clicking the container focuses the input', async () => {
      renderInput({ prefix: 'X' })
      const prefixEl = screen.getByText('X')
      await userEvent.click(prefixEl)
      expect(input()).toHaveFocus()
    })

    it('renders a falsy numeric affix (0) as an aria-hidden slot', () => {
      renderInput({ prefix: 0 })
      const zero = screen.getByText('0')
      expect(zero).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('onChange (live preview)', () => {
    it('fires onChange on every valid keystroke', async () => {
      const onChange = vi.fn()
      renderInput({ value: 10, onChange })

      await userEvent.clear(input())
      await userEvent.type(input(), '5')

      expect(onChange).toHaveBeenCalledWith(5)
    })

    it('fires onChange on arrow step', async () => {
      const onChange = vi.fn()
      renderInput({ value: 10, step: 1, onChange })

      input().focus()
      await userEvent.keyboard('{ArrowUp}')

      expect(onChange).toHaveBeenCalledWith(11)
    })

    it('clamps the previewed value while typing past max', async () => {
      const onChange = vi.fn()
      renderInput({ value: 10, max: 100, onChange })

      await userEvent.clear(input())
      await userEvent.type(input(), '200')

      expect(onChange).toHaveBeenLastCalledWith(100)
    })
  })
})
