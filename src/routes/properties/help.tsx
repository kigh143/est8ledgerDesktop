import { createFileRoute } from '@tanstack/react-router'
import PropertiesLayout from '../../componennts/PropertiesLayout'

export const Route = createFileRoute('/properties/help')({
  component: RouteComponent,
})

function RouteComponent() {
    return <PropertiesLayout pageTitle='Help &  Support' subTitle='sub'>
      <></>
    </PropertiesLayout>
}
