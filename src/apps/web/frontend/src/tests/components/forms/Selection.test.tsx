import { useState } from 'react'
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Select from '$components/forms/Select'
import Radio from '$components/forms/Radio'
import Checkbox from '$components/forms/Checkbox'
function RichChoice() {
  const [value, setValue] = useState('one')
  return (
    <Select
      presentation="rich"
      aria-label="Model"
      value={value}
      onValueChange={setValue}
      options={[
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' },
      ]}
    />
  )
}
it('rich selection supports arrows, Enter, Escape and empty choices', async () => {
  const user = userEvent.setup(),
    view = render(<RichChoice />)
  await user.click(screen.getByRole('button', { name: 'Model' }))
  await user.keyboard('{ArrowDown}{Enter}')
  expect(screen.getByRole('button', { name: 'Model' })).toHaveTextContent('Two')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Model' }))
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Model' })).toHaveFocus()
  view.rerender(<Select presentation="rich" value="unknown" options={[]} aria-label="Empty" />)
  expect(screen.getByRole('button', { name: 'Empty' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Empty' })).toHaveTextContent('unknown')
})

function Choices() {
  const [choice, setChoice] = useState('a'),
    [checked, setChecked] = useState(false)
  return (
    <>
      <Radio
        name="letters"
        presentation="card"
        label="Letter"
        value={choice}
        onChange={setChoice}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />
      <Checkbox presentation="chip" checked={checked} onChange={setChecked} label="Enabled" />
    </>
  )
}
it('choice variants retain native radio and checkbox keyboard semantics', async () => {
  const user = userEvent.setup()
  render(<Choices />)
  screen.getByRole('radio', { name: 'A' }).focus()
  await user.keyboard('{ArrowRight}')
  expect(screen.getByRole('radio', { name: 'B' })).toBeChecked()
  screen.getByRole('checkbox', { name: 'Enabled' }).focus()
  await user.keyboard(' ')
  expect(screen.getByRole('checkbox', { name: 'Enabled' })).toBeChecked()
})
