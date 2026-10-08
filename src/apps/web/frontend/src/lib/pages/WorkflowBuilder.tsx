import { useParams } from 'react-router-dom'
import { WorkflowBuilderWidget } from '$widgets/workflows'

export default function WorkflowBuilder() {
  const { id } = useParams<{ id: string }>()
  return <WorkflowBuilderWidget key={id ?? 'new'} workflowId={id} />
}
