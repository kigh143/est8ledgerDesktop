import { createFileRoute } from '@tanstack/react-router'
import PropertiesLayout from '../../componennts/PropertiesLayout'

export const Route = createFileRoute('/properties/add')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PropertiesLayout pageTitle='Add Property' subTitle='sub'>
    <></>
  </PropertiesLayout>
}
