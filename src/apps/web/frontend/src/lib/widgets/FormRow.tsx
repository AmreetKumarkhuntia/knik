import type { FormRowProps } from '$types/widgets'
import FormField from './FormField'
export default function FormRow(props: FormRowProps) {
  return <FormField {...props} layout="row" />
}
