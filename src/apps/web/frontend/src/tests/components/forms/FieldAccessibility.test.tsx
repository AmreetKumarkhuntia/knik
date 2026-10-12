import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Input from '$components/forms/Input'
import Textarea from '$components/forms/Textarea'

it('preserves hint and error associations on canonical text controls', () => {
  render(
    <>
      <p id="hint">A useful hint</p>
      <Input aria-label="Name" aria-describedby="hint" error="Name is required" />
      <Textarea aria-label="Details" aria-describedby="hint" error="Details are required" />
    </>
  )
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAccessibleDescription(
    'A useful hint Name is required'
  )
  expect(screen.getByRole('textbox', { name: 'Details' })).toHaveAccessibleDescription(
    'A useful hint Details are required'
  )
})
