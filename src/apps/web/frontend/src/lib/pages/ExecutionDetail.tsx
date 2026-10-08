import { useParams } from 'react-router-dom'
import { ExecutionDetailWidget } from '$widgets/workflows'

export default function ExecutionDetail() {
  const { id } = useParams<{ id: string }>()
  return <ExecutionDetailWidget key={id ?? 'new'} executionId={id} />
}
