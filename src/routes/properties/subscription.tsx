import { createFileRoute } from '@tanstack/react-router'
import PropertiesLayout from '../../componennts/PropertiesLayout'

export const Route = createFileRoute('/properties/subscription')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PropertiesLayout pageTitle='Subscription' subTitle='sub'>
    <></>
  </PropertiesLayout>
}
