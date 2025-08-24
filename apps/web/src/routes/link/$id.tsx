import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/link/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/link/$id"!</div>
}
