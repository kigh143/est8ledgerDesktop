import { createFileRoute } from '@tanstack/react-router'
import PropertiesLayout from '../../componennts/PropertiesLayout'

export const Route = createFileRoute('/properties/settings')({
  component: RouteComponent,
})

function RouteComponent() {
    return <PropertiesLayout pageTitle='Settings' subTitle='sub'>
      <></>
    </PropertiesLayout>
}
