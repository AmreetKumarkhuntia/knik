import LoadingSpinner from '../feedback/LoadingSpinner'
import JsonViewer from './JsonViewer'
import type { StructuredOutputProps } from '$types/components/chat'

export default function StructuredOutput({
  inputs,
  outputs,
  loading,
  onCopy,
  copied,
}: StructuredOutputProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-fg-1 text-xl font-bold">Structured Output</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12 knik-glass rounded-lg">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <JsonViewer
          data={{ Outputs: outputs, Inputs: inputs }}
          tabs={['Outputs', 'Inputs']}
          onCopy={onCopy}
          copied={copied}
        />
      )}
    </div>
  )
}
