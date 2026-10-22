import { createFileRoute } from '@tanstack/react-router'
import PropertiesLayout from '../../componennts/PropertiesLayout'

export const Route = createFileRoute('/properties/$propertyId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PropertiesLayout pageTitle='page' subTitle='sub'>
    <></>
  </PropertiesLayout>
}
